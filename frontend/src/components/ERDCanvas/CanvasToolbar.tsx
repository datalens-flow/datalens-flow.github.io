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
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>
  </svg>
);
const IconChevron = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 3.5L5 6.5 7.5 3.5"/>
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
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const CanvasToolbar: React.FC = () => {
  const {
    addTable,
    layoutDir,
    setLayoutDir,
    inferRelationships,
    setInferRelationships,
    showGrid,
    setShowGrid,
    theme,
    setTheme,
    searchQuery,
    setSearchQuery
  } = useSchemaStore();

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="canvas-toolbar">
      {/* Add Table */}
      <button className="toolbar-btn add-btn" onClick={addTable}>
        <IconPlus /> Add Table
      </button>

      <div className="toolbar-divider" />

      {/* Layout Dropdown */}
      <ToolbarDropdown label={<><span className="toolbar-dropdown-label">Layout</span> {layoutDir === 'LR' ? 'Horizontal' : 'Vertical'}</>}>
        <button className={`toolbar-dropdown-item ${layoutDir === 'LR' ? 'selected' : ''}`} onClick={() => setLayoutDir('LR')}>
          <IconHorizontal /> Horizontal
        </button>
        <button className={`toolbar-dropdown-item ${layoutDir === 'TB' ? 'selected' : ''}`} onClick={() => setLayoutDir('TB')}>
          <IconVertical /> Vertical
        </button>
      </ToolbarDropdown>

      {/* Theme Dropdown */}
      <ToolbarDropdown label={<><span className="toolbar-dropdown-label">Theme</span> {theme === 'dark' ? 'Dark' : 'Light'}</>}>
        <button className={`toolbar-dropdown-item ${theme === 'dark' ? 'selected' : ''}`} onClick={() => setTheme('dark')}>
          <IconDark /> Dark
        </button>
        <button className={`toolbar-dropdown-item ${theme === 'light' ? 'selected' : ''}`} onClick={() => setTheme('light')}>
          <IconLight /> Light
        </button>
      </ToolbarDropdown>

      {/* Canvas Settings Dropdown */}
      <ToolbarDropdown label={<><IconGear /> Settings</>}>
        <label className="toolbar-dropdown-check">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          Show Background Grid
        </label>
        <label className="toolbar-dropdown-check">
          <input type="checkbox" checked={inferRelationships} onChange={(e) => setInferRelationships(e.target.checked)} />
          Heuristic Relations
        </label>
      </ToolbarDropdown>

      <div className="toolbar-divider" />

      {/* Search */}
      <div className="toolbar-search-wrapper">
        <IconSearch />
        <input
          type="text"
          placeholder="Search table / column..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="toolbar-search-input"
        />
        {hasSearch && (
          <button className="toolbar-search-clear" onClick={() => setSearchQuery('')}>
            <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg>
          </button>
        )}
      </div>
    </div>
  );
};
export default CanvasToolbar;
