import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { sql as sqlLang } from '@codemirror/lang-sql';
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
    loading 
  } = useSchemaStore();

  // Initialize CodeMirror Editor
  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: sql,
      extensions: [
        sqlLang(),
        keymap.of(defaultKeymap),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setSql(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': { height: '100%', backgroundColor: '#0f172a', color: '#f8fafc' },
          '.cm-content': { fontFamily: 'var(--font-mono)', fontSize: '13px' },
          '.cm-gutters': { backgroundColor: '#090f1a', color: '#64748b', borderRight: '1px solid #1e293b' },
          '.cm-cursor': { borderLeftColor: '#6366f1' }
        }, { dark: true })
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

  return (
    <div className="sql-editor-container glass-panel">
      <div className="sql-editor-header">
        <span className="sql-editor-title">SQL Script Input</span>
        <div className="sql-editor-controls">
          <select 
            value={dialect} 
            onChange={(e) => setDialect(e.target.value)}
            className="dialect-select"
          >
            {DIALECTS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <button 
            onClick={handleParse} 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Parsing...' : 'Parse DDL'}
          </button>
        </div>
      </div>
      <div className="editor-workspace" ref={editorRef}></div>
    </div>
  );
};
