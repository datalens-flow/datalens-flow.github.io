import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { basicSetup } from 'codemirror';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
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

const darkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#38bdf8', fontWeight: 'bold' },
  { tag: t.operator, color: '#38bdf8' },
  { tag: t.modifier, color: '#38bdf8' },
  { tag: t.typeName, color: '#34d399' },
  { tag: t.string, color: '#fda4af' },
  { tag: t.number, color: '#f59e0b' },
  { tag: t.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.variableName, color: '#f8fafc' }
]);

const lightHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#1e40af', fontWeight: 'bold' },
  { tag: t.operator, color: '#1e40af' },
  { tag: t.modifier, color: '#1e40af' },
  { tag: t.typeName, color: '#059669' },
  { tag: t.string, color: '#dc2626' },
  { tag: t.number, color: '#b45309' },
  { tag: t.comment, color: '#94a3b8', fontStyle: 'italic' },
  { tag: t.variableName, color: '#1e293b' }
]);

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
    setOutputDialect,
    theme
  } = useSchemaStore();

  // Initialize CodeMirror Editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Get current cursor selection if it exists to restore on theme toggle
    const selection = viewRef.current?.state.selection;

    const startState = EditorState.create({
      doc: sql,
      extensions: [
        basicSetup,
        sqlLang(),
        keymap.of(defaultKeymap),
        syntaxHighlighting(theme === 'dark' ? darkHighlightStyle : lightHighlightStyle),
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
      ],
      selection: selection || undefined
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [theme]);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setSql(content);
        if (viewRef.current) {
          viewRef.current.dispatch({
            changes: { from: 0, to: viewRef.current.state.doc.length, insert: content }
          });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="sql-editor-container glass-panel">
      <div className="sql-editor-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="sql-editor-title">SQL Script Input</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".sql" 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />
            <button 
              onClick={handleImportClick}
              disabled={loading}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              📁 Import SQL
            </button>
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
