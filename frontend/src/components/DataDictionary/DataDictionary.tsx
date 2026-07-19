import React from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';
import './DataDictionary.css';

export const DataDictionary: React.FC = () => {
  const { schema, descriptions, updateDescription } = useSchemaStore();

  if (!schema || schema.tables.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        No schema parsed yet. Parse DDL code to view the data dictionary.
      </div>
    );
  }

  return (
    <div className="data-dictionary-container" style={{ padding: '16px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {schema.tables.map((table) => {
        const tableDesc = descriptions[table.id] || {};

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
                backgroundColor: 'rgba(99, 102, 241, 0.08)', 
                borderBottom: '1px solid var(--color-border)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}
            >
              <span style={{ fontSize: '14px' }}>📁</span>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {table.name}
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>
                  ({table.columns.length} columns)
                </span>
              </h3>
            </div>

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
                    <th style={{ padding: '10px 16px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Description (Edit Inline)</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col) => {
                    const keys: string[] = [];
                    if (col.is_pk) keys.push('🔑 PK');
                    if (col.is_fk) keys.push('🔗 FK');
                    const keyStr = keys.join(', ');

                    const fkRefStr = col.is_fk && col.fk_ref_table 
                      ? `${col.fk_ref_table}.${col.fk_ref_column}` 
                      : '';

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
                          <input
                            type="text"
                            value={tableDesc[col.name] || col.comment || ''}
                            onChange={(e) => updateDescription(table.id, col.name, e.target.value)}
                            placeholder="Add column description..."
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
