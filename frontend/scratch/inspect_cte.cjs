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
const cteBlockMatches = [...cleanSql.matchAll(/\bwith\s+([\s\S]+?)(?=\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bmerge\b|$)/gi)];
console.log('cteBlockMatches count:', cteBlockMatches.length);
if (cteBlockMatches.length > 0) {
  const cteBlock = cteBlockMatches[0][1];
  console.log('cteBlock text:');
  console.log(JSON.stringify(cteBlock));
  
  const SQL_KEYWORDS = new Set([
    'select', 'set', 'where', 'on', 'and', 'or', 'not', 'null',
    'inner', 'outer', 'left', 'right', 'cross', 'natural', 'full', 'into',
    'values', 'group', 'order', 'having', 'limit', 'offset', 'as', 'case',
    'when', 'then', 'else', 'end', 'between', 'like', 'in', 'exists', 'is',
    'delete', 'insert', 'update', 'merge', 'using', 'matched', 'by',
  ]);
  
  const extractTableName = (name) => {
    const parts = name.split('.');
    return parts[parts.length - 1].toLowerCase();
  };

  const cteNames = new Set();
  const cteToRealSources = {};

  let currentPos = 0;
  while (currentPos < cteBlock.length) {
    const nextAsMatch = cteBlock.substring(currentPos).match(/\b(\w+)\s+as\s*\(/i);
    if (!nextAsMatch || nextAsMatch.index === undefined) break;

    const cteName = nextAsMatch[1].toLowerCase();
    const matchStartInBlock = currentPos + nextAsMatch.index;
    const bodyStart = matchStartInBlock + nextAsMatch[0].length;

    let depth = 1;
    let bodyEnd = bodyStart;
    for (let i = bodyStart; i < cteBlock.length && depth > 0; i++) {
      if (cteBlock[i] === '(') depth++;
      if (cteBlock[i] === ')') depth--;
      bodyEnd = i;
    }

    if (!SQL_KEYWORDS.has(cteName)) {
      cteNames.add(cteName);
      const cteBody = cteBlock.substring(bodyStart, bodyEnd);
      console.log('CTE Name:', cteName, 'Body:', JSON.stringify(cteBody));
      const fromMatches = [...cteBody.matchAll(/\b(?:from|join)\s+([\w.]+)/gi)];
      const realSources = [];
      fromMatches.forEach(m => {
        const tbl = extractTableName(m[1]);
        if (!SQL_KEYWORDS.has(tbl)) {
          realSources.push(tbl);
        }
      });
      cteToRealSources[cteName] = realSources;
    }

    currentPos = bodyEnd + 1;
    const commaSearch = cteBlock.substring(currentPos).match(/\s*,\s*/);
    if (commaSearch && commaSearch.index === 0) {
      currentPos += commaSearch[0].length;
    }
  }

  console.log('cteNames:', Array.from(cteNames));
  console.log('cteToRealSources:', cteToRealSources);
}
