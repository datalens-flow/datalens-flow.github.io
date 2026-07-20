import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { basicSetup } from 'codemirror';
import { syntaxHighlighting } from '@codemirror/language';
import { darkHighlightStyle, lightHighlightStyle } from './codeMirrorStyles';
import { useSchemaStore } from '../../store/useSchemaStore';

export const useSqlEditor = (defaultSql: string, isVisible: boolean = true) => {
  const { theme, procedureSql, setProcedureSql } = useSchemaStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Initialize store if empty
  useEffect(() => {
    if (!procedureSql) {
      setProcedureSql(defaultSql);
    }
  }, []);

  useEffect(() => {
    if (!editorRef.current || !isVisible) return;

    const selection = viewRef.current?.state.selection;
    const currentDoc = procedureSql || defaultSql;

    const startState = EditorState.create({
      doc: currentDoc,
      extensions: [
        basicSetup,
        sqlLang(),
        keymap.of(defaultKeymap),
        syntaxHighlighting(theme === 'dark' ? darkHighlightStyle : lightHighlightStyle),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setProcedureSql(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': { height: '100%', minHeight: '300px', flex: 1, backgroundColor: 'var(--bg-secondary)', color: 'var(--color-text-primary)' },
          '.cm-content': { fontFamily: 'var(--font-mono)', fontSize: '13px' },
          '.cm-gutters': { backgroundColor: 'var(--bg-tertiary)', color: 'var(--color-text-muted)', borderRight: '1px solid var(--color-border)' },
          '.cm-cursor': { borderLeftColor: 'var(--color-indigo)' },
          '.cm-scroller': { overflow: 'auto' }
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
  }, [theme, isVisible]); // Do NOT put procedureSql in dependency array or it recreates editor every keystroke

  // Sync external changes (e.g. loading a project) into the editor
  useEffect(() => {
    if (viewRef.current && procedureSql !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: procedureSql }
      });
    }
  }, [procedureSql]);

  return { procedureSql, setProcedureSql, editorRef, viewRef };
};
