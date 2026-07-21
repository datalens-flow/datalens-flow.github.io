/**
 * Utility parser for dbt models (Jinja macros, ref(), source())
 * and Airflow Python DAG files containing embedded SQL queries.
 */

export interface ExtractedScript {
  filename: string;
  sql: string;
  type: 'sql' | 'dbt' | 'airflow';
}

/** Pre-process dbt SQL files by expanding ref() and source() and stripping Jinja tags */
export const preprocessDbtSql = (rawSql: string): string => {
  let cleaned = rawSql;

  // Strip Jinja comments {# ... #}
  cleaned = cleaned.replace(/\{#[\s\S]*?#\}/g, '');

  // Strip Jinja config(...) macros
  cleaned = cleaned.replace(/\{\{\s*config\([\s\S]*?\)\s*\}\}/gi, '');

  // Replace {{ ref('model_name') }} or {{ ref("model_name") }} with model_name
  cleaned = cleaned.replace(/\{\{\s*ref\s*\(\s*['"](\w+)['"]\s*\)\s*\}\}/gi, '$1');

  // Replace {{ source('schema_name', 'table_name') }} with schema_name.table_name
  cleaned = cleaned.replace(/\{\{\s*source\s*\(\s*['"](\w+)['"]\s*,\s*['"](\w+)['"]\s*\)\s*\}\}/gi, '$1.$2');

  // Replace generic {{ ... }} Jinja expressions with 1 or empty string to keep SQL parseable
  cleaned = cleaned.replace(/\{\{[\s\S]*?\}\}/g, '');

  // Replace {% ... %} Jinja control tags with blank
  cleaned = cleaned.replace(/\{%[\s\S]*?%\}/g, '');

  return cleaned.trim();
};

/** Extract embedded SQL statements from a Python Airflow DAG file */
export const extractSqlFromPythonDag = (pythonCode: string, filename: string): ExtractedScript[] => {
  const extracted: ExtractedScript[] = [];

  // Match triple-quoted strings """ ... """ or ''' ... ''' that contain SQL keywords
  const tripleQuoteRegex = /(?:"""|''')([\s\S]*?)(?:"""|''')/g;
  let match;
  let queryIdx = 1;

  while ((match = tripleQuoteRegex.exec(pythonCode)) !== null) {
    const content = match[1].trim();
    if (/\b(?:select|insert|update|create|delete|merge)\b/i.test(content)) {
      extracted.push({
        filename: `${filename}#query_${queryIdx++}`,
        sql: content,
        type: 'airflow'
      });
    }
  }

  // Match standard SQL string literals in Operators: sql="SELECT ..." or sql='SELECT ...'
  const operatorSqlRegex = /\bsql\s*=\s*['"]([^'"]*?\b(?:select|insert|update|create|delete|merge)\b[^'"]*?)['"]/gi;
  while ((match = operatorSqlRegex.exec(pythonCode)) !== null) {
    const content = match[1].trim();
    if (content) {
      extracted.push({
        filename: `${filename}#op_${queryIdx++}`,
        sql: content,
        type: 'airflow'
      });
    }
  }

  return extracted;
};
