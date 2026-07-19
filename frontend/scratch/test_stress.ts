import { parseLineage } from '../src/utils/lineageParser';

const stressSql = `
/*==============================================================================
    DATA LINEAGE STRESS TEST SUITE
==============================================================================*/

--------------------------------------------------------------------------------
-- TEST CASE 1 : The "Alias Shadowing"
--------------------------------------------------------------------------------
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

--------------------------------------------------------------------------------
-- TEST CASE 2 : The "Blind Star" with Set Operations
--------------------------------------------------------------------------------
CREATE VIEW vw_consolidated_sales AS
WITH web_sales AS (
    SELECT * FROM tb_sales_web 
),
pos_sales AS (
    SELECT receipt_no AS order_id, total_price AS amount, purchase_date AS tx_date 
    FROM tb_sales_pos
)
SELECT * FROM web_sales
UNION ALL
SELECT * FROM pos_sales;

--------------------------------------------------------------------------------
-- TEST CASE 3 : Lateral Joins & Array/JSON Unnesting
--------------------------------------------------------------------------------
INSERT INTO target_event_logs
SELECT 
    e.event_id,
    e.user_id,
    e.payload->'device'->>'os' AS os_type,
    tags.value AS tag_name
FROM raw_event_logs e
CROSS JOIN UNNEST(e.tags_array) AS tags(value);

--------------------------------------------------------------------------------
-- TEST CASE 4 : The "Correlated Subquery" in SELECT
--------------------------------------------------------------------------------
CREATE TABLE target_customer_stats AS
SELECT 
    c.customer_id,
    c.customer_name,
    (
        SELECT MAX(order_date) 
        FROM fact_orders o 
        WHERE o.customer_id = c.customer_id
    ) AS last_order_date
FROM dim_customer c;

--------------------------------------------------------------------------------
-- TEST CASE 5 : Multi-Layer Window Functions
--------------------------------------------------------------------------------
CREATE TABLE target_running_totals AS
SELECT 
    customer_id,
    order_month,
    current_amount,
    SUM(current_amount) OVER (
        PARTITION BY customer_id 
        ORDER BY order_month
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total
FROM (
    SELECT 
        customer_id, 
        DATE_TRUNC('month', order_date) AS order_month,
        SUM(amount) AS current_amount
    FROM stg_orders
    GROUP BY 1, 2
) sub;

--------------------------------------------------------------------------------
-- TEST CASE 6 : Complex MERGE / UPSERT
--------------------------------------------------------------------------------
MERGE INTO dim_product AS target
USING (
    SELECT product_id, product_name, price FROM stg_product_updates
) AS source
ON target.product_id = source.product_id
WHEN MATCHED THEN 
    UPDATE SET 
        target.product_name = source.product_name,
        target.price = source.price,
        target.update_date = CURRENT_DATE
WHEN NOT MATCHED THEN 
    INSERT (product_id, product_name, price, create_date)
    VALUES (source.product_id, source.product_name, source.price, CURRENT_DATE);
`;

const res = parseLineage(stressSql);
console.log('SOURCES:', res.sources);
console.log('TARGETS:', res.targets);
console.log('FLOWS:');
res.flows.forEach(f => {
  console.log(`  ${f.sourceTable}.${f.sourceCol} -> ${f.targetTable}.${f.targetCol}`);
});
