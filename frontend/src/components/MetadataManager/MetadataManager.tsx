import React, { useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';

export const MetadataManager: React.FC = () => {
  const { 
    schema, 
    tableDescriptions, 
    updateTableDescription, 
    dataClassifications, 
    updateDataClassification,
    descriptions,
    updateDescription,
    tableColors
  } = useSchemaStore();

  const [selectedTableId, setSelectedTableId] = useState<string | null>(
    schema && schema.tables.length > 0 ? schema.tables[0].id : null
  );

  if (!schema || schema.tables.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        No tables found. Please parse DDL SQL first to manage metadata.
      </div>
    );
  }

  const activeTableId = selectedTableId || schema.tables[0].id;
  const activeTable = schema.tables.find(t => t.id === activeTableId);

  const classifications = ['Public', 'Internal', 'Confidential', 'PII (Sensitive)'];

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar selection */}
      <div 
        style={{ 
          width: '220px', 
          borderRight: '1px solid var(--color-border)', 
          display: 'flex', 
          flexDirection: 'column', 
          flexShrink: 0,
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>Select Table</strong>
        </div>
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {schema.tables.map(t => {
              const color = tableColors[t.id] || '#6366f1';
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTableId(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: t.id === activeTableId ? 'var(--color-row-hover)' : 'none',
                    border: 'none',
                    borderRadius: '4px',
                    width: '100%',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: '12px', fontWeight: t.id === activeTableId ? 600 : 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Metadata management area */}
      {activeTable && (
        <div style={{ flexGrow: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: tableColors[activeTable.id] || '#6366f1' }} />
              Metadata Management: {activeTable.name.toUpperCase()}
            </h2>
            
            {/* Table level description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Table Summary / Description
              </label>
              <textarea
                value={tableDescriptions[activeTable.id] || ''}
                onChange={(e) => updateTableDescription(activeTable.id, e.target.value)}
                placeholder="Enter summary or purpose of this database table..."
                style={{
                  width: '100%',
                  minHeight: '60px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'var(--font-sans)'
                }}
              />
            </div>
          </div>

          {/* Columns Table Metadata */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
              Column Level Metadata & Governance
            </h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px', color: 'var(--color-text-muted)' }}>Column Name</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: 'var(--color-text-muted)' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: 'var(--color-text-muted)' }}>Data Classification</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: 'var(--color-text-muted)' }}>Business Description</th>
                </tr>
              </thead>
              <tbody>
                {activeTable.columns.map(c => {
                  const currentClass = dataClassifications[activeTable.id]?.[c.name] || 'Public';
                  const comment = descriptions[activeTable.id]?.[c.name] || '';
                  return (
                    <tr key={c.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '10px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {c.name}
                        {c.is_pk && <span style={{ marginLeft: '4px', fontSize: '9px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-amber)', padding: '1px 4px', borderRadius: '3px' }}>PK</span>}
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                        {c.type}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <select
                          value={currentClass}
                          onChange={(e) => updateDataClassification(activeTable.id, c.name, e.target.value)}
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {classifications.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="text"
                          value={comment}
                          onChange={(e) => updateDescription(activeTable.id, c.name, e.target.value)}
                          placeholder="Description..."
                          style={{
                            width: '100%',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default MetadataManager;
