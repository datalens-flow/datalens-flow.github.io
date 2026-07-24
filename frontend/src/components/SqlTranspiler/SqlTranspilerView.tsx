import React, { useState, useRef, useEffect } from 'react';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { useSchemaStore } from '../../store/useSchemaStore';
import { useToastStore } from '../../store/useToastStore';
import { transpileSql, SqlDialect, DIALECT_LABELS, TranspileResult } from '../../utils/transpiler/sqlTranspilerEngine';
import { MIGRATION_TEMPLATES } from '../../utils/transpiler/transpilerTemplates';
import { lintSqlCompatibility, LinterResult } from '../../utils/transpiler/sqlLinterEngine';
import './SqlTranspilerView.css';

const darkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#38bdf8', fontWeight: 'bold' },
  { tag: t.string, color: '#f43f5e' },
  { tag: t.number, color: '#fb923c' },
  { tag: t.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.definition(t.name), color: '#a855f7' },
  { tag: t.standard(t.name), color: '#38bdf8' },
  { tag: t.name, color: '#f8fafc' },
]);

const lightHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#0284c7', fontWeight: 'bold' },
  { tag: t.string, color: '#e11d48' },
  { tag: t.number, color: '#ea580c' },
  { tag: t.comment, color: '#94a3b8', fontStyle: 'italic' },
  { tag: t.definition(t.name), color: '#7c3aed' },
  { tag: t.standard(t.name), color: '#0284c7' },
  { tag: t.name, color: '#0f172a' },
]);

const SAMPLE_ORACLE_SQL = `-- Sample Oracle PL/SQL Script for Transpilation
CREATE TABLE ext_customer_orders (
  order_id NUMBER(10),
  customer_name VARCHAR2(100),
  order_amount NUMBER(12,2),
  created_date DATE DEFAULT SYSDATE
);

INSERT INTO ext_customer_orders (order_id, customer_name, order_amount)
VALUES (101, NVL('John Doe', 'Unknown'), 1500.50);

SELECT order_id, NVL(customer_name, 'N/A') AS cust_name, order_amount
FROM ext_customer_orders
WHERE created_date >= SYSDATE - 30;`;

