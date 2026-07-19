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

    // Build alias → table mapping
    // Match patterns like: FROM users u, JOIN orders o, FROM users AS u
    const aliasMap: Record<string, string> = {};
    const aliasMatches = [...stmt.matchAll(/(?:from|join|using)\s+(\w+)(?:\s+(?:as\s+)?(\w+))?/gi)];
    
    aliasMatches.forEach(m => {
      const tableName = m[1].toLowerCase();
      const alias = m[2] ? m[2].toLowerCase() : tableName;
      aliasMap[alias] = tableName;
    });

    // Detect Source Tables
    const sourceTables = Object.values(aliasMap).filter(t => t !== targetTable);
    // Deduplicate
    const uniqueSourceTables = [...new Set(sourceTables)];

    uniqueSourceTables.forEach((srcTable) => {
      if (!sources.includes(srcTable)) {
        sources.push(srcTable);
      }
    });

    // Capture simple SELECT columns mapping
    const selectMatch = stmt.match(/select\s+(.+?)\s+from/i);
    if (isSelectBased && selectMatch && targetCols.length > 0) {
      const selectExprs = selectMatch[1].split(',').map(c => c.trim());

      selectExprs.forEach((expr, idx) => {
        const targetCol = targetCols[idx];
        if (!targetCol) return;

        // Parse "alias.colname" or just "colname"
        const parts = expr.split(/\s+/)[0]; // take first token (ignore AS alias)
        const dotParts = parts.split('.');
        
        let sourceCol: string;
        let mappedSourceTable: string;

        if (dotParts.length === 2) {
          // Has alias prefix like "u.name" or "o.amount"
          const alias = dotParts[0].toLowerCase();
          sourceCol = dotParts[1].toLowerCase();
          mappedSourceTable = aliasMap[alias] || uniqueSourceTables[0] || 'source';
        } else {
          // No alias — map to first source table
          sourceCol = dotParts[0].toLowerCase();
          mappedSourceTable = uniqueSourceTables[0] || 'source';
        }

        flows.push({
          sourceTable: mappedSourceTable,
          sourceCol,
          targetTable,
          targetCol: targetCol.toLowerCase()
        });
      });
    } else {
      // If we don't have explicit columns, draw table-level flow
      uniqueSourceTables.forEach((srcTable) => {
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
