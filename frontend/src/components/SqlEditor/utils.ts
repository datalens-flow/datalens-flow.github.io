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
  
  // Strings
  if (baseType === 'VARCHAR2' || baseType === 'NVARCHAR2' || baseType === 'STRING') normalType = 'VARCHAR';
  else if (baseType === 'CLOB' || (baseType === 'VARCHAR' && args.includes('MAX'))) {
    normalType = 'TEXT';
    args = '';
  }
  
  // Numbers
  else if (baseType === 'NUMBER') {
    if (args === '(1)') normalType = 'BOOLEAN';
    else if (args) normalType = 'DECIMAL';
    else normalType = 'INT';
  }
  else if (baseType === 'INT64') normalType = 'BIGINT';
  else if (baseType === 'INT32' || baseType === 'INTEGER') normalType = 'INT';
  
  // Floating Point
  else if (baseType === 'FLOAT4' || baseType === 'FLOAT32' || baseType === 'REAL') normalType = 'FLOAT';
  else if (baseType === 'FLOAT8' || baseType === 'FLOAT64' || baseType === 'DOUBLE PRECISION') normalType = 'DOUBLE';
  
  // Date/Time
  else if (baseType === 'DATETIME2' || baseType === 'DATETIME' || baseType === 'TIMESTAMP_NTZ' || baseType === 'TIMESTAMP_LTZ') normalType = 'TIMESTAMP';
  
  // Booleans
  else if (baseType === 'BIT' || baseType === 'TINYINT' || baseType === 'BYTEINT' || baseType === 'UINT8') {
    if (args === '(1)' || baseType === 'BIT' || baseType === 'BYTEINT' || baseType === 'UINT8') {
      normalType = 'BOOLEAN';
      args = ''; // booleans usually don't have args in standard SQL
    }
  }
  
  // JSON
  else if (baseType === 'JSONB' || baseType === 'VARIANT') normalType = 'JSON';


  // 3. Target Dialect Mapping
  switch (targetDialect) {
    case 'oracle':
      if (normalType === 'VARCHAR') return `VARCHAR2${args || '(255)'}`;
      if (normalType === 'TEXT') return 'CLOB';
      if (normalType === 'INT' || normalType === 'BIGINT') return `NUMBER(10)`;
      if (normalType === 'BOOLEAN') return 'NUMBER(1)';
      if (normalType === 'DECIMAL') return `NUMBER${args}`;
      if (normalType === 'FLOAT' || normalType === 'DOUBLE') return 'FLOAT';
      if (normalType === 'JSON') return 'CLOB'; // Oracle 21c uses JSON, but CLOB is safer for older
      if (normalType === 'TIMESTAMP') return 'TIMESTAMP';
      break;
    
    case 'redshift':
      if (normalType === 'DATETIME') return 'TIMESTAMP';
      if (normalType === 'TEXT') return 'VARCHAR(MAX)';
      if (normalType === 'JSON') return 'SUPER';
      if (normalType === 'DOUBLE') return 'DOUBLE PRECISION';
      if (normalType === 'FLOAT') return 'REAL';
      break;

    case 'postgres':
      if (normalType === 'DATETIME') return 'TIMESTAMP';
      if (normalType === 'JSON') return 'JSONB';
      if (normalType === 'DOUBLE') return 'DOUBLE PRECISION';
      if (normalType === 'FLOAT') return 'REAL';
      break;
      
    case 'mysql':
    case 'mariadb':
      if (normalType === 'BOOLEAN') return 'TINYINT(1)';
      if (normalType === 'TIMESTAMP') return 'DATETIME'; // DATETIME is more flexible in MySQL
      if (normalType === 'TEXT') return 'LONGTEXT'; // Or TEXT depending on size
      break;

    case 'mssql':
      if (normalType === 'BOOLEAN') return 'BIT';
      if (normalType === 'VARCHAR') return `VARCHAR${args || '(255)'}`;
      if (normalType === 'TEXT') return 'VARCHAR(MAX)';
      if (normalType === 'TIMESTAMP') return 'DATETIME2';
      if (normalType === 'JSON') return 'NVARCHAR(MAX)'; // MSSQL uses strings for JSON
      if (normalType === 'DOUBLE') return 'FLOAT';
      if (normalType === 'FLOAT') return 'REAL';
      break;

    case 'bigquery':
      if (normalType === 'VARCHAR' || normalType === 'TEXT') return 'STRING';
      if (normalType === 'INT' || normalType === 'BIGINT') return 'INT64';
      if (normalType === 'DECIMAL' || normalType === 'NUMERIC') return 'NUMERIC';
      if (normalType === 'BOOLEAN') return 'BOOL';
      if (normalType === 'TIMESTAMP' || normalType === 'DATETIME') return 'TIMESTAMP';
      if (normalType === 'FLOAT' || normalType === 'DOUBLE') return 'FLOAT64';
      if (normalType === 'JSON') return 'JSON';
      return normalType; 
      
    case 'clickhouse':
      if (normalType === 'VARCHAR' || normalType === 'TEXT') return 'String';
      if (normalType === 'INT') return 'Int32';
      if (normalType === 'BIGINT') return 'Int64';
      if (normalType === 'BOOLEAN') return 'UInt8';
      if (normalType === 'TIMESTAMP' || normalType === 'DATETIME') return 'DateTime';
      if (normalType === 'DECIMAL') return `Decimal${args || '(38,9)'}`;
      if (normalType === 'FLOAT') return 'Float32';
      if (normalType === 'DOUBLE') return 'Float64';
      if (normalType === 'JSON') return 'String'; // ClickHouse handles JSON via functions usually on String
      return normalType;

    case 'sqlite':
      if (normalType === 'VARCHAR' || normalType === 'CHAR' || normalType === 'CLOB' || normalType === 'JSON') return 'TEXT';
      if (normalType === 'DECIMAL' || normalType === 'FLOAT' || normalType === 'DOUBLE') return 'REAL';
      if (normalType === 'BOOLEAN') return 'INTEGER';
      if (normalType === 'INT' || normalType === 'BIGINT') return 'INTEGER';
      if (normalType === 'TIMESTAMP') return 'DATETIME';
      return normalType;

    case 'snowflake':
      if (normalType === 'JSON') return 'VARIANT';
      if (normalType === 'TEXT') return 'VARCHAR';
      if (normalType === 'BOOLEAN') return 'BOOLEAN';
      if (normalType === 'TIMESTAMP') return 'TIMESTAMP_NTZ';
      if (normalType === 'DOUBLE') return 'FLOAT';
      break;

    case 'databricks':
      if (normalType === 'VARCHAR' || normalType === 'TEXT') return 'STRING';
      if (normalType === 'INT') return 'INT';
      if (normalType === 'JSON') return 'STRING'; // Often strings parsed via json functions
      break;
      
    case 'teradata':
      if (normalType === 'VARCHAR') return `VARCHAR${args || '(255)'}`;
      if (normalType === 'TEXT') return 'CLOB';
      if (normalType === 'BOOLEAN') return 'BYTEINT';
      if (normalType === 'JSON') return 'JSON';
      break;
  }

  // Fallback string combination
  return `${normalType}${args}`;
};
