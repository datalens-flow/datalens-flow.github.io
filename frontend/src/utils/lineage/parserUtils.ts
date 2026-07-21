import { SQL_KEYWORDS } from './types';

/** Check if an expression is NOT a real source column (literals, functions, etc.) */
export const isNonColumnExpr = (expr: string): boolean => {
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
export const extractTableName = (name: string): string => {
  const unquoted = name.replace(/['"`[\]]/g, '').trim();
  const parts = unquoted.split('.');
  return parts[parts.length - 1].toLowerCase();
};

/** Helper: resolve "alias.col" or "col" to { table, col } */
export const resolveColumn = (
  expr: string,
  aliasMap: Record<string, string>,
  sourceTables: string[],
  cleanStmt: string
): { table: string; col: string } | null => {
  if (isNonColumnExpr(expr)) return null;

  let cleanExpr = expr.replace(/['"`[\]]/g, '').trim();
  
  // Strip JSON operators (->, ->>) to avoid interference with column name matching
  if (cleanExpr.includes('->')) {
    cleanExpr = cleanExpr.split('->')[0].trim();
  }

  // Check if expression is a subquery: (SELECT col FROM subtable WHERE ...)
  // We extract the projected column and the source table of the subquery
  const subqueryMatch = cleanExpr.match(/^\(\s*select\s+([\s\S]+?)\s+from\s+([\w.]+)(?:\s+(?:as\s+)?(\w+))?/i);
  if (subqueryMatch) {
    const subqueryInnerExpr = subqueryMatch[1].trim();
    const subqueryTable = extractTableName(subqueryMatch[2]);
    const subqueryAlias = subqueryMatch[3] ? subqueryMatch[3].toLowerCase() : subqueryTable;
    
    // Temporarily map the subquery alias
    const tempAliasMap: Record<string, string> = { ...aliasMap, [subqueryAlias]: subqueryTable, [subqueryTable]: subqueryTable };
    
    // Resolve the inner expression with a sub-call using tempAliasMap
    const innerResolved = resolveColumn(subqueryInnerExpr, tempAliasMap, sourceTables, cleanStmt);
    if (innerResolved) {
      const resolvedTable = tempAliasMap[innerResolved.table] || subqueryTable;
      return { table: resolvedTable, col: innerResolved.col };
    }
    return { table: subqueryTable, col: '*' };
  }

  // If it contains CASE WHEN, we extract the first column mentioned or treat it as a general flow if too complex
  if (cleanExpr.toLowerCase().startsWith('case ')) {
    const match = cleanExpr.match(/(?:then|else)\s+([\w.]+)/i);
    if (match) {
      cleanExpr = match[1];
    }
  }

  // Strip SQL function wrappers like UPPER(, TRIM(, COALESCE(, ROUND(, GREATEST(, LEAST(, MAX(, MIN(, SUM(, AVG(, COUNT(
  // by grabbing the column/alias identifier inside (supports optional leading parenthesises)
  const funcMatch = cleanExpr.match(/\b(?:upper|trim|coalesce|round|lower|abs|nullif|concat|nvl|greatest|least|max|min|sum|avg|count)\s*\(\s*\(?\s*([\w.]+)/i);
  if (funcMatch) {
    cleanExpr = funcMatch[1];
  }

  // Extract the first alphanumeric string with optional dot (representing table.col or col)
  // ignoring operators like -, +, *, /, numbers, parentheses, and SQL function names
  const colIdMatch = cleanExpr.match(/\b([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)?)\b/);
  if (!colIdMatch) return null;
  
  const firstToken = colIdMatch[1].toLowerCase();
  // Ignore known SQL keywords, functions, or non-column indicators
  const ignoredWords = new Set([
    ...SQL_KEYWORDS, 'upper', 'trim', 'coalesce', 'round', 'lower', 'abs', 'nullif', 'concat', 'nvl', 'greatest', 'least', 'max', 'min', 'sum', 'avg', 'count'
  ]);
  if (ignoredWords.has(firstToken) || isNonColumnExpr(firstToken)) return null;

  const dotParts = firstToken.split('.');
  if (dotParts.length === 2) {
    const alias = dotParts[0];
    const col = dotParts[1];

    // Lateral / UNNEST join lookback resolution:
    // If the alias matches tags or any unnested column, look up the UNNEST(source_column) in cleanStmt
    const unnestRegex = new RegExp(`\\bunnest\\s*\\(\\s*([\\w.]+)\\s*\\)\\s*(?:as\\s+)?${alias}\\b`, 'i');
    const unnestMatch = cleanStmt.match(unnestRegex);
    if (unnestMatch) {
      return resolveColumn(unnestMatch[1], aliasMap, sourceTables, cleanStmt);
    }

    const table = aliasMap[alias] || sourceTables[0] || 'unknown';
    return { table, col };
  }
  return { table: sourceTables[0] || 'unknown', col: dotParts[0] };
};
