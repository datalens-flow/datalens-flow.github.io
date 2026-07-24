import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { basicSetup } from 'codemirror';
import { syntaxHighlighting } from '@codemirror/language';
import { useSchemaStore } from '../../store/useSchemaStore';
import { useToastStore } from '../../store/useToastStore';
import { parseSql } from '../../api/client';
import { darkHighlightStyle, lightHighlightStyle } from './constants';
import { SqlEditorHeader } from './SqlEditorHeader';
import './SqlEditor.css';

import { createSqlAutocompletion } from '../../utils/sqlAutocompletion';
import { analyzeSqlQuality, SqlAnalyzerReport } from '../../utils/sqlAnalyzerEngine';

export const SqlEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { 
    sql, 
    setSql, 
    dialect, 
    theme,
    schema,
    setSchema,
    setOriginalSchema,
    clearRenameEvents,
    setLoading,
    setError
  } = useSchemaStore();

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

  useEffect(() => {
    if (!editorRef.current) return;

    const selection = viewRef.current?.state.selection;

    const startState = EditorState.create({
      doc: sql,
      extensions: [
        basicSetup,
        sqlLang(),
        createSqlAutocompletion(schema),
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
  }, [theme, schema]);

  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const handleUpdateEditor = (newSql: string) => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: newSql }
      });
    }
  };

  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== sql) {
      handleUpdateEditor(sql);
    }
  }, [sql]);

  const analyzerReport: SqlAnalyzerReport = analyzeSqlQuality(sql);

  return (
    <div className={`sql-editor-container glass-panel ${isFullscreen ? 'fullscreen-editor' : ''}`}>
      <SqlEditorHeader 
        onUpdateEditor={handleUpdateEditor} 
        onParse={handleParse} 
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />
      <div className="editor-workspace" ref={editorRef}></div>

      {/* SQL Quality & Performance Analyzer Panel */}
      {analyzerReport.issues.length > 0 && (
        <div style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--bg-tertiary)',
          fontSize: '11px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
              🛡️ SQL Quality & Performance Health: {analyzerReport.score}%
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {analyzerReport.issues.map((issue, idx) => (
              <div key={idx} style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: issue.severity === 'critical' ? 'rgba(239, 68, 68, 0.15)' : (issue.severity === 'warning' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)'),
                color: issue.severity === 'critical' ? '#f87171' : (issue.severity === 'warning' ? '#fef08a' : '#38bdf8'),
                borderLeft: `3px solid ${issue.severity === 'critical' ? '#ef4444' : (issue.severity === 'warning' ? '#eab308' : '#38bdf8')}`
              }}>
                <div style={{ fontWeight: 'bold' }}>{issue.title}</div>
                <div style={{ fontSize: '10px', opacity: 0.9 }}>{issue.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
