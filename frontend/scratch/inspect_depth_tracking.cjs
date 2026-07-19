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

let depth = 0;
let withIdx = cleanSqlLower.indexOf('with');
console.log('withIdx:', withIdx);
const searchStart = withIdx + 4;
for (let i = searchStart; i < cleanSql.length; i++) {
  if (cleanSql[i] === '(') depth++;
  if (cleanSql[i] === ')') depth--;
  
  // LOG the character, depth, and starting substring
  const sub = cleanSqlLower.substring(i).trim();
  if (sub.startsWith('delete') || sub.startsWith('insert')) {
    console.log(`Char at ${i}: ${JSON.stringify(cleanSql[i])}, depth: ${depth}, startsWith: ${sub.substring(0, 15)}`);
  }
}
