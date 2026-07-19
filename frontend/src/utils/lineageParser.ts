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

  // Find all WITH blocks (can appear anywhere, not just at start)
  const cteBlockMatches = [...cleanSql.matchAll(/\bwith\s+([\s\S]+?)(?=\s*(?:insert|update|delete|merge)\s)/gi)];
  cteBlockMatches.forEach(cteBlockMatch => {
    const cteBlock = cteBlockMatch[1];
    // Match CTE definitions carefully handling nested parens
    const cteDefRegex = /(\w+)\s+as\s*\(/gi;
    let match;
    while ((match = cteDefRegex.exec(cteBlock)) !== null) {
      const cteName = match[1].toLowerCase();
      if (SQL_KEYWORDS.has(cteName)) continue;
      cteNames.add(cteName);

      // Extract FROM/JOIN tables inside this CTE's body
      const startIdx = match.index + match[0].length;
      let depth = 1;
      let endIdx = startIdx;
      for (let i = startIdx; i < cteBlock.length && depth > 0; i++) {
        if (cteBlock[i] === '(') depth++;
        if (cteBlock[i] === ')') depth--;
        endIdx = i;
      }
      const cteBody = cteBlock.substring(startIdx, endIdx);
      const fromMatches = [...cteBody.matchAll(/(?:from|join)\s+([\w.]+)/gi)];
      const realSources: string[] = [];
      fromMatches.forEach(m => {
        const tbl = extractTableName(m[1]);
        if (!SQL_KEYWORDS.has(tbl)) realSources.push(tbl);
      });
      cteToRealSources[cteName] = realSources;
    }
  });

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
      const firstToken = expr.split(/\s+/)[0]; // ignore AS alias
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
        const selectExprs = selectMatch[1].split(',').map(c => c.trim().replace(/\s+/g, ' '));

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
