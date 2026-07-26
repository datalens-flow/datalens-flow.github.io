import React, { useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';

interface LineageFilterBarProps {
  hasSelection: boolean;
  onFocusMode: () => void;
  isFocusMode: boolean;
  onExitFocus: () => void;
  nodeCount: number;
  onToggleImpact: () => void;
  showImpactPanel: boolean;
  onExportPng: () => void;
  onShare: () => void;
  onOpenDbtWizard: () => void;
}

export const LineageFilterBar: React.FC<LineageFilterBarProps> = ({
  hasSelection, onFocusMode, isFocusMode, onExitFocus, nodeCount,
  onToggleImpact, showImpactPanel, onExportPng, onShare, onOpenDbtWizard
}) => {
  const {
    lineageHideTemp, setLineageHideTemp,
    lineageHideArchive, setLineageHideArchive,
    lineageSchemaFilter, setLineageSchemaFilter,
    setShowGlobalSearchModal
  } = useSchemaStore();

  const [schemaInput, setSchemaInput] = useState(lineageSchemaFilter);

  const pill = (active: boolean, danger = false): React.CSSProperties => ({
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s ease',
    background: danger && active
      ? 'rgba(249,115,22,0.15)'
      : active ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: danger && active
      ? '#f97316'
      : active ? '#38bdf8' : 'var(--color-text-muted)',
    outline: danger && active
      ? '1px solid rgba(249,115,22,0.4)'
      : active ? '1px solid rgba(56,189,248,0.45)' : '1px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap' as const,
  });

  const Sep = () => (
    <div style={{ width: '1px', height: '14px', background: 'var(--color-border)', margin: '0 1px', flexShrink: 0 }} />
  );

  const Dot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
      {label}
    </span>
  );

  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--color-border)',
      borderRadius: '999px',
      padding: '4px 10px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    }}>
      {/* Legend dots — merged from legend bar */}
      <Dot color="#10b981" label="Src" />
      <Dot color="#06b6d4" label="Stg" />
      <Dot color="#818cf8" label="Mrt" />
      <Dot color="#f97316" label="Exp" />

      <Sep />

      {/* Table count */}
      <span style={{
        fontSize: '10px', fontWeight: 600,
        color: 'var(--color-text-muted)',
        padding: '1px 6px',
      }}>
        {nodeCount}
      </span>

      {/* Search */}
      <button
        onClick={() => setShowGlobalSearchModal(true)}
        style={pill(false)}
        title="Search tables"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>

      <Sep />

      {/* Hide Temp */}
      <button onClick={() => setLineageHideTemp(!lineageHideTemp)} style={pill(lineageHideTemp)} title="Hide temp tables">
        {lineageHideTemp && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        Temp
      </button>

      {/* Hide Archive */}
      <button onClick={() => setLineageHideArchive(!lineageHideArchive)} style={pill(lineageHideArchive)} title="Hide archive tables">
        {lineageHideArchive && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        Arch
      </button>

      {/* Schema prefix filter */}
      <input
        value={schemaInput}
        onChange={e => setSchemaInput(e.target.value)}
        onBlur={() => setLineageSchemaFilter(schemaInput.trim())}
        onKeyDown={e => { if (e.key === 'Enter') { setLineageSchemaFilter(schemaInput.trim()); (e.target as HTMLInputElement).blur(); } }}
        placeholder="prefix…"
        style={{
          padding: '3px 7px',
          borderRadius: '999px',
          fontSize: '10px',
          background: schemaInput.trim() ? 'rgba(56,189,248,0.1)' : 'var(--bg-tertiary)',
          border: `1px solid ${schemaInput.trim() ? 'rgba(56,189,248,0.4)' : 'var(--color-border)'}`,
          color: 'var(--color-text-primary)',
          width: '70px',
          outline: 'none',
          transition: 'all 0.15s',
        }}
      />
      {schemaInput.trim() && (
        <button
          onClick={() => { setSchemaInput(''); setLineageSchemaFilter(''); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0', fontSize: '11px', lineHeight: '1' }}
        >✕</button>
      )}

      <Sep />

      {/* Focus Mode */}
      {isFocusMode ? (
        <button onClick={onExitFocus} style={pill(true, true)} title="Exit Focus Mode">✕ Focus</button>
      ) : (
        <button
          onClick={onFocusMode}
          disabled={!hasSelection}
          style={{ ...pill(false), opacity: hasSelection ? 1 : 0.4, cursor: hasSelection ? 'pointer' : 'not-allowed' }}
          title={hasSelection ? 'Focus on 2-hop neighbors' : 'Select a table first'}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          Focus
        </button>
      )}

      {/* Impact Analysis */}
      <button
        onClick={onToggleImpact}
        disabled={!hasSelection}
        style={{ ...pill(showImpactPanel), opacity: hasSelection ? 1 : 0.4, cursor: hasSelection ? 'pointer' : 'not-allowed' }}
        title={hasSelection ? 'Toggle Impact Analysis panel' : 'Select a table first'}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        Impact
      </button>

      <Sep />

      {/* Share Link */}
      <button onClick={onShare} style={pill(false)} title="Copy shareable link">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        Share
      </button>

      {/* 1-Click dbt Project Generator */}
      <button
        onClick={onOpenDbtWizard}
        style={{
          ...pill(true),
          background: 'rgba(249, 115, 22, 0.18)',
          color: '#f97316',
          outline: '1px solid rgba(249, 115, 22, 0.45)',
          fontWeight: 700
        }}
        title="1-Click dbt Project Generator Wizard"
      >
        <span style={{ fontSize: '10px' }}>⚡</span>
        dbt Project
      </button>

      {/* Export PNG */}
      <button onClick={onExportPng} style={pill(false)} title="Export graph as PNG">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        PNG
      </button>
    </div>
  );
};
