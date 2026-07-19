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

export const parseLineage = (sql: string): LineageResult => {
  const allFlows: LineageFlow[] = [];
  const tableRoles: Record<string, { isSource: boolean; isTarget: boolean }> = {};

  // Remove comments
  const cleanSql = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');

  // Split into separate statements
  const statements = cleanSql.split(';').map(s => s.trim()).filter(s => s.length > 0);

  statements.forEach((stmt) => {
    let targetTable = '';
    let targetCols: string[] = [];
    let isInsert = false;
    let isUpdate = false;

    // --- Detect Target Table ---
    const insertMatch = stmt.match(/insert\s+into\s+(\w+)\s*(?:\(([^)]+)\))?/i);
    const createMatch = stmt.match(/create\s+(?:table|view)\s+(\w+)\s+as\s/i);
    const updateMatch = stmt.match(/update\s+(\w+)(?:\s+(\w+))?\s+set\s/i);
    const mergeMatch = stmt.match(/merge\s+into\s+(\w+)\s+/i);

    if (insertMatch) {
      targetTable = insertMatch[1].toLowerCase();
      if (insertMatch[2]) {
        targetCols = insertMatch[2].split(',').map(c => c.trim().toLowerCase());
      }
      isInsert = true;
    } else if (createMatch) {
      targetTable = createMatch[1].toLowerCase();
      isInsert = true;
    } else if (updateMatch) {
      targetTable = updateMatch[1].toLowerCase();
      isUpdate = true;
    } else if (mergeMatch) {
      targetTable = mergeMatch[1].toLowerCase();
    } else {
      return; // skip DELETE-only, etc.
    }

    // Mark target role
    if (!tableRoles[targetTable]) tableRoles[targetTable] = { isSource: false, isTarget: false };
    tableRoles[targetTable].isTarget = true;

    // --- Build alias → table mapping from FROM / JOIN / USING ---
    const aliasMap: Record<string, string> = {};
    const aliasMatches = [...stmt.matchAll(/(?:from|join|using)\s+(\w+)(?:\s+(?:as\s+)?(\w+))?/gi)];
    aliasMatches.forEach(m => {
      const tableName = m[1].toLowerCase();
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

    // Source tables = all aliased tables EXCEPT the target of this statement
    const sourceTables = [...new Set(Object.values(aliasMap))].filter(t => t !== targetTable);

    // Mark source roles
    sourceTables.forEach(srcTable => {
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
  });

  // Build final source/target lists from tableRoles
  // A table CAN appear in BOTH lists (dual-role)
  const sources = Object.entries(tableRoles).filter(([, r]) => r.isSource).map(([t]) => t);
  const targets = Object.entries(tableRoles).filter(([, r]) => r.isTarget).map(([t]) => t);

  return { sources, targets, flows: allFlows };
};

export default parseLineage;
