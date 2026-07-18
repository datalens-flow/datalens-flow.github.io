import { create } from 'zustand';
import { SchemaResponse } from '../types/schema';

interface SchemaState {
  schema: SchemaResponse | null;
  descriptions: Record<string, Record<string, string>>; // tableId -> colName -> description
  nodePositions: Record<string, { x: number; y: number }>;
  activeTab: 'erd' | 'dict';
  sql: string;
  dialect: string;
  loading: boolean;
  error: string | null;
  
  setSql: (sql: string) => void;
  setDialect: (dialect: string) => void;
  setSchema: (schema: SchemaResponse | null) => void;
  updateDescription: (tableId: string, colName: string, text: string) => void;
  setDescriptions: (descriptions: Record<string, Record<string, string>>) => void;
  setActiveTab: (tab: 'erd' | 'dict') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNodePositions: (positions: Record<string, { x: number; y: number }>) => void;
  updateNodePosition: (tableId: string, x: number, y: number) => void;
  
  // Interactive UI action handles
  updateTableName: (oldTableId: string, newName: string) => void;
  updateColumnType: (tableId: string, colName: string, newType: string) => void;
  addRelationship: (fromTable: string, fromCol: string, toTable: string, toCol: string) => void;
  deleteRelationship: (id: string) => void;
}

const DEFAULT_SQL = `CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10, 2),
  order_date DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`;

export const useSchemaStore = create<SchemaState>((set) => ({
  schema: null,
  descriptions: {},
  nodePositions: {},
  activeTab: 'erd',
  sql: DEFAULT_SQL,
  dialect: 'postgres',
  loading: false,
  error: null,
  
  setSql: (sql) => set({ sql }),
  setDialect: (dialect) => set({ dialect }),
  setSchema: (schema) => set((state) => {
    const newDescriptions = { ...state.descriptions };
    if (schema) {
      schema.tables.forEach((t) => {
        if (!newDescriptions[t.id]) {
          newDescriptions[t.id] = {};
        }
        t.columns.forEach((c) => {
          if (newDescriptions[t.id][c.name] === undefined) {
            newDescriptions[t.id][c.name] = c.comment || '';
          }
        });
      });
    }
    return { schema, descriptions: newDescriptions };
  }),
  updateDescription: (tableId, colName, text) => set((state) => {
    const tableComments = state.descriptions[tableId] || {};
    return {
      descriptions: {
        ...state.descriptions,
        [tableId]: {
          ...tableComments,
          [colName]: text,
        },
      },
    };
  }),
  setDescriptions: (descriptions) => set({ descriptions }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setNodePositions: (nodePositions) => set({ nodePositions }),
  updateNodePosition: (tableId, x, y) => set((state) => ({
    nodePositions: {
      ...state.nodePositions,
      [tableId]: { x, y },
    },
  })),

  updateTableName: (oldTableId, newName) => set((state) => {
    if (!state.schema || !newName.trim()) return {};
    const newTableId = newName.trim().toLowerCase();
    
    // 1. Rename table in tables array
    const updatedTables = state.schema.tables.map((t) => {
      if (t.id === oldTableId) {
        return { ...t, id: newTableId, name: newName.trim() };
      }
      return t;
    });

    // 2. Update relationships involving this table
    const updatedRels = state.schema.relationships.map((r) => {
      let from_table = r.from_table;
      let to_table = r.to_table;
      if (r.from_table === oldTableId) from_table = newTableId;
      if (r.to_table === oldTableId) to_table = newTableId;
      return { ...r, from_table, to_table };
    });

    // 3. Update descriptions map key
    const updatedDescriptions = { ...state.descriptions };
    if (updatedDescriptions[oldTableId]) {
      updatedDescriptions[newTableId] = updatedDescriptions[oldTableId];
      delete updatedDescriptions[oldTableId];
    }

    // 4. Update nodePositions key
    const updatedPositions = { ...state.nodePositions };
    if (updatedPositions[oldTableId]) {
      updatedPositions[newTableId] = updatedPositions[oldTableId];
      delete updatedPositions[oldTableId];
    }

    return {
      schema: {
        ...state.schema,
        tables: updatedTables,
        relationships: updatedRels,
      },
      descriptions: updatedDescriptions,
      nodePositions: updatedPositions,
    };
  }),

  updateColumnType: (tableId, columnName, newType) => set((state) => {
    if (!state.schema || !newType.trim()) return {};
    
    const updatedTables = state.schema.tables.map((t) => {
      if (t.id === tableId) {
        return {
          ...t,
          columns: t.columns.map((c) => {
            if (c.name === columnName) {
              return { ...c, type: newType.trim() };
            }
            return c;
          }),
        };
      }
      return t;
    });

    return {
      schema: {
        ...state.schema,
        tables: updatedTables,
      },
    };
  }),

  addRelationship: (fromTable, fromCol, toTable, toCol) => set((state) => {
    if (!state.schema) return {};
    
    const relId = `rel_${fromTable}_${fromCol}_to_${toTable}_${toCol}`;
    // Check if relationship already exists
    if (state.schema.relationships.some((r) => r.from_table === fromTable && r.from_column === fromCol && r.to_table === toTable && r.to_column === toCol)) {
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

    // Update column status on the source table
    const updatedTables = state.schema.tables.map((t) => {
      if (t.id === fromTable) {
        return {
          ...t,
          columns: t.columns.map((c) => {
            if (c.name === fromCol) {
              return {
                ...c,
                is_fk: true,
                fk_ref_table: toTable,
                fk_ref_column: toCol,
              };
            }
            return c;
          }),
        };
      }
      return t;
    });

    return {
      schema: {
        ...state.schema,
        tables: updatedTables,
        relationships: [...state.schema.relationships, newRel],
      },
    };
  }),

  deleteRelationship: (id) => set((state) => {
    if (!state.schema) return {};

    const relToDelete = state.schema.relationships.find((r) => r.id === id);
    if (!relToDelete) return {};

    const updatedRels = state.schema.relationships.filter((r) => r.id !== id);

    // Unset fk flag on the column if no other relationships are using it
    const updatedTables = state.schema.tables.map((t) => {
      if (t.id === relToDelete.from_table) {
        return {
          ...t,
          columns: t.columns.map((c) => {
            if (c.name === relToDelete.from_column) {
              return {
                ...c,
                is_fk: false,
                fk_ref_table: null,
                fk_ref_column: null,
              };
            }
            return c;
          }),
        };
      }
      return t;
    });

    return {
      schema: {
        ...state.schema,
        tables: updatedTables,
        relationships: updatedRels,
      },
    };
  }),
}));
