import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export interface Project {
  id: string;
  name: string;
  sql: string;
  dialect: string;
  outputDialect: string;
  schema: SchemaResponse | null;
  descriptions: Record<string, Record<string, string>>;
  tableDescriptions: Record<string, string>;
  dataClassifications: Record<string, Record<string, string>>;
  nodePositions: Record<string, { x: number; y: number }>;
  tableColors?: Record<string, string>;
}

export interface RenameEvents {
  tables: Record<string, string>; // oldTableId -> newTableName
  columns: Record<string, Record<string, string>>; // tableId -> oldColName -> newColName
}

interface SchemaState {
  projects: Project[];
  activeProjectId: string | null;

  schema: SchemaResponse | null;
  originalSchema: SchemaResponse | null;
  renameEvents: RenameEvents;
  descriptions: Record<string, Record<string, string>>; // tableId -> colName -> description
  tableDescriptions: Record<string, string>; // tableId -> description
  dataClassifications: Record<string, Record<string, string>>; // tableId -> colName -> classification (Public, PII, Confidential)
  nodePositions: Record<string, { x: number; y: number }>;
  activeTab: 'erd' | 'dict' | 'metadata';
  sql: string;
  dialect: string;
  loading: boolean;
  error: string | null;

  // Visual/Layout settings
  theme: 'dark' | 'light';
  layoutDir: 'LR' | 'TB';
  inferRelationships: boolean;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  tableColors: Record<string, string>; // tableId -> hexColor
  setTableColor: (tableId: string, color: string) => void;
  outputDialect: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Undo/Redo
  _history: SchemaResponse[];
  _historyIndex: number;
  _pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  setSql: (sql: string) => void;
  setDialect: (dialect: string) => void;
  setSchema: (schema: SchemaResponse | null) => void;
  setOriginalSchema: (schema: SchemaResponse | null) => void;
  updateDescription: (tableId: string, colName: string, text: string) => void;
  updateTableDescription: (tableId: string, text: string) => void;
  updateDataClassification: (tableId: string, colName: string, text: string) => void;
  setDescriptions: (descriptions: Record<string, Record<string, string>>) => void;
  setActiveTab: (tab: 'erd' | 'dict' | 'metadata') => void;
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
  deleteColumn: (tableId: string, colName: string) => void;
  moveColumn: (tableId: string, fromIndex: number, toIndex: number) => void;
  toggleColumnPk: (tableId: string, colName: string) => void;
  toggleColumnNullable: (tableId: string, colName: string) => void;
  syncSqlFromSchema: () => Promise<void>;

  // Project Management
  saveProjectAs: (name: string) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  updateProjectState: () => void;
  importProjectJson: (jsonString: string) => void;
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

const MAX_HISTORY = 50;

export const useSchemaStore = create<SchemaState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      schema: null,
      originalSchema: null,
      renameEvents: { tables: {}, columns: {} },
      descriptions: {},
      tableDescriptions: {},
      dataClassifications: {},
      nodePositions: {},
      activeTab: 'erd',
      sql: DEFAULT_SQL,
      dialect: 'postgres',
      loading: false,
      error: null,

      theme: 'dark',
      layoutDir: 'LR',
      inferRelationships: false,
      showGrid: true,
      setShowGrid: (showGrid) => set({ showGrid }),
      outputDialect: 'postgres',
      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      // Undo/Redo state
      _history: [],
      _historyIndex: -1,

      _pushHistory: () => {
        const { schema, _history, _historyIndex } = get();
        if (!schema) return;
        const snapshot = JSON.parse(JSON.stringify(schema));
        const trimmed = _history.slice(0, _historyIndex + 1);
        const newHistory = [...trimmed, snapshot].slice(-MAX_HISTORY);
        set({ _history: newHistory, _historyIndex: newHistory.length - 1 });
      },

      undo: () => {
        const { _history, _historyIndex } = get();
        if (_historyIndex <= 0) return;
        const newIndex = _historyIndex - 1;
        const previous = JSON.parse(JSON.stringify(_history[newIndex]));
        set({ schema: previous, _historyIndex: newIndex });
        get().syncSqlFromSchema();
      },

      redo: () => {
        const { _history, _historyIndex } = get();
        if (_historyIndex >= _history.length - 1) return;
        const newIndex = _historyIndex + 1;
        const next = JSON.parse(JSON.stringify(_history[newIndex]));
        set({ schema: next, _historyIndex: newIndex });
        get().syncSqlFromSchema();
      },

