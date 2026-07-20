import { parseLineage } from './lineageParser';

interface TestCase {
  name: string;
  sql: string;
  expectedSources: string[];
  expectedTargets: string[];
  expectedFlows: Array<{ src: string; srcCol: string; tgt: string; tgtCol: string }>;
}

const testCases: TestCase[] = [
  {
    name: '1. Alias Shadowing',
    sql: `CREATE TABLE target_user_summary AS
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
LEFT JOIN base_data b ON a.id = b.id;`,
    expectedSources: ['raw_users'],
    expectedTargets: ['target_user_summary'],
    expectedFlows: [
      { src: 'raw_users', srcCol: 'id', tgt: 'target_user_summary', tgtCol: 'id' },
      { src: 'raw_users', srcCol: 'name', tgt: 'target_user_summary', tgtCol: 'alias_name' },
      { src: 'raw_users', srcCol: 'name', tgt: 'target_user_summary', tgtCol: 'real_name' }
    ]
  },
  {
    name: '2. LEFT JOIN missing lineage',
    sql: `INSERT INTO fact_sales (sales_date, amount, promotion_code)
SELECT s.sales_date, s.amount, pm.promotion_code
FROM stg_sales s
LEFT JOIN dim_promotion pm ON s.promotion_code = pm.promotion_code;`,
    expectedSources: ['stg_sales', 'dim_promotion'],
    expectedTargets: ['fact_sales'],
    expectedFlows: [
      { src: 'stg_sales', srcCol: 'sales_date', tgt: 'fact_sales', tgtCol: 'sales_date' },
      { src: 'stg_sales', srcCol: 'amount', tgt: 'fact_sales', tgtCol: 'amount' },
      { src: 'dim_promotion', srcCol: 'promotion_code', tgt: 'fact_sales', tgtCol: 'promotion_code' }
    ]
  },
  {
    name: '3. Set Operations (Blind Star)',
    sql: `INSERT INTO all_users
SELECT * FROM (
    SELECT id, name FROM active_users
    UNION ALL
    SELECT id, name FROM inactive_users
) sub;`,
    expectedSources: ['active_users', 'inactive_users'],
    expectedTargets: ['all_users'],
    expectedFlows: [
      { src: 'active_users', srcCol: '*', tgt: 'all_users', tgtCol: '*' },
      { src: 'inactive_users', srcCol: '*', tgt: 'all_users', tgtCol: '*' }
    ]
  }
];

let passed = 0;
let failed = 0;
const failures: string[] = [];

testCases.forEach((tc) => {
  const result = parseLineage(tc.sql);
  const errors: string[] = [];

  const sortedExpSrc = [...tc.expectedSources].sort();
  const sortedActSrc = [...result.sources].sort();
  if (JSON.stringify(sortedExpSrc) !== JSON.stringify(sortedActSrc)) {
    errors.push(`  Sources: expected [${sortedExpSrc}] got [${sortedActSrc}]`);
  }

  const sortedExpTgt = [...tc.expectedTargets].sort();
  const sortedActTgt = [...result.targets].sort();
  if (JSON.stringify(sortedExpTgt) !== JSON.stringify(sortedActTgt)) {
    errors.push(`  Targets: expected [${sortedExpTgt}] got [${sortedActTgt}]`);
  }

  tc.expectedFlows.forEach((ef) => {
    const found = result.flows.some(
      f => f.sourceTable === ef.src && f.sourceCol === ef.srcCol &&
           f.targetTable === ef.tgt && f.targetCol === ef.tgtCol
    );
    if (!found) {
      errors.push(`  Missing flow: ${ef.src}.${ef.srcCol} → ${ef.tgt}.${ef.tgtCol}`);
    }
  });

  if (errors.length === 0) {
    console.log(`✅ PASS: ${tc.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${tc.name}`);
    errors.forEach(e => console.log(e));
    if (result.flows.length > 0) {
      console.log(`  Actual flows:`);
      result.flows.forEach(f => console.log(`    ${f.sourceTable}.${f.sourceCol} → ${f.targetTable}.${f.targetCol}`));
    }
    failed++;
    failures.push(tc.name);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${testCases.length} total`);
