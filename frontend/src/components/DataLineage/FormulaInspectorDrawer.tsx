import React from 'react';

export interface FormulaInspectorData {
  sourceTable: string;
  sourceCol: string;
  targetTable: string;
  targetCol: string;
  action: string;
  rawExpr?: string;
  fileOrigin?: string;
}

interface FormulaInspectorDrawerProps {
  data: FormulaInspectorData | null;
  onClose: () => void;
}

export const FormulaInspectorDrawer: React.FC<FormulaInspectorDrawerProps> = ({ data, onClose }) => {
  if (!data) return null;

  const rawExpr = data.rawExpr || `${data.sourceCol}`;
  const isCase = rawExpr.toLowerCase().includes('case ');
  const isFunc = /\b(?:upper|trim|coalesce|round|lower|concat|max|min|sum|avg|count)\b/i.test(rawExpr);
  const exprType = isCase ? 'CONDITIONAL (CASE)' : (isFunc ? 'FUNCTION TRANSFORM' : 'DIRECT MAPPING');

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px',
      backgroundColor: 'var(--bg-secondary, #1e293b)',
      borderLeft: '1px solid var(--color-border, #334155)',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      zIndex: 1500, display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(8px)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--color-border, #334155)',
        backgroundColor: 'var(--bg-tertiary, #0f172a)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary, #f8fafc)' }}>
            Column Formula Inspector
          </h3>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted, #94a3b8)', cursor: 'pointer', fontSize: '18px' }}
        >
          ✖
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Mapping Flow Card */}
        <div style={{
          backgroundColor: 'var(--bg-primary, #090b11)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '8px', padding: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#34d399', display: 'block' }}>SOURCE</span>
            <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{data.sourceTable}</strong>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>.{data.sourceCol}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}>
              {data.action.toUpperCase()}
            </span>
            <div style={{ fontSize: '16px', margin: '4px 0', color: '#38bdf8' }}>➔</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#818cf8', display: 'block' }}>TARGET</span>
            <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{data.targetTable}</strong>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>.{data.targetCol}</div>
          </div>
        </div>

        {/* Expression Type Tag */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted, #94a3b8)', display: 'block', marginBottom: '6px' }}>
            TRANSFORMATION TYPE
          </label>
          <span style={{
            fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px',
            backgroundColor: isCase ? 'rgba(245,158,11,0.15)' : (isFunc ? 'rgba(168,85,247,0.15)' : 'rgba(56,189,248,0.15)'),
            color: isCase ? '#f59e0b' : (isFunc ? '#a855f7' : '#38bdf8'),
            border: `1px solid ${isCase ? 'rgba(245,158,11,0.3)' : (isFunc ? 'rgba(168,85,247,0.3)' : 'rgba(56,189,248,0.3)')}`
          }}>
            {exprType}
          </span>
        </div>

        {/* SQL Expression Code Snippet */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted, #94a3b8)', display: 'block', marginBottom: '6px' }}>
            SQL TRANSFORMATION LOGIC
          </label>
          <pre style={{
            backgroundColor: 'var(--bg-primary, #090b11)',
            border: '1px solid var(--color-border, #334155)',
            borderRadius: '8px', padding: '14px',
            color: '#38bdf8', fontSize: '12px',
            fontFamily: 'var(--font-mono, monospace)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            lineHeight: '1.5', margin: 0
          }}>
            {rawExpr}
          </pre>
        </div>

        {/* File Origin */}
        {data.fileOrigin && (
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted, #94a3b8)', display: 'block', marginBottom: '6px' }}>
              FILE ORIGIN
            </label>
            <div style={{ fontSize: '12px', color: '#cbd5e1', backgroundColor: 'var(--bg-primary, #090b11)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border, #334155)' }}>
              📄 {data.fileOrigin}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
