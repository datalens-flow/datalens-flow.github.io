/** Pure client-side SQL formatter and auto-prettifier */
export const formatSql = (sql: string): string => {
  if (!sql.trim()) return '';

  let formatted = sql;

  // Major SQL Clause keywords to force onto new lines
  const majorClauseKeywords = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 
    'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'JOIN',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'WITH'
  ];

  // Capitalize SQL Keywords
  const keywords = [
    'select', 'from', 'where', 'and', 'or', 'as', 'on', 'join', 'left', 'right', 'inner', 'outer', 'full',
    'group', 'by', 'order', 'by', 'having', 'limit', 'top', 'insert', 'into', 'values', 'update', 'set',
    'delete', 'create', 'table', 'with', 'case', 'when', 'then', 'else', 'end', 'is', 'null', 'not',
    'distinct', 'union', 'all', 'in', 'between', 'like', 'coalesce', 'nvl', 'sysdate', 'getdate'
  ];

  // Uppercase keywords
  keywords.forEach(kw => {
    const reg = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(reg, kw.toUpperCase());
  });

  // Break lines before major clauses
  majorClauseKeywords.forEach(clause => {
    const reg = new RegExp(`\\s+(${clause.replace(/ /g, '\\s+')})\\b`, 'gi');
    formatted = formatted.replace(reg, '\n$1');
  });

  // Format comma-separated lists in SELECT and GROUP BY gracefully
  const lines = formatted.split('\n');
  const resultLines: string[] = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (/^(FROM|WHERE|GROUP BY|HAVING|ORDER BY|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|FULL JOIN|VALUES|SET)/i.test(trimmed)) {
      resultLines.push(trimmed);
    } else if (/^(SELECT|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE|WITH)/i.test(trimmed)) {
      resultLines.push(trimmed);
    } else {
      resultLines.push(`  ${trimmed}`);
    }
  });

  return resultLines.join('\n');
};

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  lineNumOriginal?: number;
  lineNumConverted?: number;
}

/** Compute line-by-line diff between Source SQL and Transpiled SQL */
export const computeSqlDiff = (sourceSql: string, targetSql: string): DiffLine[] => {
  const sourceLines = sourceSql.split('\n');
  const targetLines = targetSql.split('\n');
  const diff: DiffLine[] = [];

  const maxLen = Math.max(sourceLines.length, targetLines.length);

  for (let i = 0; i < maxLen; i++) {
    const src = sourceLines[i];
    const tgt = targetLines[i];

    if (src !== undefined && tgt !== undefined) {
      if (src.trim() === tgt.trim()) {
        diff.push({ type: 'unchanged', text: tgt, lineNumOriginal: i + 1, lineNumConverted: i + 1 });
      } else {
        diff.push({ type: 'removed', text: src, lineNumOriginal: i + 1 });
        diff.push({ type: 'added', text: tgt, lineNumConverted: i + 1 });
      }
    } else if (src !== undefined) {
      diff.push({ type: 'removed', text: src, lineNumOriginal: i + 1 });
    } else if (tgt !== undefined) {
      diff.push({ type: 'added', text: tgt, lineNumConverted: i + 1 });
    }
  }

  return diff;
};
