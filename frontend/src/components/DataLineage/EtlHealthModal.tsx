import React, { useMemo } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';
import { auditEtlHealth } from '../../utils/lineage/etlHealthAuditor';

export const EtlHealthModal: React.FC = () => {
  const { 
    showEtlHealthModal, 
    setShowEtlHealthModal, 
    procedureSql, 
    ignoredLineageTables 
  } = useSchemaStore();

  const report = useMemo(() => {
    return auditEtlHealth(procedureSql, ignoredLineageTables);
  }, [procedureSql, ignoredLineageTables]);

  if (!showEtlHealthModal) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '90%', maxWidth: '800px', maxHeight: '80vh',
        backgroundColor: 'var(--bg-secondary, #1e293b)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '12px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--color-border, #334155)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'var(--bg-tertiary, #0f172a)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--color-text-primary, #f8fafc)' }}>
                ETL Code Smells & Health Audit Report
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #94a3b8)' }}>
                Found {report.totalIssues} potential code smells ({report.warningCount} Warnings, {report.infoCount} Info)
              </span>
            </div>
          </div>
          <button 
            onClick={() => setShowEtlHealthModal(false)}
            style={{
              background: 'none', border: 'none', color: 'var(--color-text-muted, #94a3b8)',
              cursor: 'pointer', padding: '4px', fontSize: '18px', display: 'flex', alignItems: 'center'
            }}
          >
            ✖
          </button>
        </div>

        {/* Audit Content List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {report.issues.map(issue => (
            <div 
              key={issue.id}
              style={{
                backgroundColor: 'var(--bg-primary, #090b11)',
                borderLeft: `4px solid ${issue.severity === 'warning' ? '#f59e0b' : '#38bdf8'}`,
                border: '1px solid var(--color-border, #334155)',
                borderLeftWidth: '4px',
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{issue.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary, #f8fafc)' }}>
                    {issue.title}
                  </h4>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted, #94a3b8)', backgroundColor: 'var(--bg-tertiary, #0f172a)', padding: '2px 8px', borderRadius: '4px' }}>
                  Proc: {issue.procedureName}
                </span>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--color-text-muted, #cbd5e1)', lineHeight: '1.5' }}>
                {issue.description}
              </p>
              <div style={{
                fontSize: '11px', color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.08)',
                padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.2)'
              }}>
                💡 <strong>Recommendation:</strong> {issue.suggestion}
              </div>
            </div>
          ))}

          {report.issues.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#34d399' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>All Clear! No Code Smells Detected.</h4>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted, #94a3b8)' }}>
                Your stored procedure SQL script looks clean, optimized, and free of unreferenced temporary tables.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
