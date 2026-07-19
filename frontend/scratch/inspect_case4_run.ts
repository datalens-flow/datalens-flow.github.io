import { parseLineage } from '../src/utils/lineageParser';

const testSql = `
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
`;

const res = parseLineage(testSql);
console.log('FLOWS:');
res.flows.forEach(f => {
  console.log(`  ${f.sourceTable}.${f.sourceCol} -> ${f.targetTable}.${f.targetCol}`);
});
