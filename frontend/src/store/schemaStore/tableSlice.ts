// @ts-nocheck

import { StateCreator } from 'zustand';
import { SchemaState } from './types';
import {
  updateTableNameHelper,
  updateColumnNameHelper,
  updateColumnTypeHelper,
  addRelationshipHelper,
  deleteRelationshipHelper,
  addTableHelper,
  addColumnHelper
} from '../schemaHelpers';

export const createTableSlice: StateCreator<SchemaState, [], [], any> = (set, get) => ({
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
      return { schema: { ...state.schema, tables: updatedTables } };
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
      return { schema: { ...state.schema, tables: updatedTables } };
    });
    get().syncSqlFromSchema();
  }
});
