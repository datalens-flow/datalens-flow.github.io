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

export const SqlEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { 
    sql, 
    setSql, 
    dialect, 
    theme,
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

  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const handleUpdateEditor = (newSql: string) => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: newSql }
      });
    }
  };

  return (
    <div className={`sql-editor-container glass-panel ${isFullscreen ? 'fullscreen-editor' : ''}`}>
      <SqlEditorHeader 
        onUpdateEditor={handleUpdateEditor} 
        onParse={handleParse} 
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />
      <div className="editor-workspace" ref={editorRef}></div>
    </div>
  );
};
