import React, { useState, useEffect, useRef } from 'react';

interface ModeDropdownProps {
  currentMode: 'diagram' | 'lineage';
  setCurrentMode: (mode: 'diagram' | 'lineage') => void;
}

export const ModeDropdown: React.FC<ModeDropdownProps> = ({ currentMode, setCurrentMode }) => {
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
