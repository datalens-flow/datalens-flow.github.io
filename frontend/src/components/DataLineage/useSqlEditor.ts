import { useEffect, useState, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { basicSetup } from 'codemirror';
import { syntaxHighlighting } from '@codemirror/language';
import { darkHighlightStyle, lightHighlightStyle } from './codeMirrorStyles';
import { useSchemaStore } from '../../store/useSchemaStore';

export const useSqlEditor = (initialSql: string) => {
  const [procedureSql, setProcedureSql] = useState<string>(initialSql);
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { theme } = useSchemaStore();

  useEffect(() => {
    if (!editorRef.current) return;

    const selection = viewRef.current?.state.selection;

    const startState = EditorState.create({
      doc: procedureSql,
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
  }, [theme]);

  return { procedureSql, setProcedureSql, editorRef, viewRef };
};
