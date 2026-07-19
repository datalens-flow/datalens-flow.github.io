export interface LineageFlow {
  sourceTable: string;
  sourceCol: string;
  targetTable: string;
  targetCol: string;
}

export interface LineageResult {
  sources: string[];
  targets: string[];
  flows: LineageFlow[];
}

const SQL_KEYWORDS = new Set([
  'select', 'set', 'where', 'on', 'and', 'or', 'not', 'null',
  'inner', 'outer', 'left', 'right', 'cross', 'natural', 'full', 'into',
  'values', 'group', 'order', 'having', 'limit', 'offset', 'as', 'case',
  'when', 'then', 'else', 'end', 'between', 'like', 'in', 'exists', 'is',
  'delete', 'insert', 'update', 'merge', 'using', 'matched', 'by',
]);

/** Check if an expression is NOT a real source column (literals, functions, etc.) */
const isNonColumnExpr = (expr: string): boolean => {
  const t = expr.trim().toLowerCase();
  // Known non-column expressions
  if (['current_timestamp', 'now()', 'getdate()', 'sysdate', 'current_date', 'null'].includes(t)) return true;
  // String literal
  if (/^'[^']*'$/.test(t)) return true;
  // Numeric literal
  if (/^\d+(\.\d+)?$/.test(t)) return true;
  return false;
};

/** Extract table name from possibly schema-qualified identifier (schema.table → table) */
const extractTableName = (name: string): string => {
  const parts = name.split('.');
  return parts[parts.length - 1].toLowerCase();
};

