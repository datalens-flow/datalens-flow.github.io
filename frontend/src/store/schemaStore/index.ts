import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SchemaState } from './types';
import { createBaseSlice } from './baseSlice';
import { createTableSlice } from './tableSlice';
import { createProjectSlice } from './projectSlice';

export * from './types';
export * from './constants';

export const useSchemaStore = create<SchemaState>()(
  persist(
    (set, get, api) => ({
      ...createBaseSlice(set, get, api),
      ...createTableSlice(set, get, api),
      ...createProjectSlice(set, get, api),
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
        showTableExplorer: state.showTableExplorer,
        showSidebarExplorer: state.showSidebarExplorer,
        outputDialect: state.outputDialect,
        lineageSearchQuery: state.lineageSearchQuery,
        renameEvents: state.renameEvents,
        tableColors: (state as any).tableColors || {},
      }),
    }
  )
);
