import React, { useState, useRef, useEffect } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';

/* ── Custom SVG Icons (no emoji) ── */
const IconHorizontal = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M2 8h12M11 5l3 3-3 3"/>
  </svg>
);
const IconVertical = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M8 2v12M5 11l3 3 3-3"/>
  </svg>
);
const IconDark = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13.5 8.5a5.5 5.5 0 1 1-7-5.2A4 4 0 0 0 13.5 8.5z"/>
  </svg>
);
const IconLight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4"/>
  </svg>
);
const IconGear = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.3 3.3l.85.85M11.85 11.85l.85.85M3.3 12.7l.85-.85M11.85 4.15l.85-.85"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M8 3v10M3 8h10"/>
  </svg>
);

const IconChevron = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 3.5L5 6.5 7.5 3.5"/>
  </svg>
);

const IconLayoutGroup = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <path d="M1 3 L15 15 M3 1 L15 1 M15 1 L15 13" strokeLinecap="round" />
  </svg>
);

const IconPalette = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <path d="M8 2c-4 0-6 2.5-6 6s2 6 6 6 6-2 6-6-2-6-6-6z" />
    <circle cx="5.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="8" cy="5" r="1" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconWrench = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <path d="M11 2a3 3 0 0 0-3.5 4.5L2 12a1.5 1.5 0 0 0 2 2l5.5-5.5A3 3 0 0 0 14 5l-1 1-2-2 1-1z" />
  </svg>
);