export const SqlTranspilerView: React.FC = () => {
  const { theme } = useSchemaStore();
  const [sourceDialect, setSourceDialect] = useState<SqlDialect>('oracle');
  const [targetDialect, setTargetDialect] = useState<SqlDialect>('postgres');
  const [sourceSql, setSourceSql] = useState<string>(SAMPLE_ORACLE_SQL);
  const [targetSql, setTargetSql] = useState<string>('');
  const [transpileLog, setTranspileLog] = useState<string[]>([]);
  const [changesCount, setChangesCount] = useState<number>(0);

  const leftEditorRef = useRef<HTMLDivElement>(null);
  const rightEditorRef = useRef<HTMLDivElement>(null);
  const leftViewRef = useRef<EditorView | null>(null);
  const rightViewRef = useRef<EditorView | null>(null);

  // Initialize Left Editor (Source SQL)
  useEffect(() => {
    if (!leftEditorRef.current) return;
    leftEditorRef.current.innerHTML = '';

    const startState = EditorState.create({
      doc: sourceSql,
      extensions: [
        lineNumbers(),
        sqlLang(),
        syntaxHighlighting(theme === 'dark' ? darkHighlightStyle : lightHighlightStyle),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setSourceSql(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: leftEditorRef.current,
    });

    leftViewRef.current = view;
    return () => view.destroy();
  }, [theme]);

  // Initialize Right Editor (Target Transpiled SQL)
  useEffect(() => {
    if (!rightEditorRef.current) return;
    rightEditorRef.current.innerHTML = '';

    const startState = EditorState.create({
      doc: targetSql,
      extensions: [
        lineNumbers(),
        sqlLang(),
        syntaxHighlighting(theme === 'dark' ? darkHighlightStyle : lightHighlightStyle),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setTargetSql(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: rightEditorRef.current,
    });

    rightViewRef.current = view;
    return () => view.destroy();
  }, [theme]);

  // Update Right Editor doc when targetSql changes programmatically
  const setRightEditorDoc = (newDoc: string) => {
    setTargetSql(newDoc);
    if (rightViewRef.current) {
      rightViewRef.current.dispatch({
        changes: { from: 0, to: rightViewRef.current.state.doc.length, insert: newDoc }
      });
    }
  };

  const handleTranspile = () => {
    const res: TranspileResult = transpileSql(sourceSql, sourceDialect, targetDialect);
    setRightEditorDoc(res.convertedSql);
    setTranspileLog(res.transformationLog);
    setChangesCount(res.changesCount);

    if (res.changesCount > 0) {
      useToastStore.getState().addToast({ type: 'success', message: `Transpiled SQL successfully with ${res.changesCount} dialect transformations!` });
    } else {
      useToastStore.getState().addToast({ type: 'info', message: 'SQL transpiled (no dialect transformations required).' });
    }
  };

  // Run transpilation when sourceDialect or targetDialect changes
  useEffect(() => {
    if (sourceSql.trim()) {
      const res: TranspileResult = transpileSql(sourceSql, sourceDialect, targetDialect);
      setRightEditorDoc(res.convertedSql);
      setTranspileLog(res.transformationLog);
      setChangesCount(res.changesCount);
    }
  }, [sourceDialect, targetDialect]);

  const handleCopyConverted = () => {
    if (!targetSql.trim()) return;
    navigator.clipboard.writeText(targetSql);
    useToastStore.getState().addToast({ type: 'success', message: 'Converted SQL copied to clipboard!' });
  };

  const handleDownloadConverted = () => {
    if (!targetSql.trim()) return;
    const blob = new Blob([targetSql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transpiled-${targetDialect}.sql`;
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  const handleLoadSample = () => {
    setSourceSql(SAMPLE_ORACLE_SQL);
    if (leftViewRef.current) {
      leftViewRef.current.dispatch({
        changes: { from: 0, to: leftViewRef.current.state.doc.length, insert: SAMPLE_ORACLE_SQL }
      });
    }
    setSourceDialect('oracle');
    setTargetDialect('postgres');
  };

  const handleSelectTemplate = (tplId: string) => {
    const tpl = MIGRATION_TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;
    setSourceSql(tpl.sql);
    if (leftViewRef.current) {
      leftViewRef.current.dispatch({
        changes: { from: 0, to: leftViewRef.current.state.doc.length, insert: tpl.sql }
      });
    }
    setSourceDialect(tpl.sourceDialect);
    setTargetDialect(tpl.targetDialect);
  };

  const linterResult: LinterResult = lintSqlCompatibility(sourceSql, sourceDialect, targetDialect);

  return (
    <div className="transpiler-container">
      {/* Header Controls Bar */}
      <div className="transpiler-toolbar glass-panel">
        <div className="transpiler-dialect-selectors">
          <div className="dialect-select-group">
            <span className="dialect-label">SOURCE DIALECT (BEFORE)</span>
            <select 
              value={sourceDialect} 
              onChange={e => setSourceDialect(e.target.value as SqlDialect)}
              className="transpiler-select"
            >
              {(Object.keys(DIALECT_LABELS) as SqlDialect[]).map(d => (
                <option key={d} value={d}>{DIALECT_LABELS[d]}</option>
              ))}
            </select>
          </div>

          <div className="transpiler-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>

          <div className="dialect-select-group">
            <span className="dialect-label">TARGET DIALECT (AFTER)</span>
            <select 
              value={targetDialect} 
              onChange={e => setTargetDialect(e.target.value as SqlDialect)}
              className="transpiler-select"
            >
              {(Object.keys(DIALECT_LABELS) as SqlDialect[]).map(d => (
                <option key={d} value={d}>{DIALECT_LABELS[d]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="transpiler-actions">
          {/* Migration Presets Dropdown */}
          <select 
            onChange={e => handleSelectTemplate(e.target.value)}
            className="transpiler-select"
            defaultValue=""
            style={{ borderColor: 'var(--color-indigo, #6366f1)', minWidth: '180px' }}
          >
            <option value="" disabled>📚 Migration Presets...</option>
            {MIGRATION_TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>

          <button className="btn btn-secondary" onClick={handleLoadSample} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Sample SQL
          </button>

          <button className="btn btn-primary" onClick={handleTranspile} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Transpile SQL
          </button>

          <button className="btn btn-secondary" onClick={handleCopyConverted} disabled={!targetSql.trim()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Output
          </button>

          <button className="btn btn-secondary" onClick={handleDownloadConverted} disabled={!targetSql.trim()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download .sql
          </button>
        </div>
      </div>

      {/* Side-by-Side Editors Grid */}
      <div className="transpiler-editors-grid">
        {/* Left Editor */}
        <div className="transpiler-editor-panel glass-panel">
          <div className="editor-panel-header">
            <span className="panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Original SQL ({DIALECT_LABELS[sourceDialect]})
            </span>
            <span className="panel-badge source-badge">SOURCE</span>
          </div>
          <div className="editor-cm-wrapper" ref={leftEditorRef} />
        </div>

        {/* Right Editor */}
        <div className="transpiler-editor-panel glass-panel">
          <div className="editor-panel-header">
            <span className="panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Transpiled Target SQL ({DIALECT_LABELS[targetDialect]})
            </span>
            <span className="panel-badge target-badge">
              {changesCount > 0 ? `${changesCount} TRANSFORMATIONS` : 'READY'}
            </span>
          </div>
          <div className="editor-cm-wrapper" ref={rightEditorRef} />
        </div>
      </div>

      {/* Syntax & Dialect Compatibility Linter Warning Banner */}
      {linterResult.issues.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(234, 179, 8, 0.08)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '8px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '12px',
          color: '#fef08a'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontWeight: 'bold' }}>Dialect Linter Score: {linterResult.compatibilityScore}%</span>
          <div style={{ flex: 1, display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {linterResult.issues.map((issue, idx) => (
              <span key={idx} style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                Line {issue.line}: {issue.message}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Transformation Log Panel */}
      <div className="transpiler-log-panel glass-panel">
        <div className="log-panel-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
            Dialect Transformation Rules Applied ({transpileLog.length})
          </span>
        </div>
        <div className="log-panel-body">
          {transpileLog.length > 0 ? (
            transpileLog.map((log, i) => (
              <div key={i} className="log-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>{log}</span>
              </div>
            ))
          ) : (
            <div className="log-empty">
              No dialect conversions detected. The source SQL syntax is compatible with the target dialect.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SqlTranspilerView;
