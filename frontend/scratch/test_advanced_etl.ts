import { parseLineage } from '../src/utils/lineageParser';

// Let's modify parseLineage to log cteNames or print it from here.
// We can just call parseLineage and then print it.
console.log('Running test...');

const advancedSql = `
/*==============================================================================
    ADVANCED ETL CUSTOMER & SALES
==============================================================================*/

--------------------------------------------------------------------------------
-- STEP 1 : LOAD CUSTOMER STAGING (ใช้เหมือนเดิมได้เลย ทำ Deduplicate ดีแล้ว)
--------------------------------------------------------------------------------
DELETE FROM stg_customer WHERE business_date = p_batch_date;

INSERT INTO stg_customer (
    customer_id, customer_name, gender, birth_date, province_code, 
    occupation_code, salary, risk_grade, business_date, load_date
)
WITH latest_customer AS (
    SELECT 
        e.*, 
        ROW_NUMBER() OVER (
            PARTITION BY e.customer_id 
            ORDER BY e.update_datetime DESC, e.tracking_code DESC
        ) as rn
    FROM ext_customer e
    WHERE e.business_date = p_batch_date
)
SELECT 
    customer_id,
    UPPER(TRIM(customer_name)),
    COALESCE(gender, 'U'),
    birth_date,
    province_code,
    occupation_code,
    GREATEST(salary, 0) AS salary, -- [Advanced] ใช้ GREATEST แทน CASE WHEN ลดความยาวโค้ด
    CASE 
        WHEN salary >= 1000000 THEN 'VIP'
        WHEN salary >= 300000  THEN 'A'
        WHEN salary >= 100000  THEN 'B'
        ELSE 'C'
    END AS risk_grade,
    business_date,
    CURRENT_TIMESTAMP
FROM latest_customer
WHERE rn = 1;

--------------------------------------------------------------------------------
-- STEP 2 : VALIDATION & REMOVE INVALID DATA (ยุบรวมเป็นขั้นตอนเดียว)
--------------------------------------------------------------------------------
-- [Advanced] ใช้ Data-Modifying CTE (RETURNING) ลบและดึงข้อมูลที่ผิดปกติไป Insert ทันที
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

--------------------------------------------------------------------------------
-- STEP 3 : UPSERT DIMENSION (ยุบรวม UPDATE/INSERT ด้วย ON CONFLICT หรือ MERGE)
--------------------------------------------------------------------------------
-- [Advanced] ใช้ UPSERT (INSERT ... ON CONFLICT) ทำงานเร็วกว่าและไม่มีปัญหา Race Condition
INSERT INTO dim_customer (
    customer_id, customer_name, gender, birth_date, 
    province_key, occupation_key, salary, risk_grade, create_date
)
SELECT 
    s.customer_id, s.customer_name, s.gender, s.birth_date, 
    p.province_key, o.occupation_key, s.salary, s.risk_grade, 
    CURRENT_TIMESTAMP
FROM stg_customer s
LEFT JOIN dim_province p ON s.province_code = p.province_code
LEFT JOIN dim_occupation o ON s.occupation_code = o.occupation_code

ON CONFLICT (customer_id) DO UPDATE 
SET 
    customer_name  = EXCLUDED.customer_name,
    gender         = EXCLUDED.gender,
    birth_date     = EXCLUDED.birth_date,
    province_key   = EXCLUDED.province_key,
    occupation_key = EXCLUDED.occupation_key,
    salary         = EXCLUDED.salary,
    risk_grade     = EXCLUDED.risk_grade,
    update_date    = CURRENT_TIMESTAMP
WHERE 
    -- [Optimization] Update เฉพาะเมื่อมีข้อมูลเปลี่ยนแปลงจริงๆ เท่านั้น
    dim_customer.salary IS DISTINCT FROM EXCLUDED.salary OR
    dim_customer.risk_grade IS DISTINCT FROM EXCLUDED.risk_grade;

--------------------------------------------------------------------------------
-- STEP 4 : LOAD FACT SALES
--------------------------------------------------------------------------------
INSERT INTO fact_sales (
    customer_key, product_key, branch_key, calendar_key, promotion_key, 
    sales_date, quantity, amount, discount, net_amount, vat_amount, total_amount, load_date
)
WITH sales_data AS (
    SELECT 
        customer_id, product_code, branch_code, sales_date, promotion_code,
        SUM(quantity) as quantity,
        SUM(amount) as amount,
        SUM(discount) as discount
    FROM stg_sales
    WHERE sales_date = p_batch_date
    GROUP BY 1, 2, 3, 4, 5 -- [Advanced] ใช้ Positional Group By ให้อ่านง่าย
)
SELECT 
    dc.customer_key, dp.product_key, db.branch_key, cal.calendar_key,
    COALESCE(pm.promotion_key, -1),
    sd.sales_date, sd.quantity, sd.amount, sd.discount,
    (sd.amount - sd.discount) AS net_amount,
    ROUND((sd.amount - sd.discount) * 0.07, 2) AS vat_amount,
    ROUND((sd.amount - sd.discount) * 1.07, 2) AS total_amount,
    CURRENT_TIMESTAMP
FROM sales_data sd
JOIN dim_customer dc ON sd.customer_id = dc.customer_id
JOIN dim_product dp  ON sd.product_code = dp.product_code
JOIN dim_branch db   ON sd.branch_code = db.branch_code
JOIN dim_calendar cal ON sd.sales_date = cal.calendar_date
LEFT JOIN dim_promotion pm ON sd.promotion_code = pm.promotion_code
-- [Advanced] ถ้ามี Unique Constraint (customer_key, product_key, sales_date, branch_key) 
-- แนะนำให้ใช้ ON CONFLICT DO NOTHING แทน WHERE NOT EXISTS จะเร็วกว่ามาก
WHERE NOT EXISTS (
    SELECT 1 FROM fact_sales f
    WHERE f.customer_key = dc.customer_key
      AND f.product_key = dp.product_key
      AND f.branch_key = db.branch_key
      AND f.sales_date = sd.sales_date
);

--------------------------------------------------------------------------------
-- STEP 5 : UPDATE CUSTOMER SUMMARY (แก้ปัญหา Performance ร้ายแรง)
--------------------------------------------------------------------------------
-- [Advanced] ใช้ CTE คำนวณครั้งเดียว แทนการทำ Correlated Subquery 5 รอบ
WITH customer_agg AS (
    SELECT 
        f.customer_key,
        COALESCE(SUM(f.total_amount), 0) AS total_purchase,
        COUNT(*) AS total_transaction,
        AVG(f.total_amount) AS avg_purchase,
        MAX(f.sales_date) AS last_purchase_date
    FROM fact_sales f
    -- [Optimization] กรองคำนวณเฉพาะลูกค้าที่มีความเคลื่อนไหวในรอบ Batch นี้
    WHERE f.customer_key IN (
        SELECT customer_key FROM dim_customer dc 
        JOIN stg_sales ss ON dc.customer_id = ss.customer_id
    )
    GROUP BY f.customer_key
)
UPDATE dim_customer d
SET 
    total_purchase      = agg.total_purchase,
    total_transaction   = agg.total_transaction,
    avg_purchase        = agg.avg_purchase,
    last_purchase_date  = agg.last_purchase_date,
    customer_segment    = CASE 
        WHEN agg.total_purchase >= 1000000 THEN 'PLATINUM'
        WHEN agg.total_purchase >= 500000  THEN 'GOLD'
        WHEN agg.total_purchase >= 100000  THEN 'SILVER'
        ELSE 'STANDARD' 
    END
FROM customer_agg agg
WHERE d.customer_key = agg.customer_key;

--------------------------------------------------------------------------------
-- STEP 6 : CLEANUP
--------------------------------------------------------------------------------
TRUNCATE TABLE stg_customer;
TRUNCATE TABLE stg_sales;
`;

const res = parseLineage(advancedSql);
console.log('SOURCES:', res.sources);
console.log('TARGETS:', res.targets);
console.log('FLOWS:');
res.flows.forEach(f => {
  console.log(`  ${f.sourceTable}.${f.sourceCol} -> ${f.targetTable}.${f.targetCol}`);
});
