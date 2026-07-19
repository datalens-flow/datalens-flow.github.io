import React, { useState, useRef, useEffect } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';

export const ProjectManager: React.FC = () => {
  const { 
    projects, 
    activeProjectId, 
    loadProject, 
    saveProjectAs, 
    deleteProject, 
    updateProjectState, 
    importProjectJson 
  } = useSchemaStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSaveDialog(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleExport = () => {
    if (!activeProject) return;
    updateProjectState(); // Save current work before export
    
    // We get the latest from store
    const { schema, sql, dialect, outputDialect, descriptions, nodePositions } = useSchemaStore.getState();
    const exportData = {
      id: activeProject.id,
      name: activeProject.name,
      sql, dialect, outputDialect, schema, descriptions, nodePositions
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        importProjectJson(event.target.result as string);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsOpen(false);
  };

  const handleSaveAs = () => {
    if (newProjectName.trim()) {
      saveProjectAs(newProjectName.trim());
      setNewProjectName('');
      setShowSaveDialog(false);
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button 
        className="toolbar-dropdown-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>{activeProject ? activeProject.name : 'Unsaved Project'}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2.5 3.5L5 6.5 7.5 3.5"/>
        </svg>
      </button>

      {/* Save Current Button */}
      {activeProject && (
        <button 
          title="Save Current Project"
          onClick={() => updateProjectState()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-indigo)', display: 'flex' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="toolbar-dropdown-panel glass-panel" style={{ left: 0, top: 'calc(100% + 6px)', minWidth: '220px', zIndex: 100 }}>
          <div style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Projects</div>
            {projects.length === 0 ? (
              <div style={{ fontSize: '12px', padding: '4px 8px', color: 'var(--color-text-muted)' }}>No projects saved</div>
            ) : (
              projects.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    className={`toolbar-dropdown-item ${activeProjectId === p.id ? 'selected' : ''}`}
                    onClick={() => { loadProject(p.id); setIsOpen(false); }}
                    style={{ flexGrow: 1, textAlign: 'left' }}
                  >
                    {p.name}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-rose)', padding: '4px' }}
                    title="Delete Project"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '4px' }}>
            <button className="toolbar-dropdown-item" onClick={() => { setShowSaveDialog(true); setIsOpen(false); }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Save As New Project
            </button>
            <button className="toolbar-dropdown-item" onClick={handleExport} disabled={!activeProject}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export JSON
            </button>
            <button className="toolbar-dropdown-item" onClick={() => fileInputRef.current?.click()}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Import JSON
            </button>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImport} 
            />
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: 'var(--bg-secondary)', border: '1px solid var(--color-border)', 
          padding: '12px', borderRadius: '6px', zIndex: 101, display: 'flex', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <input 
            autoFocus
            type="text" 
            value={newProjectName} 
            onChange={(e) => setNewProjectName(e.target.value)} 
            placeholder="Project Name"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAs(); if (e.key === 'Escape') setShowSaveDialog(false); }}
            style={{ 
              background: 'var(--bg-primary)', border: '1px solid var(--color-border)', 
              color: 'var(--color-text-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' 
            }}
          />
          <button 
            onClick={handleSaveAs}
            style={{ 
              background: 'var(--color-indigo)', color: 'white', border: 'none', 
              padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' 
            }}
          >
            Save
          </button>
          <button 
            onClick={() => setShowSaveDialog(false)}
            style={{ 
              background: 'transparent', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', 
              padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' 
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
