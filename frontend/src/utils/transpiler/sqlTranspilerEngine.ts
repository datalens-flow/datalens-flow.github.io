export type SqlDialect = 'oracle' | 'tsql' | 'postgres' | 'mysql' | 'bigquery' | 'snowflake' | 'sqlite';

export interface TranspileResult {
  convertedSql: string;
  changesCount: number;
  transformationLog: string[];
}

export const DIALECT_LABELS: Record<SqlDialect, string> = {
  oracle: 'Oracle PL/SQL',
  tsql: 'Microsoft SQL Server (T-SQL)',
  postgres: 'PostgreSQL',
  mysql: 'MySQL / MariaDB',
  bigquery: 'Google BigQuery',
  snowflake: 'Snowflake',
  sqlite: 'SQLite'
};

export const transpileSql = (
  sql: string,
  sourceDialect: SqlDialect,
  targetDialect: SqlDialect
): TranspileResult => {
  if (!sql.trim()) {
    return { convertedSql: '', changesCount: 0, transformationLog: [] };
  }

  let result = sql;
  let changesCount = 0;
  const transformationLog: string[] = [];

  const logChange = (rule: string) => {
    changesCount++;
    if (!transformationLog.includes(rule)) {
      transformationLog.push(rule);
    }
  };

  // 1. Function Mappings
  // NVL(a, b) -> COALESCE(a, b)
  if (sourceDialect === 'oracle' && (targetDialect === 'postgres' || targetDialect === 'bigquery' || targetDialect === 'snowflake' || targetDialect === 'mysql' || targetDialect === 'tsql')) {
    const nvlMatches = result.match(/\bnvl\s*\(/gi);
    if (nvlMatches) {
      result = result.replace(/\bnvl\s*\(/gi, 'COALESCE(');
      logChange(`Mapped function NVL() ➔ COALESCE() (${nvlMatches.length} occurrences)`);
    }
  }

  // ISNULL(a, b) -> COALESCE(a, b)
  if (sourceDialect === 'tsql' && targetDialect !== 'tsql') {
    const isnullMatches = result.match(/\bisnull\s*\(/gi);
    if (isnullMatches) {
      result = result.replace(/\bisnull\s*\(/gi, 'COALESCE(');
      logChange(`Mapped T-SQL ISNULL() ➔ COALESCE() (${isnullMatches.length} occurrences)`);
    }
  }

  // IFNULL(a, b) -> COALESCE(a, b)
  if (sourceDialect === 'mysql' && (targetDialect === 'postgres' || targetDialect === 'bigquery' || targetDialect === 'snowflake')) {
    const ifnullMatches = result.match(/\bifnull\s*\(/gi);
    if (ifnullMatches) {
      result = result.replace(/\bifnull\s*\(/gi, 'COALESCE(');
      logChange(`Mapped MySQL IFNULL() ➔ COALESCE() (${ifnullMatches.length} occurrences)`);
    }
  }

  // GETDATE() / SYSDATE -> CURRENT_TIMESTAMP
  if (sourceDialect === 'tsql' && result.match(/\bgetdate\s*\(\s*\)/gi)) {
    const matchCount = (result.match(/\bgetdate\s*\(\s*\)/gi) || []).length;
    if (targetDialect === 'postgres' || targetDialect === 'bigquery' || targetDialect === 'snowflake') {
      result = result.replace(/\bgetdate\s*\(\s*\)/gi, 'CURRENT_TIMESTAMP');
      logChange(`Mapped GETDATE() ➔ CURRENT_TIMESTAMP (${matchCount} occurrences)`);
    } else if (targetDialect === 'mysql') {
      result = result.replace(/\bgetdate\s*\(\s*\)/gi, 'NOW()');
      logChange(`Mapped GETDATE() ➔ NOW() (${matchCount} occurrences)`);
    }
  }

  if (sourceDialect === 'oracle' && result.match(/\bsysdate\b/gi)) {
    const matchCount = (result.match(/\bsysdate\b/gi) || []).length;
    if (targetDialect === 'postgres' || targetDialect === 'bigquery' || targetDialect === 'snowflake') {
      result = result.replace(/\bsysdate\b/gi, 'CURRENT_TIMESTAMP');
      logChange(`Mapped SYSDATE ➔ CURRENT_TIMESTAMP (${matchCount} occurrences)`);
    } else if (targetDialect === 'mysql') {
      result = result.replace(/\bsysdate\b/gi, 'NOW()');
      logChange(`Mapped SYSDATE ➔ NOW() (${matchCount} occurrences)`);
    }
  }

  // LEN(str) -> LENGTH(str)
  if (sourceDialect === 'tsql' && targetDialect !== 'tsql') {
    const lenMatches = result.match(/\blen\s*\(/gi);
    if (lenMatches) {
      result = result.replace(/\blen\s*\(/gi, 'LENGTH(');
      logChange(`Mapped T-SQL LEN() ➔ LENGTH() (${lenMatches.length} occurrences)`);
    }
  }

  // 2. Data Type Conversions
  // Oracle VARCHAR2 -> VARCHAR / STRING
  if (sourceDialect === 'oracle') {
    const varchar2Matches = result.match(/\bvarchar2\b/gi);
    if (varchar2Matches) {
      const newType = targetDialect === 'bigquery' ? 'STRING' : 'VARCHAR';
      result = result.replace(/\bvarchar2\b/gi, newType);
      logChange(`Converted Oracle VARCHAR2 ➔ ${newType} (${varchar2Matches.length} occurrences)`);
    }

    const numberMatches = result.match(/\bnumber\b/gi);
    if (numberMatches) {
      const newType = targetDialect === 'bigquery' ? 'NUMERIC' : (targetDialect === 'postgres' ? 'NUMERIC' : 'DECIMAL');
      result = result.replace(/\bnumber\b/gi, newType);
      logChange(`Converted Oracle NUMBER ➔ ${newType} (${numberMatches.length} occurrences)`);
    }
  }

  // T-SQL DATETIME2 / DATETIME -> TIMESTAMP
  if (sourceDialect === 'tsql') {
    const dt2Matches = result.match(/\bdatetime2\b/gi);
    if (dt2Matches) {
      const newType = targetDialect === 'bigquery' ? 'TIMESTAMP' : 'TIMESTAMP';
      result = result.replace(/\bdatetime2\b/gi, newType);
      logChange(`Converted T-SQL DATETIME2 ➔ ${newType} (${dt2Matches.length} occurrences)`);
    }

    const nvarcharMatches = result.match(/\bnvarchar\b/gi);
    if (nvarcharMatches) {
      const newType = targetDialect === 'bigquery' ? 'STRING' : 'VARCHAR';
      result = result.replace(/\bnvarchar\b/gi, newType);
      logChange(`Converted T-SQL NVARCHAR ➔ ${newType} (${nvarcharMatches.length} occurrences)`);
    }
  }

  // BigQuery Data Types (STRING, INT64, FLOAT64)
  if (targetDialect === 'bigquery') {
    if (result.match(/\bvarchar\b/gi)) {
      const count = (result.match(/\bvarchar\b/gi) || []).length;
      result = result.replace(/\bvarchar(?:\(\d+\))?/gi, 'STRING');
      logChange(`Converted VARCHAR ➔ STRING for BigQuery (${count} occurrences)`);
    }
    if (result.match(/\binteger\b|\bint\b/gi)) {
      const count = (result.match(/\binteger\b|\bint\b/gi) || []).length;
      result = result.replace(/\b(?:integer|int)\b/gi, 'INT64');
      logChange(`Converted INT/INTEGER ➔ INT64 for BigQuery (${count} occurrences)`);
    }
    if (result.match(/\bfloat\b|\bdouble\b/gi)) {
      const count = (result.match(/\bfloat\b|\bdouble\b/gi) || []).length;
      result = result.replace(/\b(?:float|double)\b/gi, 'FLOAT64');
      logChange(`Converted FLOAT/DOUBLE ➔ FLOAT64 for BigQuery (${count} occurrences)`);
    }
  }

  // 3. Syntax & Clauses Conversions
  // Oracle 'FROM DUAL'
  if (sourceDialect === 'oracle' && (targetDialect === 'postgres' || targetDialect === 'bigquery' || targetDialect === 'snowflake')) {
    const dualMatches = result.match(/\s+from\s+dual\b/gi);
    if (dualMatches) {
      result = result.replace(/\s+from\s+dual\b/gi, '');
      logChange(`Stripped Oracle 'FROM DUAL' clause (${dualMatches.length} occurrences)`);
    }
  }

  // T-SQL 'SELECT TOP N ... FROM' -> 'SELECT ... FROM ... LIMIT N'
  if (sourceDialect === 'tsql' && (targetDialect === 'postgres' || targetDialect === 'bigquery' || targetDialect === 'snowflake' || targetDialect === 'mysql' || targetDialect === 'sqlite')) {
    const topMatches = result.match(/select\s+top\s+(\d+)\s+([\s\S]+?)\s+from\s+([\w.]+)/gi);
    if (topMatches) {
      result = result.replace(/select\s+top\s+(\d+)\s+([\s\S]+?)\s+from\s+([\w.]+)/gi, (_, n, cols, tbl) => {
        return `SELECT ${cols} FROM ${tbl} LIMIT ${n}`;
      });
      logChange(`Transformed T-SQL 'SELECT TOP ${topMatches.length}' ➔ 'LIMIT N' clause`);
    }
  }

  // 4. String Concatenation '+' (T-SQL) -> '||' (PostgreSQL/Oracle/Snowflake)
  if (sourceDialect === 'tsql' && (targetDialect === 'postgres' || targetDialect === 'oracle' || targetDialect === 'snowflake' || targetDialect === 'sqlite')) {
    const concatMatches = result.match(/'[^']*'\s*\+\s*'[^']*'/gi);
    if (concatMatches) {
      result = result.replace(/('[^']*')\s*\+\s*('[^']*')/gi, '$1 || $2');
      logChange(`Converted '+' String Concatenation ➔ '||' operator (${concatMatches.length} occurrences)`);
    }
  }

  return {
    convertedSql: result,
    changesCount,
    transformationLog
  };
};
