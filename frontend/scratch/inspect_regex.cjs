// Self-contained regex test

// Let's print out what targetCols contains at the end of the matching loop
const cleanStmt = `
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

const selectMatch = cleanStmt.match(/select\s+([\s\S]+?)\s+from\s/i);
const selectText = selectMatch[1].trim();

// Split selectExprs
const selectExprs = [];
let currentExpr = '';
let parenDepth = 0;

for (let i = 0; i < selectText.length; i++) {
  const char = selectText[i];
  if (char === '(') parenDepth++;
  if (char === ')') parenDepth--;
  
  if (char === ',' && parenDepth === 0) {
    selectExprs.push(currentExpr.trim().replace(/\s+/g, ' '));
    currentExpr = '';
  } else {
    currentExpr += char;
  }
}
if (currentExpr.trim()) {
  selectExprs.push(currentExpr.trim().replace(/\s+/g, ' '));
}

console.log('selectExprs:', selectExprs);

const SQL_KEYWORDS = new Set(['select', 'from', 'where', 'as', 'max']);

const targetCols = selectExprs.map(expr => {
  const aliasMatch = expr.match(/\b(?:as\s+)?(\w+)\s*$/i);
  if (aliasMatch && !SQL_KEYWORDS.has(aliasMatch[1].toLowerCase())) {
    return aliasMatch[1].toLowerCase();
  }
  const parts = expr.split(/\s+/)[0].split('.');
  return parts[parts.length - 1].toLowerCase();
});

console.log('targetCols:', targetCols);
