import React, { useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';
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

  if (!schema || schema.tables.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        No schema parsed yet. Parse DDL code to view the data dictionary.
      </div>
    );
  }

  const classifications = ['Public', 'Internal', 'Confidential', 'PII (Sensitive)'];

  const getClassBadgeColor = (cls: string) => {
    switch (cls) {
      case 'Public': return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' };
      case 'Internal': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
      case 'Confidential': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
      case 'PII (Sensitive)': return { bg: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' };
      default: return { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' };
    }
  };

  const toggleTableDesc = (tableId: string) => {
    setExpandedTables(prev => ({ ...prev, [tableId]: !prev[tableId] }));
  };

  return (
    <div className="data-dictionary-container" style={{ padding: '16px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {schema.tables.map((table) => {
        const tableDesc = descriptions[table.id] || {};
        const headerColor = tableColors[table.id] || '#6366f1';
        const isExpanded = expandedTables[table.id] ?? false;
        const tableSummary = tableDescriptions[table.id] || '';

        return (
          <div 
            key={table.id} 
            className="dictionary-table-block" 
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '8px', 
              border: '1px solid var(--color-border)', 
              overflow: 'hidden' 
            }}
          >
            {/* Table title header */}
            <div 
              style={{ 
                padding: '12px 16px', 
                backgroundColor: `${headerColor}12`,
                borderBottom: '1px solid var(--color-border)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: '8px' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: headerColor, flexShrink: 0 }} />
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  {table.name}
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>
                    ({table.columns.length} columns)
                  </span>
                </h3>
              </div>
              {/* Toggle table description */}
              <button
                onClick={() => toggleTableDesc(table.id)}
                title="Table description"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: tableSummary ? headerColor : 'var(--color-text-muted)',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  opacity: 0.8,
                  transition: 'opacity 0.15s'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 2l2 2-8 8H4v-2l8-8z"/>
                  <path d="M2 14h12"/>
                </svg>
                {isExpanded ? 'Hide' : 'Description'}
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M2.5 3.5L5 6.5 7.5 3.5"/>
                </svg>
              </button>
            </div>

            {/* Collapsible table description */}
            {isExpanded && (
              <div style={{ 
                padding: '10px 16px', 
                borderBottom: '1px solid var(--color-border)', 
                backgroundColor: 'var(--bg-primary)' 
              }}>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>
                  Table Summary / Description
                </label>
                <textarea
                  value={tableSummary}
                  onChange={(e) => updateTableDescription(table.id, e.target.value)}
                  placeholder="Enter summary or purpose of this table..."
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'var(--font-sans)',
                    transition: 'border-color 0.15s'
                  }}
                  className="dict-input-focus"
                />
              </div>
            )}

            {/* Columns definition list */}
            <div style={{ overflowX: 'auto' }}>
              <table 
                className="dict-html-table" 
                style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  fontSize: '13px', 
                  textAlign: 'left' 
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--bg-primary)' }}>
                    <th style={{ padding: '10px 16px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Column</th>
                    <th style={{ padding: '10px 16px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Type</th>
                    <th style={{ padding: '10px 16px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Nullable</th>
                    <th style={{ padding: '10px 16px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Key</th>
                    <th style={{ padding: '10px 16px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>FK Reference</th>
                    <th style={{ padding: '10px 16px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Classification</th>
                    <th style={{ padding: '10px 16px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col) => {
                    const keys: string[] = [];
                    if (col.is_pk) keys.push('PK');
                    if (col.is_fk) keys.push('FK');
                    const keyStr = keys.join(', ');

                    const fkRefStr = col.is_fk && col.fk_ref_table 
                      ? `${col.fk_ref_table}.${col.fk_ref_column}` 
                      : '';

                    const currentClass = dataClassifications[table.id]?.[col.name] || 'Public';
                    const classBadge = getClassBadgeColor(currentClass);

                    return (
                      <tr 
                        key={col.name} 
                        style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s' }}
                        className="dict-row-hover"
                      >
                        <td style={{ padding: '10px 16px', fontWeight: '600', fontFamily: 'var(--font-mono)', color: col.is_pk ? 'var(--color-amber)' : 'var(--color-text-primary)' }}>
                          {col.name}
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                          {col.type}
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--color-text-muted)' }}>
                          {col.nullable ? 'Yes' : 'No'}
                        </td>
                        <td style={{ padding: '10px 16px', color: col.is_pk ? 'var(--color-amber)' : 'var(--color-indigo)', fontWeight: '500' }}>
                          {keyStr || '-'}
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: 'var(--color-fk)' }}>
                          {fkRefStr || '-'}
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <select
                            value={currentClass}
                            onChange={(e) => updateDataClassification(table.id, col.name, e.target.value)}
                            style={{
                              backgroundColor: classBadge.bg,
                              color: classBadge.color,
                              border: `1px solid ${classBadge.color}30`,
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {classifications.map(opt => (
                              <option key={opt} value={opt} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--color-text-primary)' }}>{opt}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <input
                            type="text"
                            value={tableDesc[col.name] || col.comment || ''}
                            onChange={(e) => updateDescription(table.id, col.name, e.target.value)}
                            placeholder="Add description..."
                            style={{
                              width: '100%',
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '4px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              outline: 'none',
                              transition: 'border-color 0.15s'
                            }}
                            className="dict-input-focus"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DataDictionary;
