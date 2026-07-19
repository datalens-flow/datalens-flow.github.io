const selectText = `c.customer_id,
    c.customer_name,
    (
        SELECT MAX(order_date) 
        FROM fact_orders o 
        WHERE o.customer_id = c.customer_id
    ) AS last_order_date`;

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

const SQL_KEYWORDS = new Set(['select', 'from', 'where', 'as', 'max']);
const isNonColumnExpr = () => false;

console.log('selectExprs:', selectExprs);

const targetCols = selectExprs.map(expr => {
  const aliasMatch = expr.match(/\b(?:as\s+)?(\w+)\s*$/i);
  if (aliasMatch && !SQL_KEYWORDS.has(aliasMatch[1].toLowerCase())) {
    return aliasMatch[1].toLowerCase();
  }
  const parts = expr.split(/\s+/)[0].split('.');
  return parts[parts.length - 1].toLowerCase();
});

console.log('Inferred targetCols:', targetCols);

const resolveColumn = (expr) => {
  let cleanExpr = expr.trim();
  // Strip subquery SELECT ... FROM ... inside parenthesis
  const subqueryMatch = cleanExpr.match(/^\(\s*select\s+([\s\S]+?)\s+from\s/i);
  if (subqueryMatch) {
    console.log('Detected subquery inside select expression:', cleanExpr);
    cleanExpr = subqueryMatch[1]; // grabs "MAX(order_date)" or whatever is projected
  }

  // Strip function wraps
  const funcMatch = cleanExpr.match(/\b(?:upper|trim|coalesce|round|lower|abs|nullif|concat|nvl|greatest|least|max|min|sum|avg|count)\s*\(\s*\(?\s*([\w.]+)/i);
  if (funcMatch) {
    cleanExpr = funcMatch[1];
  }

  const colIdMatch = cleanExpr.match(/\b([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)?)\b/);
  if (!colIdMatch) return null;
  return colIdMatch[1];
};

console.log('Resolved 3rd:', resolveColumn(selectExprs[2]));
