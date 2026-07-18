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
    // Merge previous comments if any exist to preserve user input descriptions
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
}));
