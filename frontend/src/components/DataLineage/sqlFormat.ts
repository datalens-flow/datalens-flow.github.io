// Lightweight SQL formatter — no external dependencies

export function formatSql(sql: string): string {
  // Normalize whitespace
  let s = sql.replace(/\r\n/g, '\n').replace(/\t/g, '  ');
  
  // Add newlines before major keywords (only if not already on a new line)
  const majorKeywords = ['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN',
    'INNER JOIN','FULL JOIN','CROSS JOIN','ON','AND','OR','GROUP BY','ORDER BY',
    'HAVING','LIMIT','UNION','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM',
    'CREATE','DROP','ALTER','MERGE INTO','USING','WHEN MATCHED','WHEN NOT MATCHED',
    'BEGIN','END','DECLARE','IF','WHILE','RETURN'];
  
  for (const kw of majorKeywords) {
    const regex = new RegExp(`(?<!\\w)(${kw})(?!\\w)`, 'gi');
    s = s.replace(regex, '\n$1');
  }
  
  // Indent after SELECT, SET, VALUES
  const lines = s.split('\n').map(l => l.trim()).filter(l => l);
  const result: string[] = [];
  let indent = 0;
  
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.startsWith('END') || upper === ')') {
      indent = Math.max(0, indent - 1);
    }
    result.push('  '.repeat(indent) + line);
    if (upper.startsWith('BEGIN') || upper.startsWith('CASE')) {
      indent++;
    }
  }
  
  return result.join('\n');
}
