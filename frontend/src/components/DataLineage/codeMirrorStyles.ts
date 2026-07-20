import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export const darkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#38bdf8', fontWeight: 'bold' },
  { tag: t.operator, color: '#38bdf8' },
  { tag: t.modifier, color: '#38bdf8' },
  { tag: t.standard(t.name), color: '#38bdf8', fontWeight: 'bold' },
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

export const lightHighlightStyle = HighlightStyle.define([
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
