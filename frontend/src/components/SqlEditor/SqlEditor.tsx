import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { basicSetup } from 'codemirror';
import { useSchemaStore } from '../../store/useSchemaStore';
import { parseSql } from '../../api/client';
import './SqlEditor.css';

const DIALECTS = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'mssql', label: 'SQL Server' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'sqlite', label: 'SQLite' }
];

export const SqlEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { 
    sql, 
    setSql, 
    dialect, 
    setDialect, 
    setSchema, 
    setOriginalSchema,
    clearRenameEvents,
    setLoading, 
    setError, 
    loading,
    outputDialect,
    setOutputDialect
  } = useSchemaStore();

  // Initialize CodeMirror Editor
  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: sql,
      extensions: [
        basicSetup,
        sqlLang(),
        keymap.of(defaultKeymap),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setSql(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': { height: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--color-text-primary)' },
          '.cm-content': { fontFamily: 'var(--font-mono)', fontSize: '13px' },
          '.cm-gutters': { backgroundColor: 'var(--bg-tertiary)', color: 'var(--color-text-muted)', borderRight: '1px solid var(--color-border)' },
          '.cm-cursor': { borderLeftColor: 'var(--color-indigo)' }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  const handleParse = async () => {
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseSql(sql, dialect);
      if (parsed.warnings && parsed.warnings.length > 0) {
        setError(parsed.warnings.join('\n'));
      }
      setSchema(parsed);
      setOriginalSchema(JSON.parse(JSON.stringify(parsed)));
      clearRenameEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to parse SQL DDL');
      setSchema(null);
      setOriginalSchema(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    const sampleSql = `CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  order_date DATE
);`;
    setSql(sampleSql);
    if (viewRef.current) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: sampleSql }
      });
    }
  };

  return (
    <div className="sql-editor-container glass-panel">
      <div className="sql-editor-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="sql-editor-title">SQL Script Input</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={handleLoadSample}
              disabled={loading}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              💡 Sample DDL
            </button>
            <button 
              onClick={handleParse} 
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              {loading ? 'Parsing...' : 'Parse DDL'}
            </button>
          </div>
        </div>
        <div className="sql-editor-controls" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Input:</span>
            <select 
              value={dialect} 
              onChange={(e) => setDialect(e.target.value)}
              className="dialect-select"
            >
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Output:</span>
            <select 
              value={outputDialect} 
              onChange={(e) => setOutputDialect(e.target.value)}
              className="dialect-select"
            >
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="editor-workspace" ref={editorRef}></div>
    </div>
  );
};
