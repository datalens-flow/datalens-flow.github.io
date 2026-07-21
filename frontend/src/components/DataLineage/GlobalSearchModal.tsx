import React, { useState, useEffect, useMemo } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';
import { splitProcedures } from '../../utils/lineage/procedureSplitter';
import { parseLineage } from '../../utils/lineageParser';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onSelectNode }) => {
  const { procedureSql, catalogAnnotations } = useSchemaStore();
  const [query, setQuery] = useState('');

  // Keybindings listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          const { setShowGlobalSearchModal } = useSchemaStore.getState();
          setShowGlobalSearchModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!procedureSql || !query.trim()) return [];

    const q = query.trim().toLowerCase();
    const procs = splitProcedures(procedureSql);
    const results: {
      type: 'table' | 'column' | 'procedure' | 'annotation';
      title: string;
      subtitle: string;
      targetNodeId: string;
    }[] = [];

    const addedKeys = new Set<string>();

    procs.forEach(p => {
      if (p.name.toLowerCase().includes(q)) {
        const key = `proc:${p.name}`;
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          results.push({
            type: 'procedure',
            title: `PROCEDURE: ${p.name}`,
            subtitle: `Found in procedure DDL definition`,
            targetNodeId: p.name
          });
        }
      }

      const lineage = parseLineage(p.sql);
      lineage.flows.forEach(f => {
        if (f.sourceTable.toLowerCase().includes(q)) {
          const key = `tbl:${f.sourceTable}`;
          if (!addedKeys.has(key)) {
            addedKeys.add(key);
            results.push({
              type: 'table',
              title: f.sourceTable,
              subtitle: `Table referenced in ${p.name}`,
              targetNodeId: f.sourceTable
            });
          }
        }

        if (f.targetTable.toLowerCase().includes(q)) {
          const key = `tbl:${f.targetTable}`;
          if (!addedKeys.has(key)) {
            addedKeys.add(key);
            results.push({
              type: 'table',
              title: f.targetTable,
              subtitle: `Target table written by ${p.name}`,
              targetNodeId: f.targetTable
            });
          }
        }

        if (f.sourceCol.toLowerCase().includes(q)) {
          const key = `col:${f.sourceTable}.${f.sourceCol}`;
          if (!addedKeys.has(key)) {
            addedKeys.add(key);
            results.push({
              type: 'column',
              title: `${f.sourceTable}.${f.sourceCol}`,
              subtitle: `Source column mapped in ${p.name}`,
              targetNodeId: f.sourceTable
            });
          }
        }
      });
    });

    // Match catalog annotations
    Object.entries(catalogAnnotations).forEach(([key, ann]) => {
      if (key.includes(q) || ann.description.toLowerCase().includes(q) || ann.tags.some(t => t.toLowerCase().includes(q))) {
        const resKey = `ann:${key}`;
        if (!addedKeys.has(resKey)) {
          addedKeys.add(resKey);
          results.push({
            type: 'annotation',
            title: key,
            subtitle: `Catalog Annotation: ${ann.tags.join(', ')} - ${ann.description}`,
            targetNodeId: key.split('.')[0]
          });
        }
      }
    });

    return results;
  }, [procedureSql, catalogAnnotations, query]);

  if (!isOpen) return null;

  const handleSelect = (nodeId: string) => {
    onSelectNode(nodeId);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2300,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        width: '90%', maxWidth: '650px', maxHeight: '75vh',
        backgroundColor: 'var(--bg-secondary, #1e293b)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '12px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)', overflow: 'hidden'
      }}>
        {/* Search Bar Input */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--color-border, #334155)',
          display: 'flex', alignItems: 'center', gap: '12px',
          backgroundColor: 'var(--bg-tertiary, #0f172a)'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            autoFocus
            placeholder="Type table, column, procedure, or tag to search... (Cmd+K)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1, background: 'none', border: 'none', color: '#f8fafc',
              fontSize: '14px', outline: 'none'
            }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {searchResults.map((res, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(res.targetNodeId)}
              style={{
                padding: '12px 20px', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(56,189,248,0.08)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 'bold', padding: '3px 6px', borderRadius: '4px',
                  backgroundColor: res.type === 'table' ? 'rgba(52,211,153,0.15)' : (res.type === 'column' ? 'rgba(56,189,248,0.15)' : 'rgba(168,85,247,0.15)'),
                  color: res.type === 'table' ? '#34d399' : (res.type === 'column' ? '#38bdf8' : '#a855f7')
                }}>
                  {res.type.toUpperCase()}
                </span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc', fontFamily: 'monospace' }}>
                    {res.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {res.subtitle}
                  </div>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}

          {query.trim() && searchResults.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              No matching tables, columns, or procedures found for "{query}".
            </div>
          )}

          {!query.trim() && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              Start typing to search across all procedures, tables, columns, and tags.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
