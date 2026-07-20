import { SchemaResponse } from '../../types/schema';

export interface Project {
  id: string;
  name: string;
  sql: string;
  procedureSql?: string;
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
  tables: Record<string, string>;
  columns: Record<string, Record<string, string>>;
}

export interface SchemaState {
  projects: Project[];
  activeProjectId: string | null;

  schema: SchemaResponse | null;
  originalSchema: SchemaResponse | null;
  renameEvents: RenameEvents;
  descriptions: Record<string, Record<string, string>>;
  tableDescriptions: Record<string, string>;
  dataClassifications: Record<string, Record<string, string>>;
  nodePositions: Record<string, { x: number; y: number }>;
  activeTab: 'erd' | 'dict' | 'metadata';
  sql: string;
  procedureSql: string;
  dialect: string;
  loading: boolean;
  error: string | null;

  theme: 'dark' | 'light';
  layoutDir: 'LR' | 'TB';
  inferRelationships: boolean;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  showTableExplorer: boolean;
  setShowTableExplorer: (show: boolean) => void;
  showSidebarExplorer: boolean;
  setShowSidebarExplorer: (show: boolean) => void;
  tableColors: Record<string, string>;
  setTableColor: (tableId: string, color: string) => void;
  outputDialect: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  lineageSearchQuery: string;
  setLineageSearchQuery: (query: string) => void;
  activeLineageProcedureIndex: number;
  setActiveLineageProcedureIndex: (index: number) => void;
  
  _history: SchemaResponse[];
  _historyIndex: number;
  _pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  setSql: (sql: string) => void;
  setProcedureSql: (sql: string) => void;
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

  saveProjectAs: (name: string) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  updateProjectState: () => void;
  importProjectJson: (jsonString: string) => void;
}
