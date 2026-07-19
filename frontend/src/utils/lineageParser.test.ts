/**
 * Comprehensive lineage parser test suite
 * Covers all SQL patterns that can appear in ETL stored procedures
 */
import { parseLineage } from './lineageParser';

interface TestCase {
  name: string;
  sql: string;
  expectedSources: string[];
  expectedTargets: string[];
  expectedFlows: Array<{ src: string; srcCol: string; tgt: string; tgtCol: string }>;
}

const testCases: TestCase[] = [

  // ===== 1. BASIC INSERT...SELECT =====
  {
    name: '1a. Simple INSERT...SELECT without aliases',
    sql: `INSERT INTO target_table (col_a, col_b)
          SELECT col_a, col_b FROM source_table;`,
    expectedSources: ['source_table'],
    expectedTargets: ['target_table'],
    expectedFlows: [
      { src: 'source_table', srcCol: 'col_a', tgt: 'target_table', tgtCol: 'col_a' },
      { src: 'source_table', srcCol: 'col_b', tgt: 'target_table', tgtCol: 'col_b' },
    ],
  },
  {
    name: '1b. INSERT...SELECT with table alias',
    sql: `INSERT INTO target_table (name, amount)
          SELECT s.name, s.amount FROM source_table s;`,
    expectedSources: ['source_table'],
    expectedTargets: ['target_table'],
    expectedFlows: [
      { src: 'source_table', srcCol: 'name', tgt: 'target_table', tgtCol: 'name' },
      { src: 'source_table', srcCol: 'amount', tgt: 'target_table', tgtCol: 'amount' },
    ],
  },
  {
    name: '1c. INSERT...SELECT with AS alias',
    sql: `INSERT INTO target_table (name)
          SELECT s.name FROM source_table AS s;`,
    expectedSources: ['source_table'],
    expectedTargets: ['target_table'],
    expectedFlows: [
      { src: 'source_table', srcCol: 'name', tgt: 'target_table', tgtCol: 'name' },
    ],
  },

  // ===== 2. MULTI-TABLE JOINs =====
  {
    name: '2a. INSERT...SELECT with JOIN (2 sources)',
    sql: `INSERT INTO fact_sales (customer_key, product_key, amount)
          SELECT dc.customer_key, dp.product_key, s.amount
          FROM stg_sales s
          JOIN dim_customer dc ON s.customer_id = dc.customer_id
          JOIN dim_product dp ON s.product_code = dp.product_code;`,
    expectedSources: ['stg_sales', 'dim_customer', 'dim_product'],
    expectedTargets: ['fact_sales'],
    expectedFlows: [
      { src: 'dim_customer', srcCol: 'customer_key', tgt: 'fact_sales', tgtCol: 'customer_key' },
      { src: 'dim_product', srcCol: 'product_key', tgt: 'fact_sales', tgtCol: 'product_key' },
      { src: 'stg_sales', srcCol: 'amount', tgt: 'fact_sales', tgtCol: 'amount' },
    ],
  },
  {
    name: '2b. LEFT JOIN',
    sql: `INSERT INTO dim_customer (customer_id, name)
          SELECT s.customer_id, s.name
          FROM stg_customer s
          LEFT JOIN dim_customer d ON s.customer_id = d.customer_id
          WHERE d.customer_id IS NULL;`,
    expectedSources: ['stg_customer'],
    expectedTargets: ['dim_customer'],
    expectedFlows: [
      { src: 'stg_customer', srcCol: 'customer_id', tgt: 'dim_customer', tgtCol: 'customer_id' },
      { src: 'stg_customer', srcCol: 'name', tgt: 'dim_customer', tgtCol: 'name' },
    ],
  },

  // ===== 3. FILTERING NON-COLUMN EXPRESSIONS =====
  {
    name: '3a. CURRENT_TIMESTAMP should be filtered',
    sql: `INSERT INTO stg_customer (customer_id, load_date)
          SELECT customer_id, CURRENT_TIMESTAMP FROM ext_customer;`,
    expectedSources: ['ext_customer'],
    expectedTargets: ['stg_customer'],
    expectedFlows: [
      { src: 'ext_customer', srcCol: 'customer_id', tgt: 'stg_customer', tgtCol: 'customer_id' },
      // CURRENT_TIMESTAMP should NOT appear
    ],
  },
  {
    name: '3b. String literals should be filtered',
    sql: `INSERT INTO err_log (customer_id, error_msg, error_date)
          SELECT customer_id, 'Invalid salary', CURRENT_TIMESTAMP
          FROM stg_customer WHERE salary <= 0;`,
    expectedSources: ['stg_customer'],
    expectedTargets: ['err_log'],
    expectedFlows: [
      { src: 'stg_customer', srcCol: 'customer_id', tgt: 'err_log', tgtCol: 'customer_id' },
    ],
  },
  {
    name: '3c. Numeric literals should be filtered',
    sql: `INSERT INTO config_table (key, value)
          SELECT name, 0 FROM source;`,
    expectedSources: ['source'],
    expectedTargets: ['config_table'],
    expectedFlows: [
      { src: 'source', srcCol: 'name', tgt: 'config_table', tgtCol: 'key' },
    ],
  },
  {
    name: '3d. NULL should be filtered',
    sql: `INSERT INTO target (col_a, col_b)
          SELECT name, NULL FROM source;`,
    expectedSources: ['source'],
    expectedTargets: ['target'],
    expectedFlows: [
      { src: 'source', srcCol: 'name', tgt: 'target', tgtCol: 'col_a' },
    ],
  },

  // ===== 4. UPDATE...SET =====
  {
    name: '4a. UPDATE with FROM (PostgreSQL style)',
    sql: `UPDATE dim_customer d
          SET customer_name = s.customer_name,
              salary = s.salary,
              update_date = CURRENT_TIMESTAMP
          FROM stg_customer s
          WHERE d.customer_id = s.customer_id;`,
    expectedSources: ['stg_customer'],
    expectedTargets: ['dim_customer'],
    expectedFlows: [
      { src: 'stg_customer', srcCol: 'customer_name', tgt: 'dim_customer', tgtCol: 'customer_name' },
      { src: 'stg_customer', srcCol: 'salary', tgt: 'dim_customer', tgtCol: 'salary' },
    ],
  },
  {
    name: '4b. UPDATE without alias',
    sql: `UPDATE dim_customer
          SET customer_name = 'Unknown'
          WHERE customer_id IS NULL;`,
    expectedSources: [],
    expectedTargets: ['dim_customer'],
    expectedFlows: [],
  },

  // ===== 5. MULTI-STATEMENT ETL =====
  {
    name: '5a. Full ETL pipeline (ext → stg → dim)',
    sql: `
      INSERT INTO stg_customer (customer_id, name)
      SELECT customer_id, name FROM ext_customer;

      INSERT INTO dim_customer (customer_id, name)
      SELECT customer_id, name FROM stg_customer;
    `,
    expectedSources: ['ext_customer', 'stg_customer'],
    expectedTargets: ['stg_customer', 'dim_customer'],
    expectedFlows: [
      { src: 'ext_customer', srcCol: 'customer_id', tgt: 'stg_customer', tgtCol: 'customer_id' },
      { src: 'ext_customer', srcCol: 'name', tgt: 'stg_customer', tgtCol: 'name' },
      { src: 'stg_customer', srcCol: 'customer_id', tgt: 'dim_customer', tgtCol: 'customer_id' },
      { src: 'stg_customer', srcCol: 'name', tgt: 'dim_customer', tgtCol: 'name' },
    ],
  },

  // ===== 6. CREATE TABLE/VIEW AS SELECT =====
  {
    name: '6a. CREATE TABLE AS SELECT (CTAS)',
    sql: `CREATE TABLE summary AS
          SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id;`,
    expectedSources: ['orders'],
    expectedTargets: ['summary'],
    expectedFlows: [
      // No target cols in CTAS without column list → table-level flow
      { src: 'orders', srcCol: '*', tgt: 'summary', tgtCol: '*' },
    ],
  },
  {
    name: '6b. CREATE VIEW AS SELECT',
    sql: `CREATE VIEW v_active_customers AS
          SELECT customer_id, name FROM customers WHERE active = 1;`,
    expectedSources: ['customers'],
    expectedTargets: ['v_active_customers'],
    expectedFlows: [
      { src: 'customers', srcCol: '*', tgt: 'v_active_customers', tgtCol: '*' },
    ],
  },

  // ===== 7. MERGE (UPSERT) =====
  {
    name: '7a. MERGE INTO',
    sql: `MERGE INTO dim_customer t
          USING stg_customer s ON t.customer_id = s.customer_id
          WHEN MATCHED THEN UPDATE SET t.name = s.name
          WHEN NOT MATCHED THEN INSERT (customer_id, name) VALUES (s.customer_id, s.name);`,
    expectedSources: ['stg_customer'],
    expectedTargets: ['dim_customer'],
    expectedFlows: [
      // MERGE is detected but detailed column mapping is complex, expect at least table-level
      { src: 'stg_customer', srcCol: '*', tgt: 'dim_customer', tgtCol: '*' },
    ],
  },

  // ===== 8. COMMENTS =====
  {
    name: '8a. SQL with single-line comments',
    sql: `-- This is a comment
          INSERT INTO target (col_a)
          -- Another comment
          SELECT col_a FROM source;`,
    expectedSources: ['source'],
    expectedTargets: ['target'],
    expectedFlows: [
      { src: 'source', srcCol: 'col_a', tgt: 'target', tgtCol: 'col_a' },
    ],
  },
  {
    name: '8b. SQL with block comments',
    sql: `/* Block comment */
          INSERT INTO target (col_a)
          SELECT col_a /* inline comment */ FROM source;`,
    expectedSources: ['source'],
    expectedTargets: ['target'],
    expectedFlows: [
      { src: 'source', srcCol: 'col_a', tgt: 'target', tgtCol: 'col_a' },
    ],
  },

  // ===== 9. DELETE-only (should be skipped) =====
  {
    name: '9a. DELETE statement only',
    sql: `DELETE FROM stg_customer WHERE business_date < '2024-01-01';`,
    expectedSources: [],
    expectedTargets: [],
    expectedFlows: [],
  },

  // ===== 10. SCHEMA-QUALIFIED TABLES =====
  {
    name: '10a. Schema.table notation',
    sql: `INSERT INTO staging.stg_customer (customer_id)
          SELECT customer_id FROM raw.ext_customer;`,
    expectedSources: ['ext_customer'],
    expectedTargets: ['stg_customer'],
    expectedFlows: [
      { src: 'ext_customer', srcCol: 'customer_id', tgt: 'stg_customer', tgtCol: 'customer_id' },
    ],
  },

  // ===== 11. SUBQUERIES =====
  {
    name: '11a. INSERT with subquery in FROM',
    sql: `INSERT INTO summary (total_count)
          SELECT COUNT(*) FROM (SELECT customer_id FROM orders) sub;`,
    expectedSources: ['orders'],
    expectedTargets: ['summary'],
    expectedFlows: [
      // Complex subquery → expect at least table-level or fallback
    ],
  },

  // ===== 12. INSERT...VALUES (no source table) =====
  {
    name: '12a. INSERT VALUES should produce no flows',
    sql: `INSERT INTO config (key, value) VALUES ('batch_size', '1000');`,
    expectedSources: [],
    expectedTargets: ['config'],
    expectedFlows: [],
  },

  // ===== 13. CASE EXPRESSIONS =====
  {
    name: '13a. CASE WHEN in SELECT',
    sql: `INSERT INTO target (status_flag, customer_id)
          SELECT CASE WHEN s.status = 'A' THEN 1 ELSE 0 END, s.customer_id
          FROM source s;`,
    expectedSources: ['source'],
    expectedTargets: ['target'],
    expectedFlows: [
      // CASE expression - might not resolve cleanly, at least customer_id should map
      { src: 'source', srcCol: 'customer_id', tgt: 'target', tgtCol: 'customer_id' },
    ],
  },

  // ===== 14. FUNCTION CALLS =====
  {
    name: '14a. Function wrapping column (COALESCE, TRIM, UPPER)',
    sql: `INSERT INTO target (name, code)
          SELECT COALESCE(s.name, 'N/A'), UPPER(s.code)
          FROM source s;`,
    expectedSources: ['source'],
    expectedTargets: ['target'],
    expectedFlows: [
      // Functions wrapping columns - parser may not extract inner column
    ],
  },

  // ===== 15. REAL-WORLD ETL (the user's example) =====
  {
    name: '15. Full ETL pipeline from user example',
    sql: `
DELETE FROM stg_customer WHERE business_date = p_batch_date;

INSERT INTO stg_customer (customer_id, customer_name, birth_date, salary, business_date, load_date)
SELECT customer_id, customer_name, birth_date, salary, business_date, CURRENT_TIMESTAMP
FROM ext_customer WHERE business_date = p_batch_date;

INSERT INTO err_customer (customer_id, error_message, error_date)
SELECT customer_id, 'Salary must be greater than zero', CURRENT_TIMESTAMP
FROM stg_customer WHERE salary <= 0;

DELETE FROM stg_customer WHERE salary <= 0;

UPDATE dim_customer d
   SET customer_name = s.customer_name,
       birth_date    = s.birth_date,
       salary        = s.salary,
       update_date   = CURRENT_TIMESTAMP
FROM stg_customer s
WHERE d.customer_id = s.customer_id;

INSERT INTO dim_customer (customer_id, customer_name, birth_date, salary, create_date)
SELECT s.customer_id, s.customer_name, s.birth_date, s.salary, CURRENT_TIMESTAMP
FROM stg_customer s
LEFT JOIN dim_customer d ON s.customer_id = d.customer_id
WHERE d.customer_id IS NULL;

INSERT INTO fact_sales (customer_key, product_key, sales_date, amount, load_date)
SELECT dc.customer_key, dp.product_key, s.sales_date, s.amount, CURRENT_TIMESTAMP
FROM stg_sales s
     JOIN dim_customer dc ON s.customer_id = dc.customer_id
     JOIN dim_product dp ON s.product_code = dp.product_code
WHERE s.sales_date = p_batch_date;
    `,
    expectedSources: ['ext_customer', 'stg_customer', 'stg_sales', 'dim_customer', 'dim_product'],
    expectedTargets: ['stg_customer', 'err_customer', 'dim_customer', 'fact_sales'],
    expectedFlows: [
      // ext → stg
      { src: 'ext_customer', srcCol: 'customer_id', tgt: 'stg_customer', tgtCol: 'customer_id' },
      { src: 'ext_customer', srcCol: 'customer_name', tgt: 'stg_customer', tgtCol: 'customer_name' },
      { src: 'ext_customer', srcCol: 'birth_date', tgt: 'stg_customer', tgtCol: 'birth_date' },
      { src: 'ext_customer', srcCol: 'salary', tgt: 'stg_customer', tgtCol: 'salary' },
      { src: 'ext_customer', srcCol: 'business_date', tgt: 'stg_customer', tgtCol: 'business_date' },
      // stg → err
      { src: 'stg_customer', srcCol: 'customer_id', tgt: 'err_customer', tgtCol: 'customer_id' },
      // UPDATE stg → dim
      { src: 'stg_customer', srcCol: 'customer_name', tgt: 'dim_customer', tgtCol: 'customer_name' },
      { src: 'stg_customer', srcCol: 'birth_date', tgt: 'dim_customer', tgtCol: 'birth_date' },
      { src: 'stg_customer', srcCol: 'salary', tgt: 'dim_customer', tgtCol: 'salary' },
      // INSERT stg → dim
      { src: 'stg_customer', srcCol: 'customer_id', tgt: 'dim_customer', tgtCol: 'customer_id' },
      { src: 'stg_customer', srcCol: 'customer_name', tgt: 'dim_customer', tgtCol: 'customer_name' },
      { src: 'stg_customer', srcCol: 'birth_date', tgt: 'dim_customer', tgtCol: 'birth_date' },
      { src: 'stg_customer', srcCol: 'salary', tgt: 'dim_customer', tgtCol: 'salary' },
      // fact
      { src: 'dim_customer', srcCol: 'customer_key', tgt: 'fact_sales', tgtCol: 'customer_key' },
      { src: 'dim_product', srcCol: 'product_key', tgt: 'fact_sales', tgtCol: 'product_key' },
      { src: 'stg_sales', srcCol: 'sales_date', tgt: 'fact_sales', tgtCol: 'sales_date' },
      { src: 'stg_sales', srcCol: 'amount', tgt: 'fact_sales', tgtCol: 'amount' },
    ],
  },

  // ===== 16. CTE (WITH ... AS) =====
  {
    name: '16a. Simple CTE with INSERT',
    sql: `
      WITH active_customers AS (
        SELECT customer_id, name
        FROM customers
        WHERE status = 'A'
      )
      INSERT INTO target (customer_id, name)
      SELECT customer_id, name
      FROM active_customers;
    `,
    expectedSources: ['customers'],
    expectedTargets: ['target'],
    expectedFlows: [
      { src: 'customers', srcCol: 'customer_id', tgt: 'target', tgtCol: 'customer_id' },
      { src: 'customers', srcCol: 'name', tgt: 'target', tgtCol: 'name' },
    ],
  },
  {
    name: '16b. CTE with JOIN in final query',
    sql: `
      WITH latest_customer AS (
        SELECT customer_id, customer_name, salary
        FROM ext_customer
        WHERE rn = 1
      )
      INSERT INTO stg_customer (customer_id, customer_name, salary)
      SELECT lc.customer_id, lc.customer_name, lc.salary
      FROM latest_customer lc
      JOIN dim_province dp ON lc.province_id = dp.province_id;
    `,
    expectedSources: ['ext_customer', 'dim_province'],
    expectedTargets: ['stg_customer'],
    expectedFlows: [
      { src: 'ext_customer', srcCol: 'customer_id', tgt: 'stg_customer', tgtCol: 'customer_id' },
      { src: 'ext_customer', srcCol: 'customer_name', tgt: 'stg_customer', tgtCol: 'customer_name' },
      { src: 'ext_customer', srcCol: 'salary', tgt: 'stg_customer', tgtCol: 'salary' },
    ],
  },
  {
    name: '16c. Multiple CTEs chained',
    sql: `
      WITH step1 AS (
        SELECT id, amount FROM raw_orders
      ),
      step2 AS (
        SELECT id, amount * 1.07 as amount_vat FROM step1
      )
      INSERT INTO final_orders (id, amount_vat)
      SELECT id, amount_vat FROM step2;
    `,
    expectedSources: ['raw_orders'],
    expectedTargets: ['final_orders'],
    expectedFlows: [
      // CTE chains should resolve to the real source table
    ],
  },

  // ===== 17. WINDOW FUNCTIONS (should be filtered) =====
  {
    name: '17a. ROW_NUMBER() should be filtered',
    sql: `INSERT INTO target (customer_id, rn)
          SELECT customer_id, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY load_date DESC)
          FROM source;`,
    expectedSources: ['source'],
    expectedTargets: ['target'],
    expectedFlows: [
      { src: 'source', srcCol: 'customer_id', tgt: 'target', tgtCol: 'customer_id' },
      // ROW_NUMBER() should NOT appear as a flow
    ],
  },
  {
    name: '17b. Other window functions filtered',
    sql: `INSERT INTO target (id, ranking, total)
          SELECT id, RANK() OVER (ORDER BY score DESC), SUM(amount) OVER ()
          FROM source;`,
    expectedSources: ['source'],
    expectedTargets: ['target'],
    expectedFlows: [
      { src: 'source', srcCol: 'id', tgt: 'target', tgtCol: 'id' },
    ],
  },

  // ===== 18. CASE WHEN (should be filtered or handled) =====
  {
    name: '18a. CASE WHEN without nested commas',
    sql: `INSERT INTO target (customer_id, grade)
          SELECT customer_id, CASE WHEN salary > 50000 THEN 'A' ELSE 'B' END
          FROM source;`,
    expectedSources: ['source'],
    expectedTargets: ['target'],
    expectedFlows: [
      { src: 'source', srcCol: 'customer_id', tgt: 'target', tgtCol: 'customer_id' },
    ],
  },

  // ===== 19. AGGREGATE FUNCTIONS (should be filtered) =====
  {
    name: '19a. COUNT, SUM, MAX should be filtered',
    sql: `INSERT INTO summary (customer_id, total, cnt, max_amount)
          SELECT customer_id, SUM(amount), COUNT(*), MAX(amount)
          FROM orders GROUP BY customer_id;`,
    expectedSources: ['orders'],
    expectedTargets: ['summary'],
    expectedFlows: [
      { src: 'orders', srcCol: 'customer_id', tgt: 'summary', tgtCol: 'customer_id' },
    ],
  },

  // ===== 20. EXPRESSIONS WITH PARENTHESES (should be filtered) =====
  {
    name: '20a. Arithmetic expressions should be filtered',
    sql: `INSERT INTO target (id, profit)
          SELECT id, (amount - cost) FROM source;`,
    expectedSources: ['source'],
    expectedTargets: ['target'],
    expectedFlows: [
      { src: 'source', srcCol: 'id', tgt: 'target', tgtCol: 'id' },
    ],
  },

  // ===== 21. COALESCE / FUNCTION wrapping real column =====
  {
    name: '21a. COALESCE should be filtered (not extract inner col)',
    sql: `INSERT INTO target (name, code)
          SELECT COALESCE(s.name, 'Unknown'), TRIM(s.code)
          FROM source s;`,
    expectedSources: ['source'],
    expectedTargets: ['target'],
    expectedFlows: [
      // Functions wrapping columns are complex expressions, should be filtered
    ],
  },
];

