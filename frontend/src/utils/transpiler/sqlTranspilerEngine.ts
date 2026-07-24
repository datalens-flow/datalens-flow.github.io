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

  const logChange = (rule: string, occurrencesCount: number = 1) => {
    changesCount += occurrencesCount;
    if (!transformationLog.includes(rule)) {
      transformationLog.push(rule);
    }
  };

  // Skip transpilation if source and target are the same
  if (sourceDialect === targetDialect) {
    return { convertedSql: result, changesCount: 0, transformationLog: ['Source and Target dialects are identical. No conversion required.'] };
  }

  // -------------------------------------------------------------
  // 1. NULL HANDLING & CONDITIONAL FUNCTIONS
  // -------------------------------------------------------------

  // Oracle NVL(a, b) -> COALESCE(a, b)
  if (sourceDialect === 'oracle' && targetDialect !== 'oracle') {
    const matches = result.match(/\bnvl\s*\(/gi);
    if (matches) {
      result = result.replace(/\bnvl\s*\(/gi, 'COALESCE(');
      logChange(`Mapped Oracle NVL() ➔ COALESCE() (${matches.length} occurrences)`, matches.length);
    }
  }

  // T-SQL ISNULL(a, b) -> COALESCE(a, b)
  if (sourceDialect === 'tsql' && targetDialect !== 'tsql') {
    const matches = result.match(/\bisnull\s*\(/gi);
    if (matches) {
      result = result.replace(/\bisnull\s*\(/gi, 'COALESCE(');
      logChange(`Mapped T-SQL ISNULL() ➔ COALESCE() (${matches.length} occurrences)`, matches.length);
    }
  }

  // MySQL / SQLite IFNULL(a, b) -> COALESCE(a, b)
  if ((sourceDialect === 'mysql' || sourceDialect === 'sqlite') && (targetDialect === 'postgres' || targetDialect === 'bigquery' || targetDialect === 'snowflake' || targetDialect === 'tsql' || targetDialect === 'oracle')) {
    const matches = result.match(/\bifnull\s*\(/gi);
    if (matches) {
      result = result.replace(/\bifnull\s*\(/gi, 'COALESCE(');
      logChange(`Mapped IFNULL() ➔ COALESCE() (${matches.length} occurrences)`, matches.length);
    }
  }

  // Oracle / Snowflake NVL2(expr, val_if_not_null, val_if_null) -> CASE WHEN expr IS NOT NULL THEN val_if_not_null ELSE val_if_null END
  if ((sourceDialect === 'oracle' || sourceDialect === 'snowflake') && (targetDialect === 'postgres' || targetDialect === 'tsql' || targetDialect === 'bigquery' || targetDialect === 'mysql' || targetDialect === 'sqlite')) {
    const nvl2Matches = result.match(/\bnvl2\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\)/gi);
    if (nvl2Matches) {
      result = result.replace(/\bnvl2\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\)/gi, 'CASE WHEN $1 IS NOT NULL THEN $2 ELSE $3 END');
      logChange(`Transformed NVL2(a, b, c) ➔ CASE WHEN a IS NOT NULL THEN b ELSE c END (${nvl2Matches.length} occurrences)`, nvl2Matches.length);
    }
  }

  // Oracle DECODE(val, s1, r1, [s2, r2, ...], [default]) -> CASE val WHEN s1 THEN r1 ... [ELSE default] END
  if (sourceDialect === 'oracle' && targetDialect !== 'oracle') {
    const decodeRegex = /\bdecode\s*\(([^()]+)\)/gi;
    const matches = result.match(decodeRegex);
    if (matches) {
      result = result.replace(decodeRegex, (fullMatch, argsStr) => {
        const parts = argsStr.split(',').map((s: string) => s.trim());
        if (parts.length < 3) return fullMatch;
        const targetVal = parts[0];
        let caseExpr = `CASE ${targetVal}`;
        let i = 1;
        while (i + 1 < parts.length) {
          caseExpr += ` WHEN ${parts[i]} THEN ${parts[i + 1]}`;
          i += 2;
        }
        if (i < parts.length) {
          caseExpr += ` ELSE ${parts[i]}`;
        }
        caseExpr += ' END';
        return caseExpr;
      });
      logChange(`Transformed Oracle DECODE() ➔ CASE WHEN clause (${matches.length} occurrences)`, matches.length);
    }
  }


  // -------------------------------------------------------------
  // 2. DATE & TIME FUNCTIONS
  // -------------------------------------------------------------

  // GETDATE() (T-SQL) / SYSDATE (Oracle) / NOW() (MySQL) / datetime('now') (SQLite) -> Target Equivalent
  if (sourceDialect === 'tsql' && result.match(/\bgetdate\s*\(\s*\)/gi)) {
    const count = (result.match(/\bgetdate\s*\(\s*\)/gi) || []).length;
    if (targetDialect === 'postgres' || targetDialect === 'bigquery' || targetDialect === 'snowflake') {
      result = result.replace(/\bgetdate\s*\(\s*\)/gi, 'CURRENT_TIMESTAMP');
      logChange(`Mapped T-SQL GETDATE() ➔ CURRENT_TIMESTAMP (${count} occurrences)`, count);
    } else if (targetDialect === 'mysql') {
      result = result.replace(/\bgetdate\s*\(\s*\)/gi, 'NOW()');
      logChange(`Mapped T-SQL GETDATE() ➔ NOW() (${count} occurrences)`, count);
    } else if (targetDialect === 'sqlite') {
      result = result.replace(/\bgetdate\s*\(\s*\)/gi, "datetime('now')");
      logChange(`Mapped T-SQL GETDATE() ➔ datetime('now') (${count} occurrences)`, count);
    }
  }

  if (sourceDialect === 'oracle' && result.match(/\bsysdate\b/gi)) {
    const count = (result.match(/\bsysdate\b/gi) || []).length;
    if (targetDialect === 'postgres' || targetDialect === 'bigquery' || targetDialect === 'snowflake') {
      result = result.replace(/\bsysdate\b/gi, 'CURRENT_TIMESTAMP');
      logChange(`Mapped Oracle SYSDATE ➔ CURRENT_TIMESTAMP (${count} occurrences)`, count);
    } else if (targetDialect === 'mysql') {
      result = result.replace(/\bsysdate\b/gi, 'NOW()');
      logChange(`Mapped Oracle SYSDATE ➔ NOW() (${count} occurrences)`, count);
    } else if (targetDialect === 'sqlite') {
      result = result.replace(/\bsysdate\b/gi, "datetime('now')");
      logChange(`Mapped Oracle SYSDATE ➔ datetime('now') (${count} occurrences)`, count);
    }
  }

  if (sourceDialect === 'mysql' && result.match(/\bnow\s*\(\s*\)/gi)) {
    const count = (result.match(/\bnow\s*\(\s*\)/gi) || []).length;
    if (targetDialect === 'postgres' || targetDialect === 'bigquery' || targetDialect === 'snowflake') {
      result = result.replace(/\bnow\s*\(\s*\)/gi, 'CURRENT_TIMESTAMP');
      logChange(`Mapped MySQL NOW() ➔ CURRENT_TIMESTAMP (${count} occurrences)`);
    } else if (targetDialect === 'oracle') {
      result = result.replace(/\bnow\s*\(\s*\)/gi, 'SYSDATE');
      logChange(`Mapped MySQL NOW() ➔ SYSDATE (${count} occurrences)`);
    }
  }

  // T-SQL DATEADD(unit, n, date) -> Postgres/MySQL/BigQuery Equivalent
  if (sourceDialect === 'tsql' && result.match(/\bdateadd\s*\(\s*(\w+)\s*,\s*(-?\d+)\s*,\s*([^)]+)\)/gi)) {
    const matches = result.match(/\bdateadd\s*\(\s*(\w+)\s*,\s*(-?\d+)\s*,\s*([^)]+)\)/gi);
    if (targetDialect === 'postgres') {
      result = result.replace(/\bdateadd\s*\(\s*(\w+)\s*,\s*(-?\d+)\s*,\s*([^)]+)\)/gi, "$3 + INTERVAL '$2 $1'");
      logChange(`Transformed T-SQL DATEADD() ➔ Postgres + INTERVAL operator (${matches?.length} occurrences)`);
    } else if (targetDialect === 'bigquery' || targetDialect === 'mysql') {
      result = result.replace(/\bdateadd\s*\(\s*(\w+)\s*,\s*(-?\d+)\s*,\s*([^)]+)\)/gi, 'DATE_ADD($3, INTERVAL $2 $1)');
      logChange(`Transformed T-SQL DATEADD() ➔ DATE_ADD(date, INTERVAL n unit) (${matches?.length} occurrences)`);
    }
  }

  // T-SQL DATEDIFF(unit, start, end) -> Postgres/BigQuery Equivalent
  if (sourceDialect === 'tsql' && result.match(/\bdatediff\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\)/gi)) {
    const matches = result.match(/\bdatediff\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\)/gi);
    if (targetDialect === 'postgres') {
      result = result.replace(/\bdatediff\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\)/gi, '($3 - $2)');
      logChange(`Transformed T-SQL DATEDIFF() ➔ ($3 - $2) date subtraction (${matches?.length} occurrences)`);
    } else if (targetDialect === 'bigquery') {
      result = result.replace(/\bdatediff\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\)/gi, 'DATE_DIFF($3, $2, $1)');
      logChange(`Transformed T-SQL DATEDIFF() ➔ BigQuery DATE_DIFF(end, start, unit) (${matches?.length} occurrences)`);
    }
  }


  // -------------------------------------------------------------
  // 3. STRING & CHARACTER FUNCTIONS
  // -------------------------------------------------------------

  // LEN(str) (T-SQL) -> LENGTH(str)
  if (sourceDialect === 'tsql' && targetDialect !== 'tsql') {
    const matches = result.match(/\blen\s*\(/gi);
    if (matches) {
      result = result.replace(/\blen\s*\(/gi, 'LENGTH(');
      logChange(`Mapped T-SQL LEN() ➔ LENGTH() (${matches.length} occurrences)`);
    }
  }

  // SUBSTRING(str, pos, len) (T-SQL/Postgres/BigQuery) <-> SUBSTR(str, pos, len) (Oracle/MySQL/SQLite)
  if ((sourceDialect === 'oracle' || sourceDialect === 'mysql' || sourceDialect === 'sqlite') && (targetDialect === 'postgres' || targetDialect === 'bigquery' || targetDialect === 'tsql')) {
    const matches = result.match(/\bsubstr\s*\(/gi);
    if (matches) {
      result = result.replace(/\bsubstr\s*\(/gi, 'SUBSTRING(');
      logChange(`Mapped SUBSTR() ➔ SUBSTRING() (${matches.length} occurrences)`);
    }
  } else if ((sourceDialect === 'tsql' || sourceDialect === 'bigquery') && (targetDialect === 'oracle' || targetDialect === 'mysql' || targetDialect === 'sqlite')) {
    const matches = result.match(/\bsubstring\s*\(/gi);
    if (matches) {
      result = result.replace(/\bsubstring\s*\(/gi, 'SUBSTR(');
      logChange(`Mapped SUBSTRING() ➔ SUBSTR() (${matches.length} occurrences)`);
    }
  }

  // CHARINDEX(sub, str) (T-SQL) / INSTR(str, sub) (Oracle/MySQL) -> POSITION(sub IN str) (Postgres) / STRPOS(str, sub) (BigQuery)
  if (sourceDialect === 'tsql' && result.match(/\bcharindex\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/gi)) {
    const matches = result.match(/\bcharindex\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/gi);
    if (targetDialect === 'postgres') {
      result = result.replace(/\bcharindex\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/gi, 'POSITION($1 IN $2)');
      logChange(`Mapped T-SQL CHARINDEX() ➔ POSITION(sub IN str) (${matches?.length} occurrences)`);
    } else if (targetDialect === 'bigquery') {
      result = result.replace(/\bcharindex\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/gi, 'STRPOS($2, $1)');
      logChange(`Mapped T-SQL CHARINDEX() ➔ BigQuery STRPOS(str, sub) (${matches?.length} occurrences)`);
    } else if (targetDialect === 'oracle' || targetDialect === 'mysql' || targetDialect === 'sqlite') {
      result = result.replace(/\bcharindex\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/gi, 'INSTR($2, $1)');
      logChange(`Mapped T-SQL CHARINDEX() ➔ INSTR(str, sub) (${matches?.length} occurrences)`);
    }
  }

  if (sourceDialect === 'oracle' && result.match(/\binstr\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/gi)) {
    const matches = result.match(/\binstr\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/gi);
    if (targetDialect === 'postgres') {
      result = result.replace(/\binstr\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/gi, 'POSITION($2 IN $1)');
      logChange(`Mapped Oracle INSTR() ➔ Postgres POSITION(sub IN str) (${matches?.length} occurrences)`);
    } else if (targetDialect === 'bigquery') {
      result = result.replace(/\binstr\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/gi, 'STRPOS($1, $2)');
      logChange(`Mapped Oracle INSTR() ➔ BigQuery STRPOS(str, sub) (${matches?.length} occurrences)`);
    }
  }

  // T-SQL '+' String Concatenation -> '||' (Postgres/Oracle/Snowflake/SQLite)
  if (sourceDialect === 'tsql' && (targetDialect === 'postgres' || targetDialect === 'oracle' || targetDialect === 'snowflake' || targetDialect === 'sqlite')) {
    const concatMatches = result.match(/'[^']*'\s*\+\s*'[^']*'/gi);
    if (concatMatches) {
      result = result.replace(/('[^']*')\s*\+\s*('[^']*')/gi, '$1 || $2');
      logChange(`Converted '+' String Concatenation ➔ '||' operator (${concatMatches.length} occurrences)`);
    }
  }

  // T-SQL [table] / [column] brackets -> "table" / "column" quotes (Postgres/Oracle/Snowflake)
  if (sourceDialect === 'tsql' && (targetDialect === 'postgres' || targetDialect === 'oracle' || targetDialect === 'snowflake')) {
    const bracketMatches = result.match(/\[([a-zA-Z_]\w*)\]/g);
    if (bracketMatches) {
      result = result.replace(/\[([a-zA-Z_]\w*)\]/g, '"$1"');
      logChange(`Converted T-SQL bracket identifiers [col] ➔ double quotes "$1" (${bracketMatches.length} occurrences)`);
    }
  }

  // MySQL `table` / `column` backticks -> "table" / "column" quotes (Postgres/Oracle/Snowflake)
  if (sourceDialect === 'mysql' && (targetDialect === 'postgres' || targetDialect === 'oracle' || targetDialect === 'snowflake')) {
    const backtickMatches = result.match(/`([a-zA-Z_]\w*)`/g);
    if (backtickMatches) {
      result = result.replace(/`([a-zA-Z_]\w*)`/g, '"$1"');
      logChange(`Converted MySQL backtick identifiers \`col\` ➔ double quotes "$1" (${backtickMatches.length} occurrences)`);
    }
  }


  // -------------------------------------------------------------
  // 4. DATA TYPES & AUTO-INCREMENT KEYS
  // -------------------------------------------------------------

  // Oracle Data Types
  if (sourceDialect === 'oracle') {
    const v2Matches = result.match(/\bvarchar2\b/gi);
    if (v2Matches) {
      const newType = targetDialect === 'bigquery' ? 'STRING' : 'VARCHAR';
      result = result.replace(/\bvarchar2\b/gi, newType);
      logChange(`Converted Oracle VARCHAR2 ➔ ${newType} (${v2Matches.length} occurrences)`, v2Matches.length);
    }

    const numMatches = result.match(/\bnumber\b/gi);
    if (numMatches) {
      const newType = targetDialect === 'bigquery' ? 'NUMERIC' : (targetDialect === 'postgres' ? 'NUMERIC' : 'DECIMAL');
      result = result.replace(/\bnumber\b/gi, newType);
      logChange(`Converted Oracle NUMBER ➔ ${newType} (${numMatches.length} occurrences)`, numMatches.length);
    }

    const clobMatches = result.match(/\bclob\b/gi);
    if (clobMatches) {
      const newType = targetDialect === 'bigquery' ? 'STRING' : (targetDialect === 'postgres' ? 'TEXT' : 'LONGTEXT');
      result = result.replace(/\bclob\b/gi, newType);
      logChange(`Converted Oracle CLOB ➔ ${newType} (${clobMatches.length} occurrences)`, clobMatches.length);
    }
  }

  // T-SQL Data Types
  if (sourceDialect === 'tsql') {
    const dt2Matches = result.match(/\bdatetime2\b|\bdatetime\b/gi);
    if (dt2Matches) {
      const newType = targetDialect === 'bigquery' ? 'TIMESTAMP' : 'TIMESTAMP';
      result = result.replace(/\bdatetime2\b|\bdatetime\b/gi, newType);
      logChange(`Converted T-SQL DATETIME ➔ ${newType} (${dt2Matches.length} occurrences)`);
    }

    const nvarcharMatches = result.match(/\bnvarchar\b/gi);
    if (nvarcharMatches) {
      const newType = targetDialect === 'bigquery' ? 'STRING' : 'VARCHAR';
      result = result.replace(/\bnvarchar\b/gi, newType);
      logChange(`Converted T-SQL NVARCHAR ➔ ${newType} (${nvarcharMatches.length} occurrences)`);
    }

    const bitMatches = result.match(/\bbit\b/gi);
    if (bitMatches) {
      const newType = targetDialect === 'postgres' || targetDialect === 'snowflake' ? 'BOOLEAN' : (targetDialect === 'bigquery' ? 'BOOL' : 'TINYINT(1)');
      result = result.replace(/\bbit\b/gi, newType);
      logChange(`Converted T-SQL BIT ➔ ${newType} (${bitMatches.length} occurrences)`);
    }

    const identityMatches = result.match(/\bidentity\s*\(\s*\d+\s*,\s*\d+\s*\)/gi);
    if (identityMatches) {
      if (targetDialect === 'postgres') {
        result = result.replace(/\bidentity\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'GENERATED ALWAYS AS IDENTITY');
        logChange(`Converted T-SQL IDENTITY(1,1) ➔ Postgres GENERATED ALWAYS AS IDENTITY (${identityMatches.length} occurrences)`);
      } else if (targetDialect === 'mysql') {
        result = result.replace(/\bidentity\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'AUTO_INCREMENT');
        logChange(`Converted T-SQL IDENTITY(1,1) ➔ MySQL AUTO_INCREMENT (${identityMatches.length} occurrences)`);
      } else if (targetDialect === 'sqlite') {
        result = result.replace(/\bidentity\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'AUTOINCREMENT');
        logChange(`Converted T-SQL IDENTITY(1,1) ➔ SQLite AUTOINCREMENT (${identityMatches.length} occurrences)`);
      }
    }
  }

  // MySQL Data Types & AUTO_INCREMENT
  if (sourceDialect === 'mysql') {
    const autoIncMatches = result.match(/\bauto_increment\b/gi);
    if (autoIncMatches) {
      if (targetDialect === 'postgres') {
        result = result.replace(/\bauto_increment\b/gi, 'GENERATED ALWAYS AS IDENTITY');
        logChange(`Converted MySQL AUTO_INCREMENT ➔ Postgres GENERATED ALWAYS AS IDENTITY (${autoIncMatches.length} occurrences)`);
      } else if (targetDialect === 'sqlite') {
        result = result.replace(/\bauto_increment\b/gi, 'AUTOINCREMENT');
        logChange(`Converted MySQL AUTO_INCREMENT ➔ SQLite AUTOINCREMENT (${autoIncMatches.length} occurrences)`);
      } else if (targetDialect === 'tsql') {
        result = result.replace(/\bauto_increment\b/gi, 'IDENTITY(1,1)');
        logChange(`Converted MySQL AUTO_INCREMENT ➔ T-SQL IDENTITY(1,1) (${autoIncMatches.length} occurrences)`);
      }
    }
  }

  // BigQuery Strict Data Types Mapping (Target BigQuery)
  if (targetDialect === 'bigquery') {
    if (result.match(/\bvarchar(?:\(\d+\))?/gi)) {
      const count = (result.match(/\bvarchar(?:\(\d+\))?/gi) || []).length;
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
    if (result.match(/\bboolean\b|\bbool\b/gi)) {
      const count = (result.match(/\bboolean\b/gi) || []).length;
      result = result.replace(/\bboolean\b/gi, 'BOOL');
      logChange(`Converted BOOLEAN ➔ BOOL for BigQuery (${count} occurrences)`);
    }
  }


  // -------------------------------------------------------------
  // 5. CLAUSES & PAGINATION
  // -------------------------------------------------------------

  // Oracle 'FROM DUAL'
  if (sourceDialect === 'oracle' && targetDialect !== 'oracle') {
    const dualMatches = result.match(/\s+from\s+dual\b/gi);
    if (dualMatches) {
      result = result.replace(/\s+from\s+dual\b/gi, '');
      logChange(`Stripped Oracle 'FROM DUAL' clause (${dualMatches.length} occurrences)`);
    }
  }

  // Oracle FETCH FIRST N ROWS ONLY -> LIMIT N
  if (sourceDialect === 'oracle' && (targetDialect === 'postgres' || targetDialect === 'bigquery' || targetDialect === 'snowflake' || targetDialect === 'mysql' || targetDialect === 'sqlite')) {
    const fetchMatches = result.match(/\s+fetch\s+first\s+(\d+)\s+rows?\s+only\b/gi);
    if (fetchMatches) {
      result = result.replace(/\s+fetch\s+first\s+(\d+)\s+rows?\s+only\b/gi, ' LIMIT $1');
      logChange(`Transformed Oracle 'FETCH FIRST N ROWS ONLY' ➔ 'LIMIT N' clause (${fetchMatches.length} occurrences)`);
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

  return {
    convertedSql: result,
    changesCount,
    transformationLog
  };
};