/* ── Reusable Dropdown Wrapper ── */
const ToolbarDropdown: React.FC<{
  label: React.ReactNode;
  isActive?: boolean;
  children: React.ReactNode;
  align?: 'left' | 'right';
}> = ({ label, isActive, children, align = 'left' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={`toolbar-dropdown-trigger ${isActive || open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {label}
        <IconChevron />
      </button>
      {open && (
        <div
          className="toolbar-dropdown-panel glass-panel"
          style={{ [align === 'right' ? 'right' : 'left']: 0 }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const CanvasToolbar: React.FC<{ mode?: 'diagram' | 'lineage' }> = ({ mode = 'diagram' }) => {
  const {
    addTable,
    layoutDir,
    setLayoutDir,
    inferRelationships,
    setInferRelationships,
    showGrid,
    setShowGrid,
    showTableExplorer,
    setShowTableExplorer,
    showSidebarExplorer,
    setShowSidebarExplorer,
    showMiniMap,
    setShowMiniMap,
    theme,
    setTheme,
    lineageViewMode,
    setLineageViewMode,
    showProcedureGroups,
    setShowProcedureGroups,
    setShowMappingMatrixModal,
    setShowEtlHealthModal
  } = useSchemaStore();

  return (
    <div className="canvas-toolbar">
      {/* Add Table - Only in ERD mode */}
      {mode === 'diagram' && (
        <>
          <button className="toolbar-btn add-btn" onClick={addTable}>
            <IconPlus /> Add Table
          </button>
          <div className="toolbar-divider" />
        </>
      )}

      {/* Lineage View Mode Toggle & Tools */}
      {mode === 'lineage' && (
        <>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', padding: '2px', marginRight: '8px' }}>
            <button 
              className={`toolbar-btn ${lineageViewMode === 'detailed' ? 'active' : ''}`}
              style={{ 
                backgroundColor: lineageViewMode === 'detailed' ? 'var(--bg-primary)' : 'transparent',
                color: lineageViewMode === 'detailed' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px'
              }}
              onClick={() => setLineageViewMode('detailed')}
            >
              Detailed
            </button>
            <button 
              className={`toolbar-btn ${lineageViewMode === 'overview' ? 'active' : ''}`}
              style={{ 
                backgroundColor: lineageViewMode === 'overview' ? 'var(--bg-primary)' : 'transparent',
                color: lineageViewMode === 'overview' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px'
              }}
              onClick={() => setLineageViewMode('overview')}
            >
              Overview
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginRight: '8px' }}>
            <button 
              className="toolbar-btn"
              style={{ fontSize: '12px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setShowMappingMatrixModal(true)}
              title="View Data Mapping Matrix Table"
            >
              <span>📊</span> Mapping Matrix
            </button>
            <button 
              className="toolbar-btn"
              style={{ fontSize: '12px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}
              onClick={() => setShowEtlHealthModal(true)}
              title="Run ETL Code Smells & Health Audit"
            >
              <span>⚠️</span> ETL Health
            </button>
          </div>
        </>
      )}

      {/* Unified Settings Dropdown */}
      <ToolbarDropdown label={<><IconGear /> Settings</>}>
        {/* Layout Group */}
        <div className="toolbar-dropdown-group-label"><IconLayoutGroup /> Layout</div>
        <button className={`toolbar-dropdown-item ${layoutDir === 'LR' ? 'selected' : ''}`} onClick={() => setLayoutDir('LR')}>
          <IconHorizontal /> Horizontal
        </button>
        <button className={`toolbar-dropdown-item ${layoutDir === 'TB' ? 'selected' : ''}`} onClick={() => setLayoutDir('TB')}>
          <IconVertical /> Vertical
        </button>

        <div className="toolbar-dropdown-divider" />

        {/* Appearance Group */}
        <div className="toolbar-dropdown-group-label"><IconPalette /> Appearance</div>
        <button className={`toolbar-dropdown-item ${theme === 'dark' ? 'selected' : ''}`} onClick={() => setTheme('dark')}>
          <IconDark /> Dark
        </button>
        <button className={`toolbar-dropdown-item ${theme === 'light' ? 'selected' : ''}`} onClick={() => setTheme('light')}>
          <IconLight /> Light
        </button>

        <div className="toolbar-dropdown-divider" />
        {/* Canvas Group */}
        <div className="toolbar-dropdown-group-label"><IconWrench /> Canvas</div>
        <label className="toolbar-dropdown-check">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          Show Background Grid
        </label>
        
        {mode === 'diagram' && (
          <>
            <label className="toolbar-dropdown-check">
              <input type="checkbox" checked={inferRelationships} onChange={(e) => setInferRelationships(e.target.checked)} />
              Heuristic Relations
            </label>
            <label className="toolbar-dropdown-check">
              <input type="checkbox" checked={showTableExplorer} onChange={(e) => setShowTableExplorer(e.target.checked)} />
              Show Table List Panel
            </label>
          </>
        )}
        
        <label className="toolbar-dropdown-check">
          <input type="checkbox" checked={showSidebarExplorer} onChange={(e) => setShowSidebarExplorer(e.target.checked)} />
          SQL Input Panel
        </label>
        
        <label className="toolbar-dropdown-check">
          <input type="checkbox" checked={showMiniMap} onChange={(e) => setShowMiniMap(e.target.checked)} />
          Show MiniMap
        </label>

        {mode === 'lineage' && (
          <>
            <div className="toolbar-dropdown-divider" />
            <div className="toolbar-dropdown-group-label">🌳 Lineage Graph</div>
            <label className="toolbar-dropdown-check">
              <input 
                type="checkbox" 
                checked={showProcedureGroups} 
                onChange={(e) => setShowProcedureGroups(e.target.checked)} 
              />
              Show Procedure Group Boxes
            </label>
            <button className="toolbar-dropdown-item" onClick={() => window.dispatchEvent(new CustomEvent('lineage-expand-all'))}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2v12M2 8h12M4 4l8 8M4 12l8-8"/></svg>
              Expand All
            </button>
            <button className="toolbar-dropdown-item" onClick={() => window.dispatchEvent(new CustomEvent('lineage-collapse-all'))}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8h12M4 4l4 4 4-4M4 12l4-4 4 4"/></svg>
              Collapse All
            </button>
          </>
        )}
      </ToolbarDropdown>
    </div>
  );
};
export default CanvasToolbar;
