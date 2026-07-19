const sql = `
  WITH step1 AS (
    SELECT id, amount FROM raw_orders
  ),
  step2 AS (
    SELECT id, amount * 1.07 as amount_vat FROM step1
  )
  INSERT INTO final_orders (id, amount_vat)
  SELECT id, amount_vat FROM step2;
`;
const cleanSql = sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
// Change non-greedy match to look for matching block.
// Instead of stopping at select/insert/update/delete/merge globally, let's find the main WITH block,
// which ends where the main DML statement (INSERT/SELECT/etc) begins outside of parentheses.
// To do this, let's find '\bwith\s+' and match until the first non-nested select/insert/update/delete/merge.
let depth = 0;
let withStart = cleanSql.toLowerCase().indexOf('with');
if (withStart !== -1) {
  let searchBlock = cleanSql.substring(withStart + 4);
  let mainActionIdx = -1;
  for (let i = 0; i < searchBlock.length; i++) {
    if (searchBlock[i] === '(') depth++;
    if (searchBlock[i] === ')') depth--;
    if (depth === 0) {
      // Look for DML keywords at depth 0
      const sub = searchBlock.substring(i).trim().toLowerCase();
      if (sub.startsWith('select') || sub.startsWith('insert') || sub.startsWith('update') || sub.startsWith('delete') || sub.startsWith('merge')) {
        mainActionIdx = withStart + 4 + i;
        break;
      }
    }
  }
  const cteBlock = cleanSql.substring(withStart + 4, mainActionIdx !== -1 ? mainActionIdx : cleanSql.length);
  console.log('depth-based cteBlock:', JSON.stringify(cteBlock));
}
