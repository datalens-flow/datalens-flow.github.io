import React, { useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';

interface LineageFilterBarProps {
  hasSelection: boolean;
  onFocusMode: () => void;
  isFocusMode: boolean;
  onExitFocus: () => void;
  nodeCount: number;
}

export const LineageFilterBar: React.FC<LineageFilterBarProps> = ({
  hasSelection, onFocusMode, isFocusMode, onExitFocus, nodeCount
}) => {
  const {
    lineageHideTemp, setLineageHideTemp,
    lineageHideArchive, setLineageHideArchive,
    lineageSchemaFilter, setLineageSchemaFilter,
    setShowGlobalSearchModal
  } = useSchemaStore();

  const [schemaInput, setSchemaInput] = useState(lineageSchemaFilter);

  const pillStyle = (active: boolean, danger = false): React.CSSProperties => ({
    padding: '4px 11px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s ease',
    background: danger && active
      ? 'rgba(249,115,22,0.15)'
      : active
        ? 'rgba(56,189,248,0.18)'
        : 'transparent',
    color: danger && active
      ? '#f97316'
      : active
        ? '#38bdf8'
        : 'var(--color-text-muted)',
    outline: danger && active
      ? '1px solid rgba(249,115,22,0.4)'
      : active
        ? '1px solid rgba(56,189,248,0.45)'
        : '1px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap' as const,
  });

  const Divider = () => (
    <div style={{ width: '1px', height: '16px', background: 'var(--color-border)', margin: '0 2px', flexShrink: 0 }} />
  );

  return (
    <div style={{
      position: 'absolute',
      top: '56px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--color-border)',
      borderRadius: '999px',
      padding: '4px 8px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    }}>
      {/* Table count badge */}
      {nodeCount > 0 && (
        <span style={{
          fontSize: '10px', fontWeight: 700,
          color: 'var(--color-text-muted)',
          padding: '2px 7px',
          background: 'var(--bg-tertiary)',
          borderRadius: '999px',
          marginRight: '2px',
        }}>
          {nodeCount} tables
        </span>
      )}

      {/* Search shortcut */}
      <button
        onClick={() => setShowGlobalSearchModal(true)}
        style={{ ...pillStyle(false), gap: '5px' }}
        title="Search tables (Cmd+K)"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Search
      </button>

      <Divider />

      {/* Hide Temp toggle */}
      <button
        onClick={() => setLineageHideTemp(!lineageHideTemp)}
        style={pillStyle(lineageHideTemp)}
        title="Hide temporary tables (tmp_, temp_, wrk_)"
      >
        {lineageHideTemp && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
        Hide Temp
      </button>

      {/* Hide Archive toggle */}
      <button
        onClick={() => setLineageHideArchive(!lineageHideArchive)}
        style={pillStyle(lineageHideArchive)}
        title="Hide archive tables (_arch, _hist, _log, _bkp)"
      >
        {lineageHideArchive && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
        Hide Archive
      </button>

      {/* Schema prefix filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '2px' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        <input
          value={schemaInput}
          onChange={e => setSchemaInput(e.target.value)}
          onBlur={() => setLineageSchemaFilter(schemaInput.trim())}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setLineageSchemaFilter(schemaInput.trim());
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="prefix (e.g. ext_)"
          style={{
            padding: '3px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            background: schemaInput.trim() ? 'rgba(56,189,248,0.1)' : 'var(--bg-tertiary)',
            border: `1px solid ${schemaInput.trim() ? 'rgba(56,189,248,0.4)' : 'var(--color-border)'}`,
            color: 'var(--color-text-primary)',
            width: '120px',
            outline: 'none',
            transition: 'all 0.15s',
          }}
        />
        {schemaInput.trim() && (
          <button
            onClick={() => { setSchemaInput(''); setLineageSchemaFilter(''); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', padding: '0 2px', fontSize: '13px', lineHeight: '1'
            }}
            title="Clear prefix filter"
          >
            ✕
          </button>
        )}
      </div>

      <Divider />

      {/* Focus Mode */}
      {isFocusMode ? (
        <button
          onClick={onExitFocus}
          style={pillStyle(true, true)}
          title="Exit Focus Mode — restore all nodes"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Exit Focus
        </button>
      ) : (
        <button
          onClick={onFocusMode}
          disabled={!hasSelection}
          style={{
            ...pillStyle(false),
            opacity: hasSelection ? 1 : 0.4,
            cursor: hasSelection ? 'pointer' : 'not-allowed',
          }}
          title={hasSelection
            ? 'Focus: show only 2-hop neighbors of selected table'
            : 'Select a table node first to activate Focus Mode'}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
          Focus Mode
        </button>
      )}
    </div>
  );
};
