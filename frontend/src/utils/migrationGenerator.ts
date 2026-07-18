import { SchemaResponse } from '../types/schema';
import { RenameEvents } from '../store/useSchemaStore';
import { generateSqlDdlLocal } from './exporters';

interface MigrationRequest {
  original_schema: SchemaResponse;
  current_schema: SchemaResponse;
  rename_events: RenameEvents;
}

export function generateMigrationScriptLocal(req: MigrationRequest): string {
  const statements: string[] = [];

  const origTables = req.original_schema.tables;
  const currTables = req.current_schema.tables;

  const origTablesMap = new Map(origTables.map(t => [t.id, t]));
  const currTablesMap = new Map(currTables.map(t => [t.id, t]));

  // 1. Rename table mapping
  const renameTableMap = new Map<string, string>(); // old_table_id -> new_table_name
  if (req.rename_events.tables) {
    for (const [oldId, newName] of Object.entries(req.rename_events.tables)) {
      if (origTablesMap.has(oldId)) {
        renameTableMap.set(oldId, newName);
      }
    }
  }

  // 2. Handle Table Renames (ALTER TABLE old RENAME TO new)
  for (const [oldId, newName] of renameTableMap.entries()) {
    const origTable = origTablesMap.get(oldId);
    if (origTable) {
      statements.push(`ALTER TABLE ${origTable.name} RENAME TO ${newName};`);
    }
  }

  // 3. Handle Dropped Tables
  for (const origTable of origTables) {
    const isRenamed = renameTableMap.has(origTable.id);
    if (!currTablesMap.has(origTable.id) && !isRenamed) {
      statements.push(`DROP TABLE ${origTable.name};`);
    }
  }

  // Helper to format CREATE TABLE statement for added tables
  const formatCreateTable = (table: any): string => {
    return generateSqlDdlLocal({ tables: [table], relationships: [] } as unknown as SchemaResponse, 'postgres');
  };

  // 4. Handle Added Tables
  for (const currTable of currTables) {
    const isRenamedTarget = Array.from(renameTableMap.values())
      .some(newTableName => newTableName.toLowerCase() === currTable.id);

    if (!origTablesMap.has(currTable.id) && !isRenamedTarget) {
      statements.push(formatCreateTable(currTable));
    }
  }

  // 5. Handle Alterations for Existing/Renamed Tables
  for (const currTable of currTables) {
    let origId: string | null = null;
    if (origTablesMap.has(currTable.id)) {
      origId = currTable.id;
    } else {
      // Find original table if renamed
      for (const [oid, nname] of renameTableMap.entries()) {
        if (nname.toLowerCase() === currTable.id) {
          origId = oid;
          break;
        }
      }
    }

    if (origId && origTablesMap.has(origId)) {
      const origTable = origTablesMap.get(origId)!;

      const origCols = new Map(origTable.columns.map(c => [c.name.toLowerCase(), c]));
      const currCols = new Map(currTable.columns.map(c => [c.name.toLowerCase(), c]));

      // Column rename maps for this table
      const renameColMap = new Map<string, string>(); // old_col_name -> new_col_name
      const tableColumnRenames = req.rename_events.columns[origId];
      if (tableColumnRenames) {
        for (const [oldName, newName] of Object.entries(tableColumnRenames)) {
          if (origCols.has(oldName.toLowerCase())) {
            renameColMap.set(oldName.toLowerCase(), newName);
          }
        }
      }

      // Rename column statements
      for (const [oldColLower, newColName] of renameColMap.entries()) {
        const origCol = origCols.get(oldColLower);
        if (origCol) {
          statements.push(`ALTER TABLE ${currTable.name} RENAME COLUMN ${origCol.name} TO ${newColName};`);
        }
      }

      // Handle Dropped Columns
      for (const origCol of origTable.columns) {
        const isRenamed = renameColMap.has(origCol.name.toLowerCase());
        if (!currCols.has(origCol.name.toLowerCase()) && !isRenamed) {
          statements.push(`ALTER TABLE ${currTable.name} DROP COLUMN ${origCol.name};`);
        }
      }

      // Handle Added Columns
      for (const currCol of currTable.columns) {
        const isRenamedTarget = Array.from(renameColMap.values())
          .some(newColName => newColName.toLowerCase() === currCol.name.toLowerCase());

        if (!origCols.has(currCol.name.toLowerCase()) && !isRenamedTarget) {
          let colDef = `${currCol.name} ${currCol.type}`;
          if (currCol.is_pk) colDef += ' PRIMARY KEY';
          if (!currCol.nullable) colDef += ' NOT NULL';
          if (currCol.default) colDef += ` DEFAULT ${currCol.default}`;
          statements.push(`ALTER TABLE ${currTable.name} ADD COLUMN ${colDef};`);
        }
      }

      // Handle Modified Columns (Datatype changes or constraints)
      for (const currCol of currTable.columns) {
        let origColNameLower = currCol.name.toLowerCase();
        // Check if renamed
        const isRenamedTarget = Array.from(renameColMap.values())
          .some(newColName => newColName.toLowerCase() === currCol.name.toLowerCase());

        if (isRenamedTarget) {
          for (const [oldColLower, newColName] of renameColMap.entries()) {
            if (newColName.toLowerCase() === currCol.name.toLowerCase()) {
              origColNameLower = oldColLower;
              break;
            }
          }
        }

        const origCol = origCols.get(origColNameLower);
        if (origCol) {
          if (origCol.type.toLowerCase() !== currCol.type.toLowerCase()) {
            statements.push(`ALTER TABLE ${currTable.name} ALTER COLUMN ${currCol.name} TYPE ${currCol.type};`);
          }
        }
      }
    }
  }

  if (statements.length === 0) {
    return '-- No schema changes detected. Migration script is empty.';
  }

  return statements.join('\n');
}
