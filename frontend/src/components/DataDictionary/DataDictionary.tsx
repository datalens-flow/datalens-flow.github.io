// @ts-nocheck

import React, { useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';
import { DictionaryTable } from './DictionaryTable';
import './DataDictionary.css';

export const DataDictionary: React.FC = () => {
  const { 
    schema, 
    descriptions, 
    updateDescription,
    tableDescriptions,
    updateTableDescription,
    dataClassifications,
    updateDataClassification,
    tableColors
  } = useSchemaStore();

  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [dictSearch, setDictSearch] = useState('');

  if (!schema || schema.tables.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        No schema parsed yet. Parse DDL code to view the data dictionary.
      </div>
    );
  }

  const toggleTableDesc = (tableId: string) => {
    setExpandedTables(prev => ({ ...prev, [tableId]: !prev[tableId] }));
  };

  const query = dictSearch.toLowerCase().trim();
  const filteredTables = query
    ? schema.tables.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.columns.some(c => c.name.toLowerCase().includes(query))
      )
    : schema.tables;

  return (
    <div className="data-dictionary-container" style={{ padding: '16px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg-primary)', paddingBottom: '8px' }}>
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/>
          </svg>
          <input
            type="text"
            value={dictSearch}
            onChange={(e) => setDictSearch(e.target.value)}
            placeholder="Search tables or columns..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.15s'
            }}
            className="dict-input-focus"
          />
          {dictSearch && (
            <button
              onClick={() => setDictSearch('')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>
            </button>
          )}
        </div>
        {query && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{filteredTables.length} of {schema.tables.length} tables</div>}
      </div>

      {filteredTables.map((table) => {
        const tableDesc = descriptions[table.id] || {};
        const headerColor = tableColors[table.id] || '#6366f1';
        const isExpanded = expandedTables[table.id] ?? false;
        const tableSummary = tableDescriptions[table.id] || '';

        return (
          <DictionaryTable 
            key={table.id}
            table={table}
            tableDesc={tableDesc}
            headerColor={headerColor}
            isExpanded={isExpanded}
            tableSummary={tableSummary}
            toggleTableDesc={toggleTableDesc}
            updateTableDescription={updateTableDescription}
            updateDescription={updateDescription}
            dataClassifications={dataClassifications}
            updateDataClassification={updateDataClassification}
          />
        );
      })}
    </div>
  );
};

export default DataDictionary;
