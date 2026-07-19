import { parseLineage } from '../src/utils/lineageParser';

const testSql = `
--------------------------------------------------------------------------------
-- STEP 4 : LOAD FACT SALES
--------------------------------------------------------------------------------

INSERT INTO fact_sales
(
      customer_key
    , product_key
    , branch_key
    , calendar_key
    , promotion_key
    , sales_date
    , quantity
    , amount
    , discount
    , net_amount
    , vat_amount
    , total_amount
    , load_date
)

WITH sales_data AS
(
    SELECT

          s.customer_id
        , s.product_code
        , s.branch_code
        , s.sales_date
        , s.promotion_code
        , SUM(s.quantity) quantity
        , SUM(s.amount) amount
        , SUM(s.discount) discount

    FROM stg_sales s

    WHERE s.sales_date = p_batch_date

    GROUP BY

          s.customer_id
        , s.product_code
        , s.branch_code
        , s.sales_date
        , s.promotion_code
)

SELECT

      dc.customer_key
    , dp.product_key
    , db.branch_key
    , cal.calendar_key
    , COALESCE(pm.promotion_key,-1)

    , sd.sales_date

    , sd.quantity

    , sd.amount

    , sd.discount

    , sd.amount - sd.discount

    , ROUND((sd.amount-sd.discount)*0.07,2)

    , ROUND((sd.amount-sd.discount)*1.07,2)

    , CURRENT_TIMESTAMP

FROM sales_data sd

JOIN dim_customer dc
ON sd.customer_id = dc.customer_id

JOIN dim_product dp
ON sd.product_code = dp.product_code

JOIN dim_branch db
ON sd.branch_code = db.branch_code

JOIN dim_calendar cal
ON sd.sales_date = cal.calendar_date

LEFT JOIN dim_promotion pm
ON sd.promotion_code = pm.promotion_code

WHERE NOT EXISTS
(
    SELECT 1
    FROM fact_sales f
    WHERE f.customer_key = dc.customer_key
      AND f.product_key = dp.product_key
      AND f.branch_key = db.branch_key
      AND f.sales_date = sd.sales_date
);
`;

const res = parseLineage(testSql);
console.log('SOURCES:', res.sources);
console.log('TARGETS:', res.targets);
console.log('FLOWS:');
res.flows.forEach(f => {
  console.log(`  ${f.sourceTable}.${f.sourceCol} -> ${f.targetTable}.${f.targetCol}`);
});
