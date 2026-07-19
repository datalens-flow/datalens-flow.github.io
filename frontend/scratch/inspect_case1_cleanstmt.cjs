const testSql = `
CREATE TABLE target_user_summary AS
WITH base_data AS (
    SELECT id, name, status FROM raw_users
),
raw_users AS (
    SELECT id, name FROM base_data WHERE status = 'active'
)
SELECT 
    a.id,
    b.name AS alias_name, 
    a.name AS real_name
FROM raw_users a
LEFT JOIN base_data b ON a.id = b.id;
`;

const cleanSql = testSql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
const cleanSqlLower = cleanSql.toLowerCase();

// Check what cleanStmt is.
let cleanStmt = cleanSql;
const stmtLower = cleanSqlLower;
const withIdx = stmtLower.match(/\bwith\b/);
if (withIdx && withIdx.index !== undefined) {
  let depth = 0;
  let mainActionIdx = -1;
  const searchStart = withIdx.index + 4;
  for (let i = searchStart; i < cleanSql.length; i++) {
    if (cleanSql[i] === '(') depth++;
    if (cleanSql[i] === ')') depth--;
    if (depth === 0) {
      const sub = stmtLower.substring(i).trim();
      if (/^(?:select|insert|update|delete|merge)\b/i.test(sub)) {
        mainActionIdx = i;
        break;
      }
    }
  }
  console.log('mainActionIdx in statement-level stripping:', mainActionIdx, 'sub starts with:', cleanSql.substring(mainActionIdx, mainActionIdx + 30));
  if (mainActionIdx !== -1) {
    cleanStmt = cleanSql.substring(0, withIdx.index) + ' ' + cleanSql.substring(mainActionIdx);
  }
}
console.log('cleanStmt text:');
console.log(JSON.stringify(cleanStmt));

// Detect createMatch on cleanStmt
const createMatch = cleanStmt.match(/create\s+(?:table|view)\s+([\w.]+)\s+as\s/i);
console.log('createMatch:', createMatch);
