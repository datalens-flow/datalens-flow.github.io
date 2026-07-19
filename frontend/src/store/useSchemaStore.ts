import { create } from 'zustand';
import { SchemaResponse } from '../types/schema';
import { exportSql } from '../api/client';
import {
  updateTableNameHelper,
  updateColumnNameHelper,
  updateColumnTypeHelper,
  addRelationshipHelper,
  deleteRelationshipHelper,
  addTableHelper,
  addColumnHelper
} from './schemaHelpers';

export interface RenameEvents {
  tables: Record<string, string>; // oldTableId -> newTableName
  columns: Record<string, Record<string, string>>; // tableId -> oldColName -> newColName
}

interface SchemaState {
  schema: SchemaResponse | null;
  originalSchema: SchemaResponse | null;
  renameEvents: RenameEvents;
  descriptions: Record<string, Record<string, string>>; // tableId -> colName -> description
  nodePositions: Record<string, { x: number; y: number }>;
  activeTab: 'erd' | 'dict';
  sql: string;
  dialect: string;
  loading: boolean;
  error: string | null;

  // Visual/Layout settings
  theme: 'dark' | 'light';
  layoutDir: 'LR' | 'TB';
  inferRelationships: boolean;
  outputDialect: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  setSql: (sql: string) => void;
  setDialect: (dialect: string) => void;
  setSchema: (schema: SchemaResponse | null) => void;
  setOriginalSchema: (schema: SchemaResponse | null) => void;
  updateDescription: (tableId: string, colName: string, text: string) => void;
  setDescriptions: (descriptions: Record<string, Record<string, string>>) => void;
  setActiveTab: (tab: 'erd' | 'dict') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNodePositions: (positions: Record<string, { x: number; y: number }>) => void;
  updateNodePosition: (tableId: string, x: number, y: number) => void;

  setTheme: (theme: 'dark' | 'light') => void;
  setLayoutDir: (dir: 'LR' | 'TB') => void;
  setInferRelationships: (infer: boolean) => void;
  setOutputDialect: (dialect: string) => void;
  clearRenameEvents: () => void;
  
  // Interactive UI action handles
  updateTableName: (oldTableId: string, newName: string) => void;
  updateColumnName: (tableId: string, oldCol: string, newCol: string) => void;
  updateColumnType: (tableId: string, colName: string, newType: string) => void;
  addRelationship: (fromTable: string, fromCol: string, toTable: string, toCol: string) => void;
  deleteRelationship: (id: string) => void;
  
  addTable: () => void;
  deleteTable: (tableId: string) => void;
  addColumn: (tableId: string) => void;
  toggleColumnPk: (tableId: string, colName: string) => void;
  toggleColumnNullable: (tableId: string, colName: string) => void;
  syncSqlFromSchema: () => Promise<void>;
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

export const useSchemaStore = create<SchemaState>((set, get) => ({
  schema: null,
  originalSchema: null,
  renameEvents: { tables: {}, columns: {} },
  descriptions: {},
  nodePositions: {},
  activeTab: 'erd',
  sql: DEFAULT_SQL,
  dialect: 'postgres',
  loading: false,
  error: null,

  theme: 'dark',
  layoutDir: 'LR',
  inferRelationships: false,
  outputDialect: 'postgres',
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
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
  setOriginalSchema: (originalSchema) => set({ originalSchema }),
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

  setTheme: (theme) => set({ theme }),
  setLayoutDir: (layoutDir) => set({ layoutDir, nodePositions: {} }),
  setInferRelationships: (inferRelationships) => set({ inferRelationships }),
  setOutputDialect: (outputDialect) => {
    set({ outputDialect });
    get().syncSqlFromSchema();
  },
  clearRenameEvents: () => set({ renameEvents: { tables: {}, columns: {} } }),

  updateTableName: (oldTableId, newName) => {
    set((state) => updateTableNameHelper(state.schema, state.descriptions, state.nodePositions, state.renameEvents, oldTableId, newName));
    get().syncSqlFromSchema();
  },

  updateColumnName: (tableId, oldCol, newCol) => {
    set((state) => updateColumnNameHelper(state.schema, state.renameEvents, tableId, oldCol, newCol));
    get().syncSqlFromSchema();
  },

  updateColumnType: (tableId, columnName, newType) => {
    set((state) => updateColumnTypeHelper(state.schema, tableId, columnName, newType));
    get().syncSqlFromSchema();
  },

  addRelationship: (fromTable, fromCol, toTable, toCol) => {
    set((state) => addRelationshipHelper(state.schema, fromTable, fromCol, toTable, toCol));
    get().syncSqlFromSchema();
  },

  deleteRelationship: (id) => {
    set((state) => deleteRelationshipHelper(state.schema, id));
    get().syncSqlFromSchema();
  },

  addTable: () => {
    set((state) => addTableHelper(state.schema, state.nodePositions));
    get().syncSqlFromSchema();
  },

  deleteTable: (tableId) => {
    set((state) => {
      if (!state.schema) return {};
      const updatedTables = state.schema.tables.filter((t) => t.id !== tableId);
      const updatedRelationships = state.schema.relationships.filter(
        (r) => r.from_table !== tableId && r.to_table !== tableId
      );
      const updatedPositions = { ...state.nodePositions };
      delete updatedPositions[tableId];
      const updatedDescriptions = { ...state.descriptions };
      delete updatedDescriptions[tableId];

      return {
        schema: {
          ...state.schema,
          tables: updatedTables,
          relationships: updatedRelationships
        },
        nodePositions: updatedPositions,
        descriptions: updatedDescriptions
      };
    });
    get().syncSqlFromSchema();
  },

  addColumn: (tableId) => {
    set((state) => addColumnHelper(state.schema, tableId));
    get().syncSqlFromSchema();
  },

  toggleColumnPk: (tableId, colName) => {
    set((state) => {
      if (!state.schema) return {};
      const updatedTables = state.schema.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            columns: t.columns.map((c) => {
              if (c.name === colName) {
                return { ...c, is_pk: !c.is_pk };
              }
              return c;
            })
          };
        }
        return t;
      });
      return {
        schema: {
          ...state.schema,
          tables: updatedTables
        }
      };
    });
    get().syncSqlFromSchema();
  },

  toggleColumnNullable: (tableId, colName) => {
    set((state) => {
      if (!state.schema) return {};
      const updatedTables = state.schema.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            columns: t.columns.map((c) => {
              if (c.name === colName) {
                return { ...c, nullable: !c.nullable };
              }
              return c;
            })
          };
        }
        return t;
      });
      return {
        schema: {
          ...state.schema,
          tables: updatedTables
        }
      };
    });
    get().syncSqlFromSchema();
  },

  syncSqlFromSchema: async () => {
    const { schema, outputDialect } = get();
    if (!schema) return;
    try {
      const blob = await exportSql(schema, outputDialect);
      const sqlText = await blob.text();
      set({ sql: sqlText });
    } catch (e) {
      console.error("Failed to sync DDL SQL:", e);
    }
  }
}));
