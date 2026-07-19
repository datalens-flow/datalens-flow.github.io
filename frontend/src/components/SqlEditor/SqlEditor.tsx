import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { basicSetup } from 'codemirror';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { useSchemaStore } from '../../store/useSchemaStore';
import { useToastStore } from '../../store/useToastStore';
import { parseSql, exportSql } from '../../api/client';
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
  { tag: t.standard(t.name), color: '#38bdf8', fontWeight: 'bold' }, // SQL builtins: FOREIGN KEY, PRIMARY, REFERENCES, NOT NULL, etc.
  { tag: t.typeName, color: '#34d399' },
  { tag: t.string, color: '#fda4af' },
  { tag: t.special(t.string), color: '#fda4af' },
  { tag: t.number, color: '#f59e0b' },
  { tag: t.bool, color: '#f59e0b' },
  { tag: t.null, color: '#94a3b8' },
  { tag: t.name, color: '#f8fafc' },
  { tag: t.special(t.name), color: '#67e8f9' },
  { tag: t.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.lineComment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.blockComment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.variableName, color: '#f8fafc' },
  { tag: t.punctuation, color: '#94a3b8' }
]);

const lightHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#1e40af', fontWeight: 'bold' },
  { tag: t.operator, color: '#1e40af' },
  { tag: t.modifier, color: '#1e40af' },
  { tag: t.standard(t.name), color: '#1e40af', fontWeight: 'bold' },
  { tag: t.typeName, color: '#059669' },
  { tag: t.string, color: '#dc2626' },
  { tag: t.special(t.string), color: '#dc2626' },
  { tag: t.number, color: '#b45309' },
  { tag: t.bool, color: '#b45309' },
  { tag: t.null, color: '#64748b' },
  { tag: t.name, color: '#1e293b' },
  { tag: t.special(t.name), color: '#0891b2' },
  { tag: t.comment, color: '#94a3b8', fontStyle: 'italic' },
  { tag: t.lineComment, color: '#94a3b8', fontStyle: 'italic' },
  { tag: t.blockComment, color: '#94a3b8', fontStyle: 'italic' },
  { tag: t.variableName, color: '#1e293b' },
  { tag: t.punctuation, color: '#64748b' }
]);

export const SqlEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { 
    sql, 
    setSql, 
    dialect, 
    setDialect, 
    schema,
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
        keymap.of([{
          key: 'Mod-Enter',
          run: () => {
            handleParseRef.current();
            return true;
          }
        }]),
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
      const tableCount = parsed.tables?.length || 0;
      const colCount = parsed.tables?.reduce((sum: number, t: any) => sum + (t.columns?.length || 0), 0) || 0;
      useToastStore.getState().addToast({ type: 'success', message: `Parsed ${tableCount} tables, ${colCount} columns` });
    } catch (err: any) {
      setError(err.message || 'Failed to parse SQL DDL');
      setSchema(null);
      setOriginalSchema(null);
      useToastStore.getState().addToast({ type: 'error', message: 'Parse failed — check error panel' });
    } finally {
      setLoading(false);
    }
  };

  const handleParseRef = useRef(handleParse);
  handleParseRef.current = handleParse;

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    
    try {
      const contents = await Promise.all(
        fileList.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string || '');
            reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
            reader.readAsText(file);
          });
        })
      );

      const combinedContent = contents.join('\n\n-- ==========================================\n-- IMPORTED: FILE\n-- ==========================================\n\n');
      
      if (combinedContent) {
        setSql(combinedContent);
        if (viewRef.current) {
          viewRef.current.dispatch({
            changes: { from: 0, to: viewRef.current.state.doc.length, insert: combinedContent }
          });
        }
      }
    } catch (err: any) {
      useToastStore.getState().addToast({ type: 'error', message: err.message || 'Failed to read file' });
    }
    
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
              multiple
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
        <div className="sql-editor-controls" style={{ flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
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

          {/* Data Type Converter quick action button */}
          <button
            onClick={async () => {
              if (!schema) {
                useToastStore.getState().addToast({ type: 'warning', message: 'Please parse your DDL schema first before converting types.' });
                return;
              }
              setLoading(true);
              try {
                // Map the current column types to the selected outputDialect
                const mapType = (type: string, targetDialect: string): string => {
                  let t = type.toUpperCase().trim();
                  if (targetDialect === 'oracle') {
                    if (t.startsWith('VARCHAR')) return t.replace('VARCHAR', 'VARCHAR2');
                    if (t === 'INT' || t === 'INTEGER') return 'NUMBER(10)';
                    if (t === 'BOOLEAN') return 'NUMBER(1)';
                  } else if (targetDialect === 'mysql') {
                    if (t === 'BOOLEAN') return 'TINYINT(1)';
                  } else if (targetDialect === 'sqlite') {
                    if (t.startsWith('VARCHAR') || t === 'TEXT') return 'TEXT';
                    if (t.startsWith('DECIMAL') || t === 'FLOAT' || t === 'DOUBLE') return 'REAL';
                  } else if (targetDialect === 'postgres') {
                    if (t.startsWith('VARCHAR2')) return t.replace('VARCHAR2', 'VARCHAR');
                    if (t === 'NUMBER(10)') return 'INT';
                    if (t === 'NUMBER(1)') return 'BOOLEAN';
                    if (t === 'TINYINT(1)') return 'BOOLEAN';
                  }
                  return t;
                };

                const convertedTables = schema.tables.map((table: any) => ({
                  ...table,
                  columns: table.columns.map((col: any) => ({
                    ...col,
                    type: mapType(col.type, outputDialect)
                  }))
                }));

                const convertedSchema = { ...schema, tables: convertedTables };
                
                // Export converted SQL
                const blob = await exportSql(convertedSchema, outputDialect);
                const sqlText = await blob.text();
                
                // Update store state
                setSql(sqlText);
                setSchema(convertedSchema);
                setDialect(outputDialect); // input dialect matches new schema
                
                // Update CodeMirror editor view
                if (viewRef.current) {
                  viewRef.current.dispatch({
                    changes: { from: 0, to: viewRef.current.state.doc.length, insert: sqlText }
                  });
                }
                
                useToastStore.getState().addToast({ type: 'success', message: `Successfully converted types to ${outputDialect.toUpperCase()}` });
              } catch (err: any) {
                useToastStore.getState().addToast({ type: 'error', message: err.message || 'Failed to convert data types' });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.08)', border: '1px dashed rgba(99, 102, 241, 0.25)', color: 'var(--color-indigo)' }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3 3-3 3M4 14l-3-3 3-3M2 11h11M14 5H3"/>
            </svg>
            Convert Data Types (ข้าม Dialect)
          </button>
        </div>
      </div>
      <div className="editor-workspace" ref={editorRef}></div>
    </div>
  );
};
