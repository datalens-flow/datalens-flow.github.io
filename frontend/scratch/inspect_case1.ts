import { parseLineage } from '../src/utils/lineageParser';

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

const res = parseLineage(testSql);
console.log('TARGET:', res.targets);
console.log('SOURCES:', res.sources);
console.log('FLOWS:');
res.flows.forEach(f => {
  console.log(`  ${f.sourceTable}.${f.sourceCol} -> ${f.targetTable}.${f.targetCol}`);
});