export const parseLineage = (sql: string): LineageResult => {
  const allFlows: LineageFlow[] = [];
  const tableRoles: Record<string, { isSource: boolean; isTarget: boolean }> = {};

  // Remove comments
  const cleanSql = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');

  // --- Extract CTEs (WITH ... AS (...)) ---
  // CTE names are virtual tables — not real source/target
  const cteNames = new Set<string>();
  // Map CTE name → real source tables it reads from
  const cteToRealSources: Record<string, string[]> = {};

  // Extract CTE block using parenthesis depth parsing
  // Find "WITH" blocks anywhere in the cleanSql. Since WITH can be part of multiple statements,
  // we look for matches of '\bwith\b' and scan forward to find where the block ends.
  const cleanSqlLower = cleanSql.toLowerCase();
  let searchPos = 0;
  while (true) {
    const withIdx = cleanSqlLower.indexOf('with', searchPos);
    if (withIdx === -1) break;

    // Check boundary
    const isWordBoundary = (withIdx === 0 || !/[a-zA-Z0-9_]/.test(cleanSql[withIdx - 1])) &&
                           (withIdx + 4 >= cleanSql.length || !/[a-zA-Z0-9_]/.test(cleanSql[withIdx + 4]));

    if (!isWordBoundary) {
      searchPos = withIdx + 4;
      continue;
    }

    // Scan forward from withIdx + 4 to find the DML statement starting at depth 0
    let depth = 0;
    let mainActionIdx = -1;
    for (let i = withIdx + 4; i < cleanSql.length; i++) {
      if (cleanSql[i] === '(') depth++;
      if (cleanSql[i] === ')') depth--;
      if (depth === 0) {
        // Look for DML keywords starting at depth 0
        const sub = cleanSqlLower.substring(i).trim();
        if (sub.startsWith('select') || sub.startsWith('insert') || sub.startsWith('update') || sub.startsWith('delete') || sub.startsWith('merge')) {
          mainActionIdx = i;
          break;
        }
      }
    }

    const cteBlock = cleanSql.substring(withIdx + 4, mainActionIdx !== -1 ? mainActionIdx : cleanSql.length);
    
    // Parse individual CTEs in this chained declaration list (delimited by commas at depth 0)
    let currentPos = 0;
    while (currentPos < cteBlock.length) {
      // Find the next CTE name 'name AS ('
      const nextAsMatch = cteBlock.substring(currentPos).match(/\b(\w+)\s+as\s*\(/i);
      if (!nextAsMatch || nextAsMatch.index === undefined) break;

      const cteName = nextAsMatch[1].toLowerCase();
      const matchStartInBlock = currentPos + nextAsMatch.index;
      const bodyStart = matchStartInBlock + nextAsMatch[0].length;

      // Track depth to find matching closing paren of the CTE body
      let depthInner = 1;
      let bodyEnd = bodyStart;
      for (let i = bodyStart; i < cteBlock.length && depthInner > 0; i++) {
        if (cteBlock[i] === '(') depthInner++;
        if (cteBlock[i] === ')') depthInner--;
        bodyEnd = i;
      }

      if (!SQL_KEYWORDS.has(cteName)) {
        cteNames.add(cteName);
        
        const cteBody = cteBlock.substring(bodyStart, bodyEnd);
        // Find base tables inside the CTE's FROM/JOIN clauses (case insensitive)
        const fromMatches = [...cteBody.matchAll(/\b(?:from|join)\s+([\w.]+)/gi)];
        const realSources: string[] = [];
        fromMatches.forEach(m => {
          const tbl = extractTableName(m[1]);
          if (!SQL_KEYWORDS.has(tbl)) {
            realSources.push(tbl);
          }
        });
        cteToRealSources[cteName] = realSources;
      }

      // Advance search position past this CTE body
      currentPos = bodyEnd + 1;
      // Skip comma delimiter if any
      const commaSearch = cteBlock.substring(currentPos).match(/\s*,\s*/);
      if (commaSearch && commaSearch.index === 0) {
        currentPos += commaSearch[0].length;
      }
    }

    searchPos = mainActionIdx !== -1 ? mainActionIdx : cleanSql.length;
  }

  // Resolve CTE chains: if a CTE references another CTE, follow the chain to find real tables
  const resolveCteSources = (cteName: string, visited = new Set<string>()): string[] => {
    if (visited.has(cteName)) return [];
    visited.add(cteName);
    const directSources = cteToRealSources[cteName] || [];
    const resolved: string[] = [];
    directSources.forEach(src => {
      if (cteNames.has(src)) {
        resolved.push(...resolveCteSources(src, visited));
      } else {
        resolved.push(src);
      }
    });
    return [...new Set(resolved)];
  };



  // Split into separate statements
  const statements = cleanSql.split(';').map(s => s.trim()).filter(s => s.length > 0);

  statements.forEach((stmt) => {
    let targetTable = '';
    let targetCols: string[] = [];
    let isInsert = false;
    let isUpdate = false;
    let isMerge = false;

    // --- Detect Target Table (supports schema.table notation) ---
    const insertMatch = stmt.match(/insert\s+into\s+([\w.]+)\s*(?:\(([^)]+)\))?/i);
    const createMatch = stmt.match(/create\s+(?:table|view)\s+([\w.]+)\s+as\s/i);
    const updateMatch = stmt.match(/update\s+([\w.]+)(?:\s+(\w+))?\s+set\s/i);
    const mergeMatch = stmt.match(/merge\s+into\s+([\w.]+)\s+/i);

    if (insertMatch) {
      targetTable = extractTableName(insertMatch[1]);
      if (insertMatch[2]) {
        targetCols = insertMatch[2].split(',').map(c => c.trim().toLowerCase());
      }
      isInsert = true;
    } else if (createMatch) {
      targetTable = extractTableName(createMatch[1]);
      isInsert = true;
    } else if (updateMatch) {
      targetTable = extractTableName(updateMatch[1]);
      isUpdate = true;
    } else if (mergeMatch) {
      targetTable = extractTableName(mergeMatch[1]);
      isMerge = true;
    } else {
      return; // skip DELETE-only, etc.
    }

    // Mark target role
    if (!tableRoles[targetTable]) tableRoles[targetTable] = { isSource: false, isTarget: false };
    tableRoles[targetTable].isTarget = true;

    // --- Build alias → table mapping from FROM / JOIN / USING ---
    const aliasMap: Record<string, string> = {};
    const aliasMatches = [...stmt.matchAll(/(?:from|join|using)\s+([\w.]+)(?:\s+(?:as\s+)?(\w+))?/gi)];
    aliasMatches.forEach(m => {
      const tableName = extractTableName(m[1]);
      if (SQL_KEYWORDS.has(tableName)) return;
      const alias = m[2] && !SQL_KEYWORDS.has(m[2].toLowerCase()) ? m[2].toLowerCase() : tableName;
      aliasMap[alias] = tableName;
      // Also map the table name itself to the table name to handle full table name qualification
      aliasMap[tableName] = tableName;
    });

    // For UPDATE, also capture the target table alias (e.g., UPDATE dim_customer d SET ...)
    if (isUpdate && updateMatch && updateMatch[2]) {
      const possibleAlias = updateMatch[2].toLowerCase();
      if (!SQL_KEYWORDS.has(possibleAlias)) {
        aliasMap[possibleAlias] = targetTable;
      }
    }

    // --- Resolve CTE references to real source tables ---
    // If aliasMap has a CTE name, replace it with the real source tables
    const cteAliasExpansions: Record<string, string[]> = {};
    Object.entries(aliasMap).forEach(([alias, tableName]) => {
      if (cteNames.has(tableName)) {
        const realSources = resolveCteSources(tableName);
        cteAliasExpansions[alias] = realSources;
        // Replace the CTE name with the first real source for column resolution
        if (realSources.length > 0) {
          aliasMap[alias] = realSources[0];
        } else {
          // If a CTE matches no real source, delete it from aliasMap so it's not treated as a real table
          delete aliasMap[alias];
        }
      }
    });

    // Clean up aliasMap values so that no CTE names remain
    Object.keys(aliasMap).forEach(key => {
      if (cteNames.has(aliasMap[key])) {
        const realSources = resolveCteSources(aliasMap[key]);
        if (realSources.length > 0) {
          aliasMap[key] = realSources[0];
        } else {
          delete aliasMap[key];
        }
      }
    });

    // Source tables = all aliased tables EXCEPT the target and CTEs
    const sourceTables = [...new Set(Object.values(aliasMap))]
      .filter(t => t !== targetTable && !cteNames.has(t));

    // Also add any additional real sources from CTE expansion
    Object.values(cteAliasExpansions).forEach(realSources => {
      realSources.forEach(src => {
        if (src !== targetTable && !sourceTables.includes(src)) {
          sourceTables.push(src);
        }
      });
    });

    // Mark source roles (skip CTE names)
    sourceTables.forEach(srcTable => {
      if (cteNames.has(srcTable)) return;
      if (!tableRoles[srcTable]) tableRoles[srcTable] = { isSource: false, isTarget: false };
      tableRoles[srcTable].isSource = true;
    });

    // --- Helper: resolve "alias.col" or "col" to { table, col } ---
    const resolveColumn = (expr: string): { table: string; col: string } | null => {
      if (isNonColumnExpr(expr)) return null;

      // Extract the target identifier from nested expressions, functions, or parentheses
      // e.g. UPPER(TRIM(customer_name)) -> customer_name
      // e.g. COALESCE(gender, 'U') -> gender
      // e.g. CASE WHEN ... -> skip or match first column identifier
      let cleanExpr = expr.trim();
      
      // If it contains CASE WHEN, we extract the first column mentioned or treat it as a general flow if too complex
      if (cleanExpr.toLowerCase().startsWith('case ')) {
        const match = cleanExpr.match(/(?:then|else)\s+([\w.]+)/i);
        if (match) {
          cleanExpr = match[1];
        }
      }

      // Strip SQL function wrappers like UPPER(, TRIM(, COALESCE(, ROUND(
      // by grabbing the column/alias identifier inside
      const funcMatch = cleanExpr.match(/\b(?:upper|trim|coalesce|round|lower|abs|nullif|concat|nvl)\s*\(\s*([\w.]+)/i);
      if (funcMatch) {
        cleanExpr = funcMatch[1];
      }

      // Strip any residual parentheses or punctuation
      cleanExpr = cleanExpr.replace(/[()]/g, '').trim();

      const firstToken = cleanExpr.split(/\s+/)[0]; // ignore AS alias
      if (!firstToken || isNonColumnExpr(firstToken)) return null;

      const dotParts = firstToken.split('.');
      if (dotParts.length === 2) {
        const alias = dotParts[0].toLowerCase();
        const col = dotParts[1].toLowerCase();
        const table = aliasMap[alias] || sourceTables[0] || 'unknown';
        return { table, col };
      }
      return { table: sourceTables[0] || 'unknown', col: dotParts[0].toLowerCase() };
    };

    // --- Parse INSERT...SELECT column mapping ---
    if (isInsert) {
      // Multi-line SELECT support: [\s\S]+? crosses newlines
      const selectMatch = stmt.match(/select\s+([\s\S]+?)\s+from\s/i);
      if (selectMatch && targetCols.length > 0) {
        // Depth-aware splitting of SELECT expressions to avoid breaking on commas inside functions e.g. COALESCE(pm.promotion_key,-1)
        const selectText = selectMatch[1];
        const selectExprs: string[] = [];
        let currentExpr = '';
        let parenDepth = 0;
        
        for (let i = 0; i < selectText.length; i++) {
          const char = selectText[i];
          if (char === '(') parenDepth++;
          if (char === ')') parenDepth--;
          
          if (char === ',' && parenDepth === 0) {
            selectExprs.push(currentExpr.trim().replace(/\s+/g, ' '));
            currentExpr = '';
          } else {
            currentExpr += char;
          }
        }
        if (currentExpr.trim()) {
          selectExprs.push(currentExpr.trim().replace(/\s+/g, ' '));
        }

        selectExprs.forEach((expr, idx) => {
          const targetCol = targetCols[idx];
          if (!targetCol) return;

          const resolved = resolveColumn(expr);
          if (!resolved) return; // skip CURRENT_TIMESTAMP, literals, etc.

          allFlows.push({
            sourceTable: resolved.table,
            sourceCol: resolved.col,
            targetTable,
            targetCol,
          });
        });
      } else if (sourceTables.length > 0) {
        // Fallback: table-level flow
        sourceTables.forEach(srcTable => {
          allFlows.push({ sourceTable: srcTable, sourceCol: '*', targetTable, targetCol: '*' });
        });
      }
    }

    // --- Parse UPDATE...SET column mapping ---
    if (isUpdate) {
      const setMatch = stmt.match(/\bset\s+([\s\S]+?)(?:\bfrom\b|\bwhere\b|$)/i);
      if (setMatch) {
        const assignments = setMatch[1].split(',').map(a => a.trim());

        assignments.forEach(assignment => {
          const eqIdx = assignment.indexOf('=');
          if (eqIdx === -1) return;

          const leftSide = assignment.substring(0, eqIdx).trim();
          const rightSide = assignment.substring(eqIdx + 1).trim();

          // Target column (strip alias prefix like d.customer_name → customer_name)
          const targetCol = leftSide.split('.').pop()?.toLowerCase() || '';

          const resolved = resolveColumn(rightSide);
          if (!resolved) return;

          allFlows.push({
            sourceTable: resolved.table,
            sourceCol: resolved.col,
            targetTable,
            targetCol,
          });
        });
      }
    }

    // --- Parse MERGE...USING for table-level flows ---
    if (isMerge) {
      sourceTables.forEach(srcTable => {
        allFlows.push({ sourceTable: srcTable, sourceCol: '*', targetTable, targetCol: '*' });
      });
    }
  });

  // Build final source/target lists from tableRoles
  // A table CAN appear in BOTH lists (dual-role)
  // Filter out CTE names — they are virtual tables
  const sources = Object.entries(tableRoles)
    .filter(([t, r]) => r.isSource && !cteNames.has(t))
    .map(([t]) => t);
  const targets = Object.entries(tableRoles)
    .filter(([t, r]) => r.isTarget && !cteNames.has(t))
    .map(([t]) => t);

  // Also filter flows that reference CTE names as source/target
  const filteredFlows = allFlows.filter(
    f => !cteNames.has(f.sourceTable) && !cteNames.has(f.targetTable)
  );

  return { sources, targets, flows: filteredFlows };
};

export default parseLineage;
