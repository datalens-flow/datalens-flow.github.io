import { StateCreator } from 'zustand';
import { SchemaState, Project } from './types';

export const createProjectSlice: StateCreator<SchemaState, [], [], any> = (set, get) => ({
  saveProjectAs: (name: string) => {
    const state = get();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      sql: state.sql,
      procedureSql: state.procedureSql,
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
        procedureSql: project.procedureSql || '',
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
            procedureSql: state.procedureSql,
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
        procedureSql: data.procedureSql || '',
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
          procedureSql: newProject.procedureSql || '',
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
});
