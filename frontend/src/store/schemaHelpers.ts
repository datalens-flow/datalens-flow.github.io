import { SchemaResponse } from '../types/schema';
import { RenameEvents } from './useSchemaStore';

export function updateTableNameHelper(
  schema: SchemaResponse | null,
  descriptions: Record<string, Record<string, string>>,
  nodePositions: Record<string, { x: number; y: number }>,
  renameEvents: RenameEvents,
  oldTableId: string,
  newName: string
) {
  if (!schema || !newName.trim()) return {};
  const newTableId = newName.trim().toLowerCase();
  const currentTableName = schema.tables.find(t => t.id === oldTableId)?.name || oldTableId;

  const updatedTables = schema.tables.map(t => 
    t.id === oldTableId ? { ...t, id: newTableId, name: newName.trim() } : t
  );

  const updatedRels = schema.relationships.map(r => {
    let from_table = r.from_table === oldTableId ? newTableId : r.from_table;
    let to_table = r.to_table === oldTableId ? newTableId : r.to_table;
    return { ...r, from_table, to_table };
  });

  const updatedDescriptions = { ...descriptions };
  if (updatedDescriptions[oldTableId]) {
    updatedDescriptions[newTableId] = updatedDescriptions[oldTableId];
    delete updatedDescriptions[oldTableId];
  }

  const updatedPositions = { ...nodePositions };
  if (updatedPositions[oldTableId]) {
    updatedPositions[newTableId] = updatedPositions[oldTableId];
    delete updatedPositions[oldTableId];
  }

  const updatedRenames = { ...renameEvents };
  let originalName = oldTableId;
  for (const [orig, curr] of Object.entries(updatedRenames.tables)) {
    if (curr === currentTableName) {
      originalName = orig;
      break;
    }
  }
  updatedRenames.tables[originalName] = newName.trim();

  return {
    schema: { ...schema, tables: updatedTables, relationships: updatedRels },
    descriptions: updatedDescriptions,
    nodePositions: updatedPositions,
    renameEvents: updatedRenames,
  };
}

export function updateColumnNameHelper(
  schema: SchemaResponse | null,
  renameEvents: RenameEvents,
  tableId: string,
  oldCol: string,
  newCol: string
) {
  if (!schema || !newCol.trim()) return {};

  const updatedTables = schema.tables.map(t => {
    if (t.id !== tableId) return t;
    return {
      ...t,
      columns: t.columns.map(c => c.name === oldCol ? { ...c, name: newCol.trim() } : c)
    };
  });

  const updatedRels = schema.relationships.map(r => {
    let from_col = (r.from_table === tableId && r.from_column === oldCol) ? newCol.trim() : r.from_column;
    let to_col = (r.to_table === tableId && r.to_column === oldCol) ? newCol.trim() : r.to_column;
    return { ...r, from_column: from_col, to_column: to_col };
  });

  const updatedRenames = { ...renameEvents };
  if (!updatedRenames.columns[tableId]) updatedRenames.columns[tableId] = {};
  
  let originalCol = oldCol;
  for (const [orig, curr] of Object.entries(updatedRenames.columns[tableId])) {
    if (curr === oldCol) {
      originalCol = orig;
      break;
    }
  }
  updatedRenames.columns[tableId][originalCol] = newCol.trim();

  return {
    schema: { ...schema, tables: updatedTables, relationships: updatedRels },
    renameEvents: updatedRenames,
  };
}

export function updateColumnTypeHelper(
  schema: SchemaResponse | null,
  tableId: string,
  columnName: string,
  newType: string
) {
  if (!schema || !newType.trim()) return {};

  const updatedTables = schema.tables.map(t => {
    if (t.id !== tableId) return t;
    return {
      ...t,
      columns: t.columns.map(c => c.name === columnName ? { ...c, type: newType.trim() } : c)
    };
  });

  return { schema: { ...schema, tables: updatedTables } };
}

export function addRelationshipHelper(
  schema: SchemaResponse | null,
  fromTable: string,
  fromCol: string,
  toTable: string,
  toCol: string
) {
  if (!schema) return {};

  const relId = `rel_${fromTable}_${fromCol}_to_${toTable}_${toCol}`;
  if (schema.relationships.some(r => r.from_table === fromTable && r.from_column === fromCol && r.to_table === toTable && r.to_column === toCol)) {
    return {};
  }

  const newRel = {
    id: relId,
    from_table: fromTable,
    from_column: fromCol,
    to_table: toTable,
    to_column: toCol,
    type: 'many-to-one',
  };

  const updatedTables = schema.tables.map(t => {
    if (t.id !== fromTable) return t;
    return {
      ...t,
      columns: t.columns.map(c => c.name === fromCol ? { ...c, is_fk: true, fk_ref_table: toTable, fk_ref_column: toCol } : c)
    };
  });

  return {
    schema: {
      ...schema,
      tables: updatedTables,
      relationships: [...schema.relationships, newRel],
    },
  };
}

export function deleteRelationshipHelper(schema: SchemaResponse | null, id: string) {
  if (!schema) return {};

  const relToDelete = schema.relationships.find(r => r.id === id);
  if (!relToDelete) return {};

  const updatedRels = schema.relationships.filter(r => r.id !== id);

  const updatedTables = schema.tables.map(t => {
    if (t.id !== relToDelete.from_table) return t;
    return {
      ...t,
      columns: t.columns.map(c => c.name === relToDelete.from_column ? { ...c, is_fk: false, fk_ref_table: null, fk_ref_column: null } : c)
    };
  });

  return {
    schema: { ...schema, tables: updatedTables, relationships: updatedRels },
  };
}

export function addTableHelper(schema: SchemaResponse | null, nodePositions: Record<string, { x: number; y: number }>) {
  if (!schema) return {};

  const tablesCount = schema.tables.length + 1;
  const newTableName = `table_${tablesCount}`;
  const newTableId = newTableName.toLowerCase();

  const newTable = {
    id: newTableId,
    name: newTableName,
    columns: [{ name: 'id', type: 'INT', nullable: false, is_pk: true, is_fk: false, comment: '' }]
  };

  const newPositions = {
    ...nodePositions,
    [newTableId]: { x: 150 + (tablesCount * 30), y: 150 + (tablesCount * 30) }
  };

  return {
    schema: { ...schema, tables: [...schema.tables, newTable] },
    nodePositions: newPositions
  };
}

export function addColumnHelper(schema: SchemaResponse | null, tableId: string) {
  if (!schema) return {};

  const updatedTables = schema.tables.map(t => {
    if (t.id !== tableId) return t;
    const colIndex = t.columns.length + 1;
    return {
      ...t,
      columns: [...t.columns, { name: `col_${colIndex}`, type: 'VARCHAR(255)', nullable: true, is_pk: false, is_fk: false, comment: '' }]
    };
  });

  return { schema: { ...schema, tables: updatedTables } };
}
