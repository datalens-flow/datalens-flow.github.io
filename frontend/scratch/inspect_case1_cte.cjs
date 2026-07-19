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

let searchPos = 0;
const cteNames = new Set();
const cteToRealSources = {};
const cteOrder = [];

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

  const cteBlock = cleanSql.substring(withIdx + 4, mainActionIdx !== -1 ? mainActionIdx : cleanSql.length);
  console.log('cteBlock:', JSON.stringify(cteBlock));

  let currentPos = 0;
  while (currentPos < cteBlock.length) {
    const nextAsMatch = cteBlock.substring(currentPos).match(/\b(\w+)\s+as\s*\(/i);
    if (!nextAsMatch || nextAsMatch.index === undefined) break;

    const cteName = nextAsMatch[1].toLowerCase();
    const matchStartInBlock = currentPos + nextAsMatch.index;
    const bodyStart = matchStartInBlock + nextAsMatch[0].length;

    let depthInner = 1;
    let bodyEnd = bodyStart;
    for (let i = bodyStart; i < cteBlock.length && depthInner > 0; i++) {
      if (cteBlock[i] === '(') depthInner++;
      if (cteBlock[i] === ')') depthInner--;
      bodyEnd = i;
    }

    const cteBody = cteBlock.substring(bodyStart, bodyEnd);
    console.log('CTE name:', cteName, 'body:', JSON.stringify(cteBody));

    cteOrder.push(cteName);
    cteNames.add(cteName);
    currentPos = bodyEnd + 1;
  }
  searchPos = mainActionIdx !== -1 ? mainActionIdx : cleanSql.length;
}

console.log('cteOrder:', cteOrder);
