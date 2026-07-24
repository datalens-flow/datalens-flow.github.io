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
    'distinct', 'union', 'all', 'in', 'between', 'like', 'default'
  ];

  // 1. Uppercase keywords
  keywords.forEach(kw => {
    const reg = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(reg, kw.toUpperCase());
  });

  // 2. Break lines before major clauses
  majorClauseKeywords.forEach(clause => {
    const reg = new RegExp(`\\s+(${clause.replace(/ /g, '\\s+')})\\b`, 'gi');
    formatted = formatted.replace(reg, '\n$1');
  });

  // 3. Process lines to preserve empty lines between statements & indentation
  const rawLines = formatted.split('\n');
  const resultLines: string[] = [];

  rawLines.forEach((line) => {
    const trimmed = line.trim();

    // PRESERVE EMPTY LINES (as requested in Image 2!)
    if (!trimmed) {
      if (resultLines.length > 0 && resultLines[resultLines.length - 1] !== '') {
        resultLines.push('');
      }
      return;
    }

    // Top-level statement starters (CREATE TABLE, INSERT INTO, SELECT, etc.)
    const isTopStatement = /^(CREATE TABLE|INSERT INTO|SELECT|UPDATE|DELETE FROM|WITH)\b/i.test(trimmed);

    // Auto-insert a blank line before new top-level statement if not already after empty line or comment
    if (
      isTopStatement &&
      resultLines.length > 0 &&
      resultLines[resultLines.length - 1] !== '' &&
      !resultLines[resultLines.length - 1].startsWith('--') &&
      !resultLines[resultLines.length - 1].startsWith('/*')
    ) {
      // Check if previous line is part of a previous statement (like ');' or a clause)
      const prevLine = resultLines[resultLines.length - 1];
      if (/;$/.test(prevLine) || /^\);?$/.test(prevLine) || /^(WHERE|ORDER BY|GROUP BY|VALUES)/i.test(prevLine)) {
        resultLines.push('');
      }
    }

    // Preserve comments
    if (trimmed.startsWith('--') || trimmed.startsWith('/*')) {
      resultLines.push(trimmed);
      return;
    }

    // Preserve existing column indentation inside CREATE TABLE or query bodies
    if (line.startsWith('  ') || line.startsWith('\t')) {
      resultLines.push(line);
    } else if (/^(FROM|WHERE|GROUP BY|HAVING|ORDER BY|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|FULL JOIN|VALUES|SET)/i.test(trimmed)) {
      resultLines.push(trimmed);
    } else if (isTopStatement || /^\);?$/.test(trimmed)) {
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
