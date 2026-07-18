import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ColumnSchema } from '../../types/schema';
import { useSchemaStore } from '../../store/useSchemaStore';
import './TableNode.css';

interface TableNodeProps {
  id: string;
  data: {
    name: string;
    columns: ColumnSchema[];
  };
}

export const TableNode: React.FC<TableNodeProps> = ({ id: tableId, data }) => {
  const [editingColName, setEditingColName] = useState<string | null>(null);
  const [tempColName, setTempColName] = useState<string>('');
  const { schema, setSchema } = useSchemaStore();

  const handleDoubleClickColumn = (colName: string) => {
    setEditingColName(colName);
    setTempColName(colName);
  };

  const handleSaveColumnName = (oldName: string) => {
    if (!tempColName.trim() || tempColName === oldName || !schema) {
      setEditingColName(null);
      return;
    }

    // Deep clone and update schema column name
    const updatedTables = schema.tables.map((t) => {
      if (t.id === tableId) {
        return {
          ...t,
          columns: t.columns.map((c) => {
            if (c.name === oldName) {
              return { ...c, name: tempColName.trim() };
            }
            return c;
          })
        };
      }
      return t;
    });

    // Also update relationships referencing this column
    const updatedRels = schema.relationships.map((r) => {
      let from_col = r.from_column;
      let to_col = r.to_column;
      if (r.from_table === tableId && r.from_column === oldName) {
        from_col = tempColName.trim();
      }
      if (r.to_table === tableId && r.to_column === oldName) {
        to_col = tempColName.trim();
      }
      return { ...r, from_column: from_col, to_column: to_col };
    });

    setSchema({
      ...schema,
      tables: updatedTables,
      relationships: updatedRels
    });

    setEditingColName(null);
  };

  return (
    <div className="table-node glass-panel">
      {/* Table Header */}
      <div className="table-node-header">
        <span className="table-icon">📁</span>
        <span className="table-name">{data.name}</span>
      </div>

      {/* Columns Container */}
      <div className="table-node-columns">
        {data.columns.map((col, index) => {
          const colId = `${tableId}_${col.name}`;
          
          return (
            <div 
              key={col.name} 
              className={`column-row ${col.is_pk ? 'pk-row' : ''} ${col.is_fk ? 'fk-row' : ''}`}
              style={{ position: 'relative' }}
            >
              {/* Left Handle for FK/PK connections */}
              <Handle
                type="target"
                position={Position.Left}
                id={`left_${col.name}`}
                style={{ top: '50%', transform: 'translateY(-50%)', left: '-6px', background: '#6366f1' }}
              />

              {/* Column Meta/Keys */}
              <div className="column-meta">
                {col.is_pk && <span className="key-icon pk-icon" title="Primary Key">🔑</span>}
                {col.is_fk && <span className="key-icon fk-icon" title={`Foreign Key to ${col.fk_ref_table}`}>🔗</span>}
                {!col.is_pk && !col.is_fk && <span className="key-placeholder"></span>}
              </div>

              {/* Editable Column Name */}
              {editingColName === col.name ? (
                <input
                  type="text"
                  value={tempColName}
                  onChange={(e) => setTempColName(e.target.value)}
                  onBlur={() => handleSaveColumnName(col.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveColumnName(col.name);
                    if (e.key === 'Escape') setEditingColName(null);
                  }}
                  autoFocus
                  className="column-name-input"
                />
              ) : (
                <span 
                  className="column-name"
                  onDoubleClick={() => handleDoubleClickColumn(col.name)}
                  title="Double click to edit column name"
                >
                  {col.name}
                </span>
              )}

              {/* Column Type */}
              <span className="column-type">{col.type}</span>

              {/* Right Handle for FK/PK connections */}
              <Handle
                type="source"
                position={Position.Right}
                id={`right_${col.name}`}
                style={{ top: '50%', transform: 'translateY(-50%)', right: '-6px', background: '#10b981' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default TableNode;
