import { useState, useEffect } from 'react';
import { SqlEditor } from './components/SqlEditor/SqlEditor';
import { ERDCanvas } from './components/ERDCanvas/ERDCanvas';
import { DataDictionary } from './components/DataDictionary/DataDictionary';
import { ExportPanel } from './components/ExportPanel/ExportPanel';
import { CanvasToolbar } from './components/ERDCanvas/CanvasToolbar';
import { DataLineage } from './components/DataLineage/DataLineage';
import { useSchemaStore } from './store/useSchemaStore';
import { useRef } from 'react';

interface ModeDropdownProps {
  currentMode: 'diagram' | 'lineage';
  setCurrentMode: (mode: 'diagram' | 'lineage') => void;
}

const ModeDropdown: React.FC<ModeDropdownProps> = ({ currentMode, setCurrentMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={`toolbar-dropdown-trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        {currentMode === 'diagram' ? (
          <>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M7 4h2M4 7v2M12 7v2"/></svg>
            <span>Database Diagram</span>
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="3" cy="8" r="2"/><circle cx="13" cy="4" r="2"/><circle cx="13" cy="12" r="2"/><path d="M5 8h3l2-4M8 8l2 4"/></svg>
            <span>Data Lineage</span>
          </>
        )}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 3.5L5 6.5 7.5 3.5"/>
        </svg>
      </button>

      {open && (
        <div className="toolbar-dropdown-panel glass-panel" style={{ left: 0, top: 'calc(100% + 6px)', minWidth: '180px' }}>
          <button
            className={`toolbar-dropdown-item ${currentMode === 'diagram' ? 'selected' : ''}`}
            onClick={() => {
              setCurrentMode('diagram');
              setOpen(false);
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M7 4h2M4 7v2M12 7v2"/></svg>
            Database Diagram
          </button>
          <button
            className={`toolbar-dropdown-item ${currentMode === 'lineage' ? 'selected' : ''}`}
            onClick={() => {
              setCurrentMode('lineage');
              setOpen(false);
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="3" cy="8" r="2"/><circle cx="13" cy="4" r="2"/><circle cx="13" cy="12" r="2"/><path d="M5 8h3l2-4M8 8l2 4"/></svg>
            Data Lineage
          </button>
        </div>
      )}
    </div>
  );
};

function App() {
  const [currentMode, setCurrentMode] = useState<'diagram' | 'lineage'>('diagram');
  const { activeTab, setActiveTab, error, theme, schema, undo, redo, canUndo, canRedo } = useSchemaStore();
  const tableCount = schema?.tables?.length || 0;

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

  return (
    <div className={`theme-${theme}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-primary)', color: 'var(--color-text-primary)', transition: 'background-color 0.2s ease, color 0.2s ease' }}>
      {/* Top Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 24px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderBottom: '1px solid var(--color-border)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            <h1 style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '0.02em', margin: 0 }}>
              DataLens Flow
            </h1>
          </div>

          {/* Mode Dropdown Switcher */}
          <ModeDropdown currentMode={currentMode} setCurrentMode={setCurrentMode} />
        </div>
        
        {/* Canvas Controls (only active on ERD tab in Diagram Mode) */}
        {currentMode === 'diagram' && activeTab === 'erd' && <CanvasToolbar />}
        
        {/* Export options dropdown */}
        <ExportPanel mode={currentMode} />
      </header>

      {/* Main Workspace */}
      {currentMode === 'diagram' ? (
        <main style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', padding: '16px', gap: '16px' }}>
          {/* Left Side: SQL Input */}
          <section style={{ width: '400px', height: '100%', flexShrink: 0 }}>
            <SqlEditor />
          </section>

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
      ) : (
        <main style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          <DataLineage />
        </main>
      )}
    </div>
  );
}

export default App;
