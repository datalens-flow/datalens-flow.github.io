// @ts-nocheck

import { StateCreator } from 'zustand';
import { SchemaState } from './types';
import { DEFAULT_SQL, MAX_HISTORY } from './constants';
import { exportSql } from '../../api/client';

export const createBaseSlice: StateCreator<SchemaState, [], [], any> = (set, get) => ({
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
  procedureSql: '',
  dialect: 'postgres',
  loading: false,
  error: null,

  theme: 'dark',
  layoutDir: 'LR',
  inferRelationships: false,
  showGrid: true,
  setShowGrid: (showGrid) => set({ showGrid }),
  showTableExplorer: true,
  setShowTableExplorer: (showTableExplorer) => set({ showTableExplorer }),
  showSidebarExplorer: true,
  setShowSidebarExplorer: (showSidebarExplorer) => set({ showSidebarExplorer }),
  showMiniMap: true,
  setShowMiniMap: (showMiniMap) => set({ showMiniMap }),
  outputDialect: 'postgres',
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  lineageSearchQuery: '',
  setLineageSearchQuery: (lineageSearchQuery) => set({ lineageSearchQuery }),
  lineageViewMode: 'detailed',
  setLineageViewMode: (lineageViewMode) => set({ lineageViewMode }),
  activeLineageProcedureIndex: 0,
  setActiveLineageProcedureIndex: (index) => set({ activeLineageProcedureIndex: index }),
  ignoredLineageTables: 'risk_log_detail, error_log',
  setIgnoredLineageTables: (tables) => set({ ignoredLineageTables: tables }),

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
  setProcedureSql: (procedureSql) => set({ procedureSql }),
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
    const snapshot = schema ? JSON.parse(JSON.stringify(schema)) : null;
    const newHistory = snapshot ? [snapshot] : [];
    return { 
      schema, 
      descriptions: newDescriptions, 
      _history: newHistory, 
      _historyIndex: snapshot ? 0 : -1,
      nodePositions: {} 
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
});
