import React from 'react';

interface LineageEmptyStateProps {
  onFocusEditor: () => void;
  onImport: () => void;
}

export const LineageEmptyState: React.FC<LineageEmptyStateProps> = ({ onFocusEditor, onImport }) => {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 5,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      gap: '20px',
      fontFamily: 'var(--font-sans, sans-serif)'
    }}>
      {/* Icon + Title */}
      <div style={{ textAlign: 'center' }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.2" style={{ marginBottom: '12px', filter: 'drop-shadow(0 0 12px rgba(56,189,248,0.4))' }}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
          Data Lineage
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: '460px', lineHeight: 1.6 }}>
          Paste a stored procedure or import a .sql file to visualize your data pipeline.
        </p>
      </div>

      {/* 2 CTAs */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onFocusEditor}
          style={{
            padding: '10px 22px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
            border: 'none', color: '#fff', fontWeight: 700,
            fontSize: '13px', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(56,189,248,0.35)',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(56,189,248,0.45)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(56,189,248,0.35)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          Paste SQL
        </button>
        <button
          onClick={onImport}
          style={{
            padding: '10px 22px', borderRadius: '8px',
            background: 'var(--bg-secondary)', border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)', fontWeight: 600,
            fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'background 0.15s, border-color 0.15s'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-tertiary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-secondary)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Import .sql File
        </button>
      </div>
    </div>
  );
};
