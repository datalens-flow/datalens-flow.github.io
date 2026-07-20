export const mapType = (type: string, targetDialect: string): string => {
  const t = type.toUpperCase().trim();
  
  // 1. Extract Base Type & Arguments
  let baseType = t;
  let args = '';
  const match = t.match(/^([A-Z0-9_]+)(\s*\(.*\))?/);
  if (match) {
    baseType = match[1];
    args = match[2] || '';
  }

  // 2. Universal Normalization (Convert to Standard SQL types)
  let normalType = baseType;
  if (baseType === 'VARCHAR2' || baseType === 'NVARCHAR2') normalType = 'VARCHAR';
  else if (baseType === 'NUMBER') {
    if (args === '(1)') normalType = 'BOOLEAN';
    else if (args) normalType = 'DECIMAL';
    else normalType = 'INT';
  }
  else if (baseType === 'DATETIME2' || baseType === 'DATETIME') normalType = 'TIMESTAMP';
  else if (baseType === 'BIT' || baseType === 'TINYINT') {
    if (args === '(1)' || baseType === 'BIT') {
      normalType = 'BOOLEAN';
      args = ''; // booleans usually don't have args in standard SQL
    }
  }
  else if (baseType === 'INT64') normalType = 'BIGINT';
  else if (baseType === 'STRING') normalType = 'VARCHAR';

  // 3. Target Dialect Mapping
  switch (targetDialect) {
    case 'oracle':
      if (normalType === 'VARCHAR') return `VARCHAR2${args || '(255)'}`;
      if (normalType === 'INT' || normalType === 'INTEGER' || normalType === 'BIGINT') return `NUMBER(10)`;
      if (normalType === 'BOOLEAN') return 'NUMBER(1)';
      if (normalType === 'DECIMAL') return `NUMBER${args}`;
      if (normalType === 'TEXT') return 'CLOB';
      break;
    
    case 'redshift':
    case 'postgres':
      if (normalType === 'DATETIME') return 'TIMESTAMP';
      if (normalType === 'BOOLEAN') return 'BOOLEAN';
      if (normalType === 'CLOB') return 'TEXT';
      break;
      
    case 'mysql':
    case 'mariadb':
      if (normalType === 'BOOLEAN') return 'TINYINT(1)';
      if (normalType === 'TIMESTAMP') return 'DATETIME'; // Or TIMESTAMP, but DATETIME is more flexible
      break;

    case 'mssql':
      if (normalType === 'BOOLEAN') return 'BIT';
      if (normalType === 'VARCHAR') return `VARCHAR${args || '(255)'}`;
      break;

    case 'bigquery':
      if (normalType === 'VARCHAR' || normalType === 'TEXT') return 'STRING';
      if (normalType === 'INT' || normalType === 'INTEGER' || normalType === 'BIGINT') return 'INT64';
      if (normalType === 'DECIMAL' || normalType === 'NUMERIC') return 'NUMERIC'; // BQ uses NUMERIC/BIGNUMERIC without args mostly, or with args
      if (normalType === 'BOOLEAN') return 'BOOL';
      if (normalType === 'TIMESTAMP') return 'TIMESTAMP';
      return normalType; // BQ ignores args for most types
      
    case 'clickhouse':
      if (normalType === 'VARCHAR' || normalType === 'TEXT') return 'String';
      if (normalType === 'INT' || normalType === 'INTEGER') return 'Int32';
      if (normalType === 'BIGINT') return 'Int64';
      if (normalType === 'BOOLEAN') return 'UInt8';
      if (normalType === 'TIMESTAMP' || normalType === 'DATETIME') return 'DateTime';
      if (normalType === 'DECIMAL') return `Decimal${args}`;
      if (normalType === 'FLOAT' || normalType === 'REAL') return 'Float32';
      if (normalType === 'DOUBLE') return 'Float64';
      return normalType;

    case 'sqlite':
      if (normalType === 'VARCHAR' || normalType === 'CHAR' || normalType === 'CLOB') return 'TEXT';
      if (normalType === 'DECIMAL' || normalType === 'FLOAT' || normalType === 'DOUBLE') return 'REAL';
      if (normalType === 'BOOLEAN') return 'INTEGER';
      if (normalType === 'INT' || normalType === 'BIGINT') return 'INTEGER';
      if (normalType === 'TIMESTAMP') return 'DATETIME';
      return normalType;

    case 'snowflake':
      // Snowflake standardizes well, but handles VARCHAR properly
      if (normalType === 'BOOLEAN') return 'BOOLEAN';
      break;

    case 'databricks':
      if (normalType === 'VARCHAR' || normalType === 'TEXT') return 'STRING';
      if (normalType === 'INT' || normalType === 'INTEGER') return 'INT';
      break;
      
    case 'teradata':
      if (normalType === 'VARCHAR') return `VARCHAR${args || '(255)'}`;
      if (normalType === 'BOOLEAN') return 'BYTEINT';
      break;
  }

  // Fallback string combination
  return `${normalType}${args}`;
};