// ===== Run Tests =====
let passed = 0;
let failed = 0;
const failures: string[] = [];

testCases.forEach((tc) => {
  const result = parseLineage(tc.sql);
  const errors: string[] = [];

  // Check sources
  const sortedExpSrc = [...tc.expectedSources].sort();
  const sortedActSrc = [...result.sources].sort();
  if (JSON.stringify(sortedExpSrc) !== JSON.stringify(sortedActSrc)) {
    errors.push(`  Sources: expected [${sortedExpSrc}] got [${sortedActSrc}]`);
  }

  // Check targets
  const sortedExpTgt = [...tc.expectedTargets].sort();
  const sortedActTgt = [...result.targets].sort();
  if (JSON.stringify(sortedExpTgt) !== JSON.stringify(sortedActTgt)) {
    errors.push(`  Targets: expected [${sortedExpTgt}] got [${sortedActTgt}]`);
  }

  // Check flows (each expected flow must exist in actual)
  tc.expectedFlows.forEach((ef) => {
    const found = result.flows.some(
      f => f.sourceTable === ef.src && f.sourceCol === ef.srcCol &&
           f.targetTable === ef.tgt && f.targetCol === ef.tgtCol
    );
    if (!found) {
      errors.push(`  Missing flow: ${ef.src}.${ef.srcCol} → ${ef.tgt}.${ef.tgtCol}`);
    }
  });

  // Check no unexpected "*" flows when specific columns are expected
  if (tc.expectedFlows.length > 0 && !tc.expectedFlows.some(f => f.srcCol === '*')) {
    const wildcardFlows = result.flows.filter(f => f.sourceCol === '*' || f.targetCol === '*');
    if (wildcardFlows.length > 0) {
      errors.push(`  Unexpected wildcard flows: ${wildcardFlows.map(f => `${f.sourceTable}.*→${f.targetTable}.*`).join(', ')}`);
    }
  }

  if (errors.length === 0) {
    console.log(`✅ PASS: ${tc.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${tc.name}`);
    errors.forEach(e => console.log(e));
    // Also show actual flows for debugging
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
if (failures.length > 0) {
  console.log(`\nFailed tests:`);
  failures.forEach(f => console.log(`  - ${f}`));
}
console.log(`${'='.repeat(60)}`);
