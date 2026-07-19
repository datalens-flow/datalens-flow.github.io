const advancedSql = `
WITH deleted_invalid AS (
    DELETE FROM stg_customer
    WHERE customer_name IS NULL
       OR birth_date IS NULL
       OR salary <= 0
       OR province_code IS NULL
       OR occupation_code IS NULL
    RETURNING 
        customer_id,
        CASE 
            WHEN customer_name IS NULL THEN 'CUSTOMER NAME IS NULL'
            WHEN birth_date IS NULL    THEN 'BIRTH DATE IS NULL'
            WHEN salary <= 0           THEN 'INVALID SALARY'
            WHEN province_code IS NULL THEN 'INVALID PROVINCE'
            WHEN occupation_code IS NULL THEN 'INVALID OCCUPATION'
            ELSE 'UNKNOWN ERROR' 
        END AS error_message
)
INSERT INTO err_customer (customer_id, error_type, error_message, error_date)
SELECT 
    customer_id, 
    'VALIDATION', 
    error_message, 
    CURRENT_TIMESTAMP
FROM deleted_invalid;
`;

const cleanSql = advancedSql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
const cleanSqlLower = cleanSql.toLowerCase();

let searchPos = 0;
while (true) {
  const withIdx = cleanSqlLower.indexOf('with', searchPos);
  if (withIdx === -1) break;

  const isWordBoundary = (withIdx === 0 || !/[a-zA-Z0-9_]/.test(cleanSql[withIdx - 1])) &&
                         (withIdx + 4 >= cleanSql.length || !/[a-zA-Z0-9_]/.test(cleanSql[withIdx + 4]));

  if (!isWordBoundary) {
    searchPos = withIdx + 4;
    continue;
  }

  let depth = 0;
  let mainActionIdx = -1;
  for (let i = withIdx + 4; i < cleanSql.length; i++) {
    if (cleanSql[i] === '(') depth++;
    if (cleanSql[i] === ')') depth--;
    if (depth === 0) {
      const sub = cleanSqlLower.substring(i).trim();
      if (/^(?:select|insert|update|delete|merge)\b/i.test(sub)) {
        mainActionIdx = i;
        break;
      }
    }
  }

  console.log('mainActionIdx found at:', mainActionIdx, 'keyword starts:', cleanSql.substring(mainActionIdx, mainActionIdx + 30));
  const cteBlock = cleanSql.substring(withIdx + 4, mainActionIdx !== -1 ? mainActionIdx : cleanSql.length);
  console.log('cteBlock extracted:', JSON.stringify(cteBlock));
  
  searchPos = mainActionIdx !== -1 ? mainActionIdx : cleanSql.length;
}
