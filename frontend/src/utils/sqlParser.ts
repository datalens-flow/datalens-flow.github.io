import { SchemaResponse, TableSchema, ColumnSchema, RelationshipSchema } from '../types/schema';

export function parseSqlLocal(sql: string, dialect: string): SchemaResponse {
  const tables: TableSchema[] = [];
  const relationships: RelationshipSchema[] = [];
  const warnings: string[] = [];

  // 1. Clean and split SQL into statements
  // Strip multi-line comments: /* ... */
  let cleanedSql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  // Strip single line comments: -- ... or # ...
  cleanedSql = cleanedSql.replace(/(?:--|#).*$/gm, '');

  // Split statements by semicolon
  const statements = cleanedSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Helper to strip quotes/backticks/brackets from names
  const cleanName = (name: string): string => {
    return name.replace(/[`"\[\]]/g, '').trim();
  };

  // Helper to infer column type from insert values
  const inferTypeFromValue = (val: string): string => {
    val = val.trim();
    if (/^[-+]?\d+$/.test(val)) return 'INT';
    if (/^[-+]?\d*\.\d+$/.test(val)) return 'DECIMAL(10, 2)';
    if (/^(true|false)$/i.test(val)) return 'BOOLEAN';
    return 'VARCHAR(255)';
  };

  // Process statements
  for (const stmt of statements) {
    const lowerStmt = stmt.toLowerCase();

    // 2. Parse CREATE TABLE
    if (lowerStmt.startsWith('create table')) {
      // Extract table name and body inside outer parentheses
      const createTableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?([^\s(]+)\s*\(([\s\S]*)\)/i;
      const match = stmt.match(createTableRegex);
      if (!match) {
        warnings.push(`Failed to parse CREATE TABLE syntax: "${stmt.slice(0, 50)}..."`);
        continue;
      }

      const rawTableName = cleanName(match[1]);
      const tableId = rawTableName.toLowerCase();
      const body = match[2].trim();

      // Parse columns and constraints
      // We must split by commas but avoid splitting inside nested parentheses like VARCHAR(255) or DECIMAL(10, 2)
      const parts: string[] = [];
      let currentPart = '';
      let parenDepth = 0;

      for (let i = 0; i < body.length; i++) {
        const char = body[i];
        if (char === '(') parenDepth++;
        else if (char === ')') parenDepth--;

        if (char === ',' && parenDepth === 0) {
          parts.push(currentPart.trim());
          currentPart = '';
        } else {
          currentPart += char;
        }
      }
      if (currentPart.trim()) {
        parts.push(currentPart.trim());
      }

      const columns: ColumnSchema[] = [];
      const tableOutlineFks: { col: string; refTable: string; refCol: string }[] = [];
      let primaryKeysFromConstraints: string[] = [];

      for (const part of parts) {
        const lowerPart = part.toLowerCase();

        // Check for outline Primary Key constraints: CONSTRAINT pk_name PRIMARY KEY (col1, col2)
        if (lowerPart.startsWith('primary key') || (lowerPart.includes('primary key') && lowerPart.includes('constraint'))) {
          const pkMatch = part.match(/primary\s+key\s*\(([^)]+)\)/i);
          if (pkMatch) {
            primaryKeysFromConstraints = pkMatch[1].split(',').map(c => cleanName(c).toLowerCase());
          }
          continue;
        }

        // Check for outline Foreign Key constraints: FOREIGN KEY (col) REFERENCES target(target_col)
        if (lowerPart.startsWith('foreign key') || (lowerPart.includes('foreign key') && lowerPart.includes('references'))) {
          const fkMatch = part.match(/foreign\s+key\s*\(([^)]+)\)\s*references\s+([^\s(]+)\s*\(([^)]+)\)/i);
          if (fkMatch) {
            const sourceCol = cleanName(fkMatch[1]);
            const targetTable = cleanName(fkMatch[2]);
            const targetCol = cleanName(fkMatch[3]);
            tableOutlineFks.push({ col: sourceCol, refTable: targetTable, refCol: targetCol });
          }
          continue;
        }

        // Standard column definition: col_name type [constraints]
        const colWords = part.split(/\s+/);
        if (colWords.length < 2) continue;

        const colName = cleanName(colWords[0]);
        // Data type might have spaces if it has parentheses (e.g. VARCHAR (255)), but let's reassemble type
        let type = '';
        let restIdx = 1;

        if (colWords[1].includes('(')) {
          // Re-assemble type with parentheses
          let typeBuilder = colWords[1];
          while (!typeBuilder.includes(')') && restIdx < colWords.length - 1) {
            restIdx++;
            typeBuilder += ' ' + colWords[restIdx];
          }
          type = typeBuilder;
          restIdx++;
        } else {
          type = colWords[1];
          restIdx = 2;
        }

        const restOfCol = colWords.slice(restIdx).join(' ');
        const lowerRest = restOfCol.toLowerCase();

        const isPk = lowerRest.includes('primary key');
        const nullable = !lowerRest.includes('not null');

        // Extract Default value
        let defaultValue = null;
        const defaultMatch = restOfCol.match(/default\s+([^\s]+)/i);
        if (defaultMatch) {
          defaultValue = defaultMatch[1].replace(/['"]/g, '');
        }

        // Extract Inline Foreign Key
        let isFk = false;
        let fkRefTable: string | null = null;
        let fkRefColumn: string | null = null;
        const refMatch = restOfCol.match(/references\s+([^\s(]+)\s*\(([^)]+)\)/i);
        if (refMatch) {
          isFk = true;
          fkRefTable = cleanName(refMatch[1]);
          fkRefColumn = cleanName(refMatch[2]);
        }

        columns.push({
          name: colName,
          type,
          nullable,
          is_pk: isPk,
          is_fk: isFk,
          fk_ref_table: fkRefTable,
          fk_ref_column: fkRefColumn,
          default: defaultValue,
          comment: ''
        });
      }

      // Map primary keys from constraints
      if (primaryKeysFromConstraints.length > 0) {
        columns.forEach(col => {
          if (primaryKeysFromConstraints.includes(col.name.toLowerCase())) {
            col.is_pk = true;
          }
        });
      }

      // Map outline foreign keys
      for (const fk of tableOutlineFks) {
        const col = columns.find(c => c.name.toLowerCase() === fk.col.toLowerCase());
        if (col) {
          col.is_fk = true;
          col.fk_ref_table = fk.refTable;
          col.fk_ref_column = fk.refCol;
        }
      }

      // Assemble table
      tables.push({
        id: tableId,
        name: rawTableName,
        columns
      });
    }

    // 3. Parse ALTER TABLE (Foreign Keys)
    else if (lowerStmt.startsWith('alter table')) {
      const alterMatch = stmt.match(/alter\s+table\s+([^\s]+)\s+add\s+constraint\s+([^\s]+)\s+foreign\s+key\s*\(([^)]+)\)\s*references\s+([^\s(]+)\s*\(([^)]+)\)/i) ||
                         stmt.match(/alter\s+table\s+([^\s]+)\s+add\s+foreign\s+key\s*\(([^)]+)\)\s*references\s+([^\s(]+)\s*\(([^)]+)\)/i);
      if (alterMatch) {
        let tableName = '';
        let sourceCol = '';
        let targetTable = '';
        let targetCol = '';

        if (alterMatch.length === 6) {
          tableName = cleanName(alterMatch[1]);
          sourceCol = cleanName(alterMatch[3]);
          targetTable = cleanName(alterMatch[4]);
          targetCol = cleanName(alterMatch[5]);
        } else {
          tableName = cleanName(alterMatch[1]);
          sourceCol = cleanName(alterMatch[2]);
          targetTable = cleanName(alterMatch[3]);
          targetCol = cleanName(alterMatch[4]);
        }

        const table = tables.find(t => t.id === tableName.toLowerCase());
        if (table) {
          const col = table.columns.find(c => c.name.toLowerCase() === sourceCol.toLowerCase());
          if (col) {
            col.is_fk = true;
            col.fk_ref_table = targetTable;
            col.fk_ref_column = targetCol;
          }
        }
      }
    }

    // 4. Parse INSERT DML (Inference)
    else if (lowerStmt.startsWith('insert into')) {
      const insertRegex = /insert\s+into\s+([^\s(]+)\s*\(([^)]+)\)\s*values\s*\(([^)]+)\)/i;
      const match = stmt.match(insertRegex);
      if (match) {
        const rawTableName = cleanName(match[1]);
        const tableId = rawTableName.toLowerCase();
        const colNames = match[2].split(',').map(c => cleanName(c));
        const colValues = match[3].split(',').map(v => v.trim());

        let table = tables.find(t => t.id === tableId);
        if (!table) {
          // Infer table structure if table DDL was not defined!
          table = {
            id: tableId,
            name: rawTableName,
            columns: []
          };
          tables.push(table);
        }

        // Add columns that don't exist yet
        colNames.forEach((colName, idx) => {
          const exists = table.columns.some(c => c.name.toLowerCase() === colName.toLowerCase());
          if (!exists) {
            const rawVal = colValues[idx] || '';
            const inferredType = inferTypeFromValue(rawVal);
            table.columns.push({
              name: colName,
              type: inferredType,
              nullable: true,
              is_pk: colName.toLowerCase() === 'id', // Default 'id' column as PK
              is_fk: false,
              comment: ''
            });
          }
        });
      }
    }
  }

  // 5. Generate Relationships list
  for (const table of tables) {
    for (const col of table.columns) {
      if (col.is_fk && col.fk_ref_table && col.fk_ref_column) {
        relationships.push({
          id: `rel_${table.id}_${col.name}_to_${col.fk_ref_table.toLowerCase()}_${col.fk_ref_column.toLowerCase()}`,
          from_table: table.id,
          from_column: col.name,
          to_table: col.fk_ref_table.toLowerCase(),
          to_column: col.fk_ref_column.toLowerCase(),
          type: 'many-to-one'
        });
      }
    }
  }

  return {
    tables,
    relationships,
    warnings,
    dialect,
    parsed_at: new Date().toISOString()
  };
}
