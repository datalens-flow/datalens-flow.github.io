export interface LineageFlow {
  sourceTable: string;
  sourceCol: string;
  targetTable: string;
  targetCol: string;
}

export interface LineageResult {
  sources: string[];
  targets: string[];
  flows: LineageFlow[];
}

export const parseLineage = (sql: string): LineageResult => {
  const sources: string[] = [];
  const targets: string[] = [];
  const flows: LineageFlow[] = [];

  // Remove block comments and single line comments
  const cleanSql = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');

  // Split into separate queries/statements
  const statements = cleanSql.split(';').map(s => s.trim()).filter(s => s.length > 0);

  statements.forEach((stmt) => {
    let targetTable = '';
    let targetCols: string[] = [];
    let isSelectBased = false;

    // Detect Target Table: INSERT INTO, CREATE TABLE/VIEW, UPDATE, MERGE INTO
    const insertMatch = stmt.match(/insert\s+into\s+(\w+)\s*(?:\(([^)]+)\))?/i);
    const createMatch = stmt.match(/create\s+(?:table|view)\s+(\w+)\s+as\s/i);
    const updateMatch = stmt.match(/update\s+(\w+)\s+set\s/i);
    const mergeMatch = stmt.match(/merge\s+into\s+(\w+)\s+using\s/i);

    if (insertMatch) {
      targetTable = insertMatch[1].toLowerCase();
      if (insertMatch[2]) {
        targetCols = insertMatch[2].split(',').map(c => c.trim().toLowerCase());
      }
      isSelectBased = true;
    } else if (createMatch) {
      targetTable = createMatch[1].toLowerCase();
      isSelectBased = true;
    } else if (updateMatch) {
      targetTable = updateMatch[1].toLowerCase();
    } else if (mergeMatch) {
      targetTable = mergeMatch[1].toLowerCase();
    } else {
      return;
    }

    if (!targets.includes(targetTable)) {
      targets.push(targetTable);
    }

    // Detect Source Tables from FROM or JOIN or USING
    const fromMatches = [...stmt.matchAll(/(?:from|join|using)\s+(\w+)/gi)];
    const sourceTables = fromMatches.map(m => m[1].toLowerCase()).filter(t => t !== targetTable);

    sourceTables.forEach((srcTable) => {
      if (!sources.includes(srcTable)) {
        sources.push(srcTable);
      }
    });

    // Capture simple SELECT columns mapping
    const selectMatch = stmt.match(/select\s+(.+?)\s+from/i);
    if (isSelectBased && selectMatch && targetCols.length > 0) {
      const selectCols = selectMatch[1].split(',').map(c => {
        const parts = c.trim().split(/\s+/);
        // Get the actual source column name (strip table aliases if any, e.g. u.name -> name)
        const colPart = parts[0];
        return colPart.split('.').pop()?.toLowerCase() || '';
      });

      // Map each select column to the target column by index
      selectCols.forEach((sourceCol, idx) => {
        const targetCol = targetCols[idx];
        if (targetCol && sourceCol) {
          // Find which source table this column might belong to.
          // For simplicity in a client-side parser, we map it to the first source table
          const mappedSourceTable = sourceTables[0] || 'source';
          flows.push({
            sourceTable: mappedSourceTable,
            sourceCol,
            targetTable,
            targetCol
          });
        }
      });
    } else {
      // If we don't have explicit columns, draw table-level flow
      sourceTables.forEach((srcTable) => {
        flows.push({
          sourceTable: srcTable,
          sourceCol: '*',
          targetTable,
          targetCol: '*'
        });
      });
    }
  });

  return { sources, targets, flows };
};
export default parseLineage;