      canUndo: () => get()._historyIndex > 0,
      canRedo: () => get()._historyIndex < get()._history.length - 1,
      
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
        // Push initial schema to history
        const snapshot = schema ? JSON.parse(JSON.stringify(schema)) : null;
        const newHistory = snapshot ? [snapshot] : [];
        return { 
          schema, 
          descriptions: newDescriptions, 
          _history: newHistory, 
          _historyIndex: snapshot ? 0 : -1,
          nodePositions: {} // Reset positions so layout is re-run from scratch
        };
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
      updateTableDescription: (tableId, text) => set((state) => ({
        tableDescriptions: {
          ...state.tableDescriptions,
          [tableId]: text
        }
      })),
      updateDataClassification: (tableId, colName, text) => set((state) => {
        const tableClassification = state.dataClassifications[tableId] || {};
        return {
          dataClassifications: {
            ...state.dataClassifications,
            [tableId]: {
              ...tableClassification,
              [colName]: text
            }
          }
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
        get()._pushHistory();
        set((state) => updateTableNameHelper(state.schema, state.descriptions, state.nodePositions, state.renameEvents, oldTableId, newName));
        get().syncSqlFromSchema();
      },

      updateColumnName: (tableId, oldCol, newCol) => {
        get()._pushHistory();
        set((state) => updateColumnNameHelper(state.schema, state.renameEvents, tableId, oldCol, newCol));
        get().syncSqlFromSchema();
      },

      updateColumnType: (tableId, columnName, newType) => {
        get()._pushHistory();
        set((state) => updateColumnTypeHelper(state.schema, tableId, columnName, newType));
        get().syncSqlFromSchema();
      },

      addRelationship: (fromTable, fromCol, toTable, toCol) => {
        get()._pushHistory();
        set((state) => addRelationshipHelper(state.schema, fromTable, fromCol, toTable, toCol));
        get().syncSqlFromSchema();
      },

      deleteRelationship: (id) => {
        get()._pushHistory();
        set((state) => deleteRelationshipHelper(state.schema, id));
        get().syncSqlFromSchema();
      },

      addTable: () => {
        get()._pushHistory();
        set((state) => addTableHelper(state.schema, state.nodePositions));
        get().syncSqlFromSchema();
      },

      deleteTable: (tableId) => {
        get()._pushHistory();
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
        get()._pushHistory();
        set((state) => addColumnHelper(state.schema, tableId));
        get().syncSqlFromSchema();
      },

      deleteColumn: (tableId, colName) => {
        get()._pushHistory();
        set((state) => {
          if (!state.schema) return {};
          const updatedTables = state.schema.tables.map((t) => {
            if (t.id !== tableId) return t;
            return { ...t, columns: t.columns.filter((c) => c.name !== colName) };
          });
          // Remove relationships that reference this column
          const updatedRelationships = state.schema.relationships.filter(
            (r) => !((r.from_table === tableId && r.from_column === colName) ||
                     (r.to_table === tableId && r.to_column === colName))
          );
          // Clean up descriptions
          const updatedDescriptions = { ...state.descriptions };
          if (updatedDescriptions[tableId]) {
            const tableCopy = { ...updatedDescriptions[tableId] };
            delete tableCopy[colName];
            updatedDescriptions[tableId] = tableCopy;
          }
          return {
            schema: { ...state.schema, tables: updatedTables, relationships: updatedRelationships },
            descriptions: updatedDescriptions
          };
        });
        get().syncSqlFromSchema();
      },

      moveColumn: (tableId, fromIndex, toIndex) => {
        get()._pushHistory();
        set((state) => {
          if (!state.schema) return {};
          const updatedTables = state.schema.tables.map((t) => {
            if (t.id !== tableId) return t;
            const cols = [...t.columns];
            const [moved] = cols.splice(fromIndex, 1);
            cols.splice(toIndex, 0, moved);
            return { ...t, columns: cols };
          });
          return { schema: { ...state.schema, tables: updatedTables } };
        });
        get().syncSqlFromSchema();
      },

      toggleColumnPk: (tableId, colName) => {
        get()._pushHistory();
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
        get()._pushHistory();
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

      tableColors: {},
      setTableColor: (tableId, color) => {
        get()._pushHistory();
        set((state) => ({
          tableColors: {
            ...state.tableColors,
            [tableId]: color
          }
        }));
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
      },

      saveProjectAs: (name: string) => {
        const state = get();
        const newProject: Project = {
          id: crypto.randomUUID(),
          name,
          sql: state.sql,
          dialect: state.dialect,
          outputDialect: state.outputDialect,
          schema: state.schema,
          descriptions: state.descriptions,
          tableDescriptions: state.tableDescriptions || {},
          dataClassifications: state.dataClassifications || {},
          nodePositions: state.nodePositions,
          tableColors: state.tableColors,
        };
        set({
          projects: [...state.projects, newProject],
          activeProjectId: newProject.id
        });
      },

      loadProject: (id: string) => {
        const state = get();
        const project = state.projects.find(p => p.id === id);
        if (project) {
          set({
            activeProjectId: project.id,
            sql: project.sql,
            dialect: project.dialect,
            outputDialect: project.outputDialect,
            schema: project.schema,
            originalSchema: project.schema,
            descriptions: project.descriptions || {},
            tableDescriptions: project.tableDescriptions || {},
            dataClassifications: project.dataClassifications || {},
            nodePositions: project.nodePositions || {},
            tableColors: project.tableColors || {},
            renameEvents: { tables: {}, columns: {} },
            _history: project.schema ? [JSON.parse(JSON.stringify(project.schema))] : [],
            _historyIndex: project.schema ? 0 : -1,
          });
        }
      },

      deleteProject: (id: string) => {
        set((state) => {
          const newProjects = state.projects.filter(p => p.id !== id);
          const newActiveId = state.activeProjectId === id ? null : state.activeProjectId;
          return {
            projects: newProjects,
            activeProjectId: newActiveId
          };
        });
      },

      updateProjectState: () => {
        set((state) => {
          if (!state.activeProjectId) return state;
          const newProjects = state.projects.map(p => {
            if (p.id === state.activeProjectId) {
              return {
                ...p,
                sql: state.sql,
                dialect: state.dialect,
                outputDialect: state.outputDialect,
                schema: state.schema,
                descriptions: state.descriptions,
                tableDescriptions: state.tableDescriptions,
                dataClassifications: state.dataClassifications,
                nodePositions: state.nodePositions,
                tableColors: state.tableColors,
              };
            }
            return p;
          });
          return { projects: newProjects };
        });
      },

      importProjectJson: (jsonString: string) => {
        try {
          const data = JSON.parse(jsonString);
          const newProject: Project = {
            id: data.id || crypto.randomUUID(),
            name: data.name || 'Imported Project',
            sql: data.sql || '',
            dialect: data.dialect || 'postgres',
            outputDialect: data.outputDialect || 'postgres',
            schema: data.schema || null,
            descriptions: data.descriptions || {},
            tableDescriptions: data.tableDescriptions || {},
            dataClassifications: data.dataClassifications || {},
            nodePositions: data.nodePositions || {},
            tableColors: data.tableColors || {},
          };
          
          set((state) => {
            const exists = state.projects.find(p => p.id === newProject.id);
            const projects = exists 
              ? state.projects.map(p => p.id === newProject.id ? newProject : p)
              : [...state.projects, newProject];
              
            return {
              projects,
              activeProjectId: newProject.id,
              sql: newProject.sql,
              dialect: newProject.dialect,
              outputDialect: newProject.outputDialect,
              schema: newProject.schema,
              originalSchema: newProject.schema,
              descriptions: newProject.descriptions,
              tableDescriptions: newProject.tableDescriptions,
              dataClassifications: newProject.dataClassifications,
              nodePositions: newProject.nodePositions,
              tableColors: newProject.tableColors || {},
              renameEvents: { tables: {}, columns: {} },
              _history: newProject.schema ? [JSON.parse(JSON.stringify(newProject.schema))] : [],
              _historyIndex: newProject.schema ? 0 : -1,
            };
          });
        } catch (e) {
          console.error("Failed to import project:", e);
        }
      }
    }),
    {
      name: 'datalens-store',
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        schema: state.schema,
        originalSchema: state.originalSchema,
        descriptions: state.descriptions,
        tableDescriptions: state.tableDescriptions,
        dataClassifications: state.dataClassifications,
        nodePositions: state.nodePositions,
        sql: state.sql,
        dialect: state.dialect,
        theme: state.theme,
        layoutDir: state.layoutDir,
        inferRelationships: state.inferRelationships,
        showGrid: state.showGrid,
        outputDialect: state.outputDialect,
        renameEvents: state.renameEvents,
        tableColors: (state as any).tableColors || {},
      }),
    }
  )
);
