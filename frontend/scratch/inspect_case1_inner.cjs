// Self-contained CTE step debugger for Case 1

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

// Let's copy parseLineage internals into a JS script to trace step by step
const SQL_KEYWORDS = new Set([
  'select', 'set', 'where', 'on', 'and', 'or', 'not', 'null',
  'inner', 'outer', 'left', 'right', 'cross', 'natural', 'full', 'into',
  'values', 'group', 'order', 'having', 'limit', 'offset', 'as', 'case',
  'when', 'then', 'else', 'end', 'between', 'like', 'in', 'exists', 'is',
  'delete', 'insert', 'update', 'merge', 'using', 'matched', 'by', 'excluded',
]);

const extractTableName = (name) => {
  const parts = name.split('.');
  return parts[parts.length - 1].toLowerCase();
};

const cteNames = new Set(['base_data', 'raw_users']);
const cteToRealSources = {
  base_data: ['raw_users'],
  raw_users: ['base_data'],
};
const cteOrder = ['base_data', 'raw_users'];

const resolveCteSources = (cteName, visited = new Set()) => {
  if (visited.has(cteName)) return [];
  visited.add(cteName);
  const directSources = cteToRealSources[cteName] || [];
  const resolved = [];
  const currentCteIdx = cteOrder.indexOf(cteName);

  directSources.forEach(src => {
    const srcIdx = cteOrder.indexOf(src);
    if (srcIdx !== -1 && srcIdx < currentCteIdx) {
      resolved.push(...resolveCteSources(src, visited));
    } else {
      resolved.push(src);
    }
  });
  return [...new Set(resolved)];
};

console.log("resolveCteSources('base_data'):", resolveCteSources('base_data'));
console.log("resolveCteSources('raw_users'):", resolveCteSources('raw_users'));

const cleanStmt = `
CREATE TABLE target_user_summary AS
SELECT 
    a.id,
    b.name AS alias_name, 
    a.name AS real_name
FROM raw_users a
LEFT JOIN base_data b ON a.id = b.id;
`;

const aliasMap = {};
const aliasMatches = [...cleanStmt.matchAll(/(?:from|join|using)\s+([\w.]+)(?:\s+(?:as\s+)?(\w+))?/gi)];
aliasMatches.forEach(m => {
  const fullPath = m[1].toLowerCase();
  const tableName = extractTableName(m[1]);
  const alias = m[2] ? m[2].toLowerCase() : tableName;
  aliasMap[alias] = tableName;
  aliasMap[tableName] = tableName;
});

console.log('Initial aliasMap:', aliasMap);

const cteAliasExpansions = {};
Object.entries(aliasMap).forEach(([alias, tableName]) => {
  if (cteNames.has(tableName)) {
    const realSources = resolveCteSources(tableName);
    cteAliasExpansions[alias] = realSources;
    if (realSources.length > 0) {
      aliasMap[alias] = realSources[0];
    } else {
      delete aliasMap[alias];
    }
  }
});

console.log('After CTE expansions, aliasMap:', aliasMap);
console.log('cteAliasExpansions:', cteAliasExpansions);
