import React, { useState, useMemo } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';
import { computeLineageDiff } from '../../utils/lineage/lineageDiffEngine';

export const LineageDiffModal: React.FC = () => {
  const { 
    showDiffModal, 
    setShowDiffModal, 
    procedureSql, 
    setProcedureSql 
  } = useSchemaStore();

  const [sqlA, setSqlA] = useState<string>(procedureSql || '');
  const [sqlB, setSqlB] = useState<string>('');

  const diffResult = useMemo(() => {
    if (!sqlA || !sqlB) return null;
    return computeLineageDiff(sqlA, sqlB);
  }, [sqlA, sqlB]);

  if (!showDiffModal) return null;

  const handleApplyVersionB = () => {
    if (sqlB.trim()) {
      setProcedureSql(sqlB);
      setShowDiffModal(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        width: '92%', maxWidth: '1150px', height: '88vh',
        backgroundColor: 'var(--bg-secondary, #1e293b)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '12px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--color-border, #334155)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'var(--bg-tertiary, #0f172a)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
            </svg>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--color-text-primary, #f8fafc)' }}>
                Data Lineage Version Diff & Impact Analysis
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #94a3b8)' }}>
                Compare original SQL (Version A) vs modified SQL (Version B) to detect added/removed flows
              </span>
            </div>
          </div>
          <button 
            onClick={() => setShowDiffModal(false)}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted, #94a3b8)', cursor: 'pointer', padding: '4px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Diff Inputs (Version A vs Version B) */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border, #334155)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'var(--bg-primary, #090b11)' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span>VERSION A (ORIGINAL SQL)</span>
            </label>
            <textarea 
              value={sqlA}
              onChange={e => setSqlA(e.target.value)}
              placeholder="Paste original SQL script..."
              style={{
                width: '100%', height: '140px', padding: '10px', borderRadius: '6px',
                border: '1px solid var(--color-border, #334155)',
                backgroundColor: 'var(--bg-secondary, #1e293b)',
                color: '#f8fafc', fontFamily: 'monospace', fontSize: '11px', resize: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span>VERSION B (MODIFIED SQL)</span>
            </label>
            <textarea 
              value={sqlB}
              onChange={e => setSqlB(e.target.value)}
              placeholder="Paste modified SQL script to compare..."
              style={{
                width: '100%', height: '140px', padding: '10px', borderRadius: '6px',
                border: '1px solid var(--color-border, #334155)',
                backgroundColor: 'var(--bg-secondary, #1e293b)',
                color: '#f8fafc', fontFamily: 'monospace', fontSize: '11px', resize: 'none'
              }}
            />
          </div>
        </div>

        {/* Impact Summary & Detailed Diff List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {diffResult ? (
            <>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>+{diffResult.summary.addedCount}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Newly Added Lineage Flows</div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>-{diffResult.summary.removedCount}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Removed Lineage Flows</div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc' }}>{diffResult.summary.unchangedCount}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Unchanged Lineage Flows</div>
                  </div>
                </div>
              </div>

              {/* Added Flows Table */}
              {diffResult.addedFlows.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    Added Lineage Flows ({diffResult.addedFlows.length})
                  </h4>
                  <div style={{ border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-primary, #090b11)' }}>
                    {diffResult.addedFlows.map((f, i) => (
                      <div key={i} style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong style={{ color: '#10b981' }}>{f.sourceTable}</strong>.{f.sourceCol} ➔ <strong style={{ color: '#38bdf8' }}>{f.targetTable}</strong>.{f.targetCol}</span>
                        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>ADDED</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Removed Flows Table */}
              {diffResult.removedFlows.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    Removed Lineage Flows ({diffResult.removedFlows.length})
                  </h4>
                  <div style={{ border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-primary, #090b11)' }}>
                    {diffResult.removedFlows.map((f, i) => (
                      <div key={i} style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong style={{ color: '#ef4444' }}>{f.sourceTable}</strong>.{f.sourceCol} ➔ <strong style={{ color: '#38bdf8' }}>{f.targetTable}</strong>.{f.targetCol}</span>
                        <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>REMOVED</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted, #94a3b8)', fontSize: '12px' }}>
              Paste Version B SQL script above to automatically compute data lineage diff and impact summary.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border, #334155)', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: 'var(--bg-tertiary, #0f172a)' }}>
          <button className="btn btn-secondary" onClick={() => setShowDiffModal(false)}>Close</button>
          <button className="btn btn-primary" disabled={!sqlB.trim()} onClick={handleApplyVersionB} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            Apply Version B to Canvas
          </button>
        </div>
      </div>
    </div>
  );
};
