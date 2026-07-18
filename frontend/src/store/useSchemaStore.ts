import { create } from 'zustand';
import { SchemaResponse } from '../types/schema';
import { exportSql } from '../api/client';

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
  theme: 'neon' | 'cyberpunk' | 'light';
  layoutDir: 'LR' | 'TB';
  inferRelationships: boolean;
  
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

  setTheme: (theme: 'neon' | 'cyberpunk' | 'light') => void;
  setLayoutDir: (dir: 'LR' | 'TB') => void;
  setInferRelationships: (infer: boolean) => void;
  clearRenameEvents: () => void;
  
  // Interactive UI action handles
  updateTableName: (oldTableId: string, newName: string) => void;
  updateColumnName: (tableId: string, oldCol: string, newCol: string) => void;
  updateColumnType: (tableId: string, colName: string, newType: string) => void;
  addRelationship: (fromTable: string, fromCol: string, toTable: string, toCol: string) => void;
  deleteRelationship: (id: string) => void;
  
  addTable: () => void;
  addColumn: (tableId: string) => void;
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

  theme: 'neon',
  layoutDir: 'LR',
  inferRelationships: false,
  
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
  setLayoutDir: (layoutDir) => set({ layoutDir }),
  setInferRelationships: (inferRelationships) => set({ inferRelationships }),
  clearRenameEvents: () => set({ renameEvents: { tables: {}, columns: {} } }),

  updateTableName: (oldTableId, newName) => {
    set((state) => {
      if (!state.schema || !newName.trim()) return {};
      const newTableId = newName.trim().toLowerCase();
      const currentTableName = state.schema.tables.find(t => t.id === oldTableId)?.name || oldTableId;
      
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

      // 5. Log rename event
      const updatedRenames = { ...state.renameEvents };
      // Trace original baseline name if we renamed multiple times
      let originalName = oldTableId;
      for (const [orig, curr] of Object.entries(updatedRenames.tables)) {
        if (curr === currentTableName) {
          originalName = orig;
          break;
        }
      }
      updatedRenames.tables[originalName] = newName.trim();

      return {
        schema: {
          ...state.schema,
          tables: updatedTables,
          relationships: updatedRels,
        },
        descriptions: updatedDescriptions,
        nodePositions: updatedPositions,
        renameEvents: updatedRenames,
      };
    });
    get().syncSqlFromSchema();
  },

  updateColumnName: (tableId, oldCol, newCol) => {
    set((state) => {
      if (!state.schema || !newCol.trim()) return {};
      
      const updatedTables = state.schema.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            columns: t.columns.map((c) => {
              if (c.name === oldCol) {
                return { ...c, name: newCol.trim() };
              }
              return c;
            })
          };
        }
        return t;
      });

      const updatedRels = state.schema.relationships.map((r) => {
        let from_col = r.from_column;
        let to_col = r.to_column;
        if (r.from_table === tableId && r.from_column === oldCol) {
          from_col = newCol.trim();
        }
        if (r.to_table === tableId && r.to_column === oldCol) {
          to_col = newCol.trim();
        }
        return { ...r, from_column: from_col, to_column: to_col };
      });

      // Log rename event for column
      const updatedRenames = { ...state.renameEvents };
      if (!updatedRenames.columns[tableId]) {
        updatedRenames.columns[tableId] = {};
      }
      // Trace original baseline column name
      let originalCol = oldCol;
      for (const [orig, curr] of Object.entries(updatedRenames.columns[tableId])) {
        if (curr === oldCol) {
          originalCol = orig;
          break;
        }
      }
      updatedRenames.columns[tableId][originalCol] = newCol.trim();

      return {
        schema: {
          ...state.schema,
          tables: updatedTables,
          relationships: updatedRels,
        },
        renameEvents: updatedRenames,
      };
    });
    get().syncSqlFromSchema();
  },

  updateColumnType: (tableId, columnName, newType) => {
    set((state) => {
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
    });
    get().syncSqlFromSchema();
  },

  addRelationship: (fromTable, fromCol, toTable, toCol) => {
    set((state) => {
      if (!state.schema) return {};
      
      const relId = `rel_${fromTable}_${fromCol}_to_${toTable}_${toCol}`;
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
    });
    get().syncSqlFromSchema();
  },

  deleteRelationship: (id) => {
    set((state) => {
      if (!state.schema) return {};

      const relToDelete = state.schema.relationships.find((r) => r.id === id);
      if (!relToDelete) return {};

      const updatedRels = state.schema.relationships.filter((r) => r.id !== id);

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
    });
    get().syncSqlFromSchema();
  },

  addTable: () => {
    set((state) => {
      if (!state.schema) return {};
      
      const tablesCount = state.schema.tables.length + 1;
      const newTableName = `table_${tablesCount}`;
      const newTableId = newTableName.toLowerCase();

      const newTable = {
        id: newTableId,
        name: newTableName,
        columns: [
          {
            name: 'id',
            type: 'INT',
            nullable: false,
            is_pk: true,
            is_fk: false,
            comment: ''
          }
        ]
      };

      const newPositions = {
        ...state.nodePositions,
        [newTableId]: { x: 150 + (tablesCount * 30), y: 150 + (tablesCount * 30) }
      };

      return {
        schema: {
          ...state.schema,
          tables: [...state.schema.tables, newTable]
        },
        nodePositions: newPositions
      };
    });
    get().syncSqlFromSchema();
  },

  addColumn: (tableId) => {
    set((state) => {
      if (!state.schema) return {};

      const updatedTables = state.schema.tables.map((t) => {
        if (t.id === tableId) {
          const colIndex = t.columns.length + 1;
          const newColName = `col_${colIndex}`;
          return {
            ...t,
            columns: [
              ...t.columns,
              {
                name: newColName,
                type: 'VARCHAR(255)',
                nullable: true,
                is_pk: false,
                is_fk: false,
                comment: ''
              }
            ]
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
    const { schema } = get();
    if (!schema) return;
    try {
      const blob = await exportSql(schema);
      const sqlText = await blob.text();
      set({ sql: sqlText });
    } catch (e) {
      console.error("Failed to sync DDL SQL:", e);
    }
  }
}));
