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
  // Editing states
  const [editingTableName, setEditingTableName] = useState(false);
  const [tempTableName, setTempTableName] = useState('');
  
  const [editingColName, setEditingColName] = useState<string | null>(null);
  const [tempColName, setTempColName] = useState('');
  
  const [editingColType, setEditingColType] = useState<string | null>(null);
  const [tempColType, setTempColType] = useState('');

  const { 
    updateTableName, 
    updateColumnName,
    updateColumnType,
    addColumn
  } = useSchemaStore();

  // 1. Rename Table Name
  const handleDoubleClickTable = () => {
    setEditingTableName(true);
    setTempTableName(data.name);
  };

  const handleSaveTableName = () => {
    if (tempTableName.trim() && tempTableName.trim() !== data.name) {
      updateTableName(tableId, tempTableName.trim());
    }
    setEditingTableName(false);
  };

  // 2. Rename Column Name
  const handleDoubleClickColumn = (colName: string) => {
    setEditingColName(colName);
    setTempColName(colName);
  };

  const handleSaveColumnName = (oldName: string) => {
    if (tempColName.trim() && tempColName.trim() !== oldName) {
      updateColumnName(tableId, oldName, tempColName.trim());
    }
    setEditingColName(null);
  };

  // 3. Edit Column Type
  const handleDoubleClickType = (colName: string, currentType: string) => {
    setEditingColType(colName);
    setTempColType(currentType);
  };

  const handleSaveColumnType = (colName: string) => {
    if (tempColType.trim()) {
      updateColumnType(tableId, colName, tempColType.trim());
    }
    setEditingColType(null);
  };

  return (
    <div className="table-node glass-panel">
      {/* Table Header */}
      <div className="table-node-header">
        <span className="table-icon">📁</span>
        {editingTableName ? (
          <input
            type="text"
            value={tempTableName}
            onChange={(e) => setTempTableName(e.target.value)}
            onBlur={handleSaveTableName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTableName();
              if (e.key === 'Escape') setEditingTableName(false);
            }}
            autoFocus
            className="table-name-input"
          />
        ) : (
          <span 
            className="table-name"
            onDoubleClick={handleDoubleClickTable}
            title="Double click to edit table name"
          >
            {data.name}
          </span>
        )}
      </div>

      {/* Columns Container */}
      <div className="table-node-columns">
        {data.columns.map((col) => {
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

              {/* Editable Column Type */}
              {editingColType === col.name ? (
                <input
                  type="text"
                  value={tempColType}
                  onChange={(e) => setTempColType(e.target.value)}
                  onBlur={() => handleSaveColumnType(col.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveColumnType(col.name);
                    if (e.key === 'Escape') setEditingColType(null);
                  }}
                  autoFocus
                  className="column-type-input"
                />
              ) : (
                <span 
                  className="column-type"
                  onDoubleClick={() => handleDoubleClickType(col.name, col.type)}
                  title="Double click to edit type"
                >
                  {col.type}
                </span>
              )}

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
        
        {/* Add Column Button */}
        <button 
          className="add-column-btn"
          onClick={() => addColumn(tableId)}
          title="Add Column"
        >
          ➕ Add Column
        </button>
      </div>
    </div>
  );
};
export default TableNode;
