export const mapType = (type: string, targetDialect: string): string => {
  const t = type.toUpperCase().trim();
  if (targetDialect === 'oracle') {
    if (t.startsWith('VARCHAR')) return t.replace('VARCHAR', 'VARCHAR2');
    if (t === 'INT' || t === 'INTEGER') return 'NUMBER(10)';
    if (t === 'BOOLEAN') return 'NUMBER(1)';
  } else if (targetDialect === 'mysql') {
    if (t === 'BOOLEAN') return 'TINYINT(1)';
  } else if (targetDialect === 'sqlite') {
    if (t.startsWith('VARCHAR') || t === 'TEXT') return 'TEXT';
    if (t.startsWith('DECIMAL') || t === 'FLOAT' || t === 'DOUBLE') return 'REAL';
  } else if (targetDialect === 'postgres') {
    if (t.startsWith('VARCHAR2')) return t.replace('VARCHAR2', 'VARCHAR');
    if (t === 'NUMBER(10)') return 'INT';
    if (t === 'NUMBER(1)') return 'BOOLEAN';
    if (t === 'TINYINT(1)') return 'BOOLEAN';
  }
  return t;
};
