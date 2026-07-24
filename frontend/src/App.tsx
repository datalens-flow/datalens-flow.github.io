// @ts-nocheck

import { useState, useEffect, lazy, Suspense } from 'react';
import { SqlEditor } from './components/SqlEditor/SqlEditor';
import { ERDCanvas } from './components/ERDCanvas/ERDCanvas';
import { DataDictionary } from './components/DataDictionary/DataDictionary';
import { ExportPanel } from './components/ExportPanel/ExportPanel';
import { CanvasToolbar } from './components/ERDCanvas/CanvasToolbar';
import { DataLineage } from './components/DataLineage/DataLineage';
import { LandingPage } from './components/LandingPage/LandingPage';
import { ToastContainer } from './components/Toast/ToastContainer';
import { useSchemaStore } from './store/useSchemaStore';
import { useRef } from 'react';
import { ProjectManager } from './components/ProjectManager/ProjectManager';
import { ModeDropdown } from './components/ModeDropdown/ModeDropdown';
import { KnowledgeDropdown } from './components/KnowledgeDropdown/KnowledgeDropdown';

const SqlTranspilerView = lazy(() => import('./components/SqlTranspiler/SqlTranspilerView').then(m => ({ default: m.SqlTranspilerView })));

function App() {
  const [showLanding, setShowLanding] = useState(() => {
    return !sessionStorage.getItem('datalens-launched');
  });

  const [currentMode, setCurrentMode] = useState<'diagram' | 'lineage' | 'transpiler'>(() => {
    const path = window.location.pathname;
    if (path.includes('/data_lineage')) return 'lineage';
    if (path.includes('/sql_transpiler')) return 'transpiler';
    return 'diagram';
  });

  useEffect(() => {
    let targetPath = '/database_diagram';
    if (currentMode === 'lineage') targetPath = '/data_lineage';
    if (currentMode === 'transpiler') targetPath = '/sql_transpiler';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [currentMode]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('/data_lineage')) {
        setCurrentMode('lineage');
      } else if (path.includes('/sql_transpiler')) {
        setCurrentMode('transpiler');
      } else {
        setCurrentMode('diagram');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const { 
    activeTab, 
    setActiveTab, 
    error, 
    theme, 
    schema, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    showTableExplorer,
    searchQuery,
    setSearchQuery,
    lineageSearchQuery,
    setLineageSearchQuery
  } = useSchemaStore();
  const tableCount = schema?.tables?.length || 0;

  const handleLaunchApp = () => {
    sessionStorage.setItem('datalens-launched', 'true');
    setShowLanding(false);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      
      // Ctrl/Cmd + Z = Undo
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
        return;
      }
      // Ctrl/Cmd + Shift + Z = Redo
      if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo()) redo();
        return;
      }
      // Ctrl/Cmd + Y = Redo (alternative)
      if (isMod && e.key === 'y') {
        e.preventDefault();
        if (canRedo()) redo();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  if (showLanding) {
    return (
      <>
        <LandingPage onLaunchApp={handleLaunchApp} />
        <ToastContainer />
      </>
    );
  }

  const isDiagram = currentMode === 'diagram';
  const showSearch = isDiagram ? activeTab === 'erd' : true;
  const currentSearchVal = isDiagram ? searchQuery : lineageSearchQuery;
  const handleSearchChange = (val: string) => {
    if (isDiagram) {
      setSearchQuery(val);
    } else {
      setLineageSearchQuery(val);
    }
  };

  return (
    <div className={`theme-${theme}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-primary)', color: 'var(--color-text-primary)', transition: 'background-color 0.2s ease, color 0.2s ease' }}>
      {/* Top Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '10px 24px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderBottom: '1px solid var(--color-border)',
        height: '56px',
        boxSizing: 'border-box'
      }}>
        {/* Left Side: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12C2 12 7 4 12 4C17 4 22 12 22 12C22 12 17 20 12 20C7 20 2 12 2 12Z" stroke="var(--color-indigo)" />
            <circle cx="12" cy="12" r="3" fill="var(--color-indigo)" stroke="none" />
            <path d="M4 12 Q 12 24 20 12" stroke="var(--color-emerald)" strokeWidth="2" />
          </svg>
          <h1 style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '0.02em', margin: 0, whiteSpace: 'nowrap' }}>
            DataLens Flow
          </h1>
        </div>

        {/* Center-Left: Project & Mode Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexGrow: 1, marginLeft: '24px' }}>
          <ProjectManager />
          <ModeDropdown currentMode={currentMode} setCurrentMode={setCurrentMode} />
          <KnowledgeDropdown />
          
          {/* Centered Search Bar matching both diagram & lineage */}
          {showSearch && (
            <div className="toolbar-search-wrapper" style={{
              marginLeft: '20px',
              minWidth: '240px',
              maxWidth: '360px',
              flexGrow: 1
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>
              </svg>
              <input
                type="text"
                placeholder={isDiagram ? "Search tables or columns..." : "Search lineage tables/columns..."}
                value={currentSearchVal}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="toolbar-search-input"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text-primary)',
                  fontSize: '12px',
                  width: '100%',
                  height: '100%'
                }}
              />
              {currentSearchVal && (
                <button 
                  onClick={() => handleSearchChange('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg>
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Right Side: Toolbar Settings & Export options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {((isDiagram && activeTab === 'erd') || currentMode === 'lineage') && <CanvasToolbar mode={currentMode} />}
          <ExportPanel mode={currentMode} />
        </div>
      </header>

      {/* Main Workspace */}
      {currentMode === 'diagram' ? (
        <main style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', padding: '16px', gap: '16px' }}>
          {/* Left Side: SQL Input */}
          {showTableExplorer && (
            <section style={{ width: '380px', height: '100%', flexShrink: 0 }}>
              <SqlEditor />
            </section>
          )}

          {/* Right Side: Visualizers */}
          <section className="glass-panel" style={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tab Selection */}
            <div className="tabs-container">
              <button 
                className={`tab-btn ${activeTab === 'erd' ? 'active' : ''}`}
                onClick={() => setActiveTab('erd')}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginRight: 6}}><rect x="1" y="3" width="14" height="10" rx="1"/><path d="M1 7h14M6 7v6"/></svg>
                Interactive ERD {tableCount > 0 ? `(${tableCount})` : ''}
              </button>
              <button 
                className={`tab-btn ${activeTab === 'dict' ? 'active' : ''}`}
                onClick={() => setActiveTab('dict')}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginRight: 6}}><path d="M3 1h10a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z"/><path d="M5 5h6M5 8h6M5 11h4"/></svg>
                Data Dictionary {tableCount > 0 ? `(${tableCount})` : ''}
              </button>

            </div>

            {/* Status Message or Warnings */}
            {error && (
              <div style={{ 
                padding: '8px 16px', 
                backgroundColor: 'rgba(244, 63, 94, 0.1)', 
                borderBottom: '1px solid var(--color-rose)', 
                color: 'var(--color-rose)', 
                fontSize: '13px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono)'
              }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginRight: 6, verticalAlign: 'middle'}}><path d="M8 1L1 14h14L8 1zM8 6v4M8 12h.01"/></svg>
                {error}
              </div>
            )}

            {/* Canvas Workspace */}
            <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
              {activeTab === 'erd' ? (
                <ERDCanvas />
              ) : (
                <DataDictionary />
              )}
            </div>
          </section>
        </main>
      ) : currentMode === 'lineage' ? (
        <main style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          <DataLineage onSwitchToDiagram={() => setCurrentMode('diagram')} />
        </main>
      ) : (
        <main style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', width: '100%' }}>
          <Suspense fallback={<div style={{ padding: '24px', color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading SQL Transpiler...</div>}>
            <SqlTranspilerView />
          </Suspense>
        </main>
      )}
      <ToastContainer />
    </div>
  );
}

export default App;
