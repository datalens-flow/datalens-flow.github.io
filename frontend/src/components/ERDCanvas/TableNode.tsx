import React, { useState, useRef } from 'react';
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

// SQL name validation — allows letters, digits, underscores; must start with letter or underscore
const isValidSqlName = (name: string): boolean => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

export const TableNode: React.FC<TableNodeProps> = ({ id: tableId, data }) => {
  // Editing states
  const [editingTableName, setEditingTableName] = useState(false);
  const [tempTableName, setTempTableName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  
  const [editingColName, setEditingColName] = useState<string | null>(null);
  const [tempColName, setTempColName] = useState('');
  const [colNameError, setColNameError] = useState<string | null>(null);
  
  const [editingColType, setEditingColType] = useState<string | null>(null);
  const [tempColType, setTempColType] = useState('');

  const [activeCommentCol, setActiveCommentCol] = useState<string | null>(null);

  // Drag reorder state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const { 
    updateTableName, 
    updateColumnName,
    updateColumnType,
    addColumn,
    deleteColumn,
    moveColumn,
    toggleColumnPk,
    toggleColumnNullable,
    descriptions,
    updateDescription,
    deleteTable
  } = useSchemaStore();

  // 1. Rename Table Name with validation
  const handleDoubleClickTable = () => {
    setEditingTableName(true);
    setTempTableName(data.name);
    setNameError(null);
  };

  const handleSaveTableName = () => {
    const trimmed = tempTableName.trim();
    if (!trimmed) {
      setEditingTableName(false);
      setNameError(null);
      return;
    }
    if (!isValidSqlName(trimmed)) {
      setNameError('Letters, digits, _ only');
      return;
    }
    if (trimmed !== data.name) {
      updateTableName(tableId, trimmed);
    }
    setEditingTableName(false);
    setNameError(null);
  };

  // 2. Rename Column Name with validation
  const handleDoubleClickColumn = (colName: string) => {
    setEditingColName(colName);
    setTempColName(colName);
    setColNameError(null);
  };

  const handleSaveColumnName = (oldName: string) => {
    const trimmed = tempColName.trim();
    if (!trimmed) {
      setEditingColName(null);
      setColNameError(null);
      return;
    }
    if (!isValidSqlName(trimmed)) {
      setColNameError('Letters, digits, _ only');
      return;
    }
    // Check for duplicate column names in same table
    if (trimmed !== oldName && data.columns.some(c => c.name === trimmed)) {
      setColNameError('Duplicate name');
      return;
    }
    if (trimmed !== oldName) {
      updateColumnName(tableId, oldName, trimmed);
    }
    setEditingColName(null);
    setColNameError(null);
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

  // 4. Drag reorder handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex !== null && fromIndex !== toIndex) {
      moveColumn(tableId, fromIndex, toIndex);
    }
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="table-node glass-panel">
      {/* Table Header */}
      <div className="table-node-header" style={{ justifyContent: 'space-between', width: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, minWidth: 0 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-indigo)" strokeWidth="1.5" strokeLinecap="round">
            <rect x="2" y="2" width="12" height="12" rx="2" /><path d="M2 6h12M6 6v8"/>
          </svg>
          {editingTableName ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <input
                type="text"
                value={tempTableName}
                onChange={(e) => { setTempTableName(e.target.value); setNameError(null); }}
                onBlur={handleSaveTableName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTableName();
                  if (e.key === 'Escape') { setEditingTableName(false); setNameError(null); }
                }}
                autoFocus
                className={`table-name-input ${nameError ? 'input-error' : ''}`}
              />
              {nameError && <span className="validation-error">{nameError}</span>}
            </div>
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
        <button 
          className="delete-table-btn"
          onClick={() => {
            if (window.confirm(`Delete table ${data.name}?`)) {
              deleteTable(tableId);
            }
          }}
          title="Delete Table"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 4h10M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6 7v5M10 7v5M4.5 4l.7 9a1 1 0 001 .9h3.6a1 1 0 001-.9l.7-9"/>
          </svg>
        </button>
      </div>

      {/* Columns Container */}
      <div className="table-node-columns">
        {data.columns.map((col, index) => {
          return (
            <div 
              key={col.name} 
              className={`column-wrapper ${dragOverIndex === index ? 'drag-over' : ''}`}
              style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div 
                className={`column-row ${col.is_pk ? 'pk-row' : ''} ${col.is_fk ? 'fk-row' : ''}`}
                style={{ position: 'relative' }}
              >
                {/* Drag handle */}
                <span className="drag-handle" title="Drag to reorder">
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" opacity="0.3">
                    <circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/>
                    <circle cx="2" cy="6" r="1"/><circle cx="6" cy="6" r="1"/>
                    <circle cx="2" cy="10" r="1"/><circle cx="6" cy="10" r="1"/>
                  </svg>
                </span>

                {/* Left Handle for FK/PK connections */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`left_${col.name}`}
                  style={{ top: '50%', transform: 'translateY(-50%)', left: '-6px', background: 'var(--color-edge)' }}
                />

                {/* Column Meta/Keys - Double click to toggle PK */}
                <div 
                  className="column-meta" 
                  onDoubleClick={() => toggleColumnPk(tableId, col.name)} 
                  style={{ cursor: 'pointer' }}
                  title="Double click to toggle Primary Key"
                >
                  {col.is_pk && <span className="key-icon pk-icon">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-indigo)" stroke="none"><path d="M7 0a4 4 0 00-1.5 7.7V10H4v2h1.5v2H4v2h4v-2H6.5v-2H8v-2H6.5V7.7A4 4 0 007 0zm0 2a2 2 0 110 4 2 2 0 010-4z" transform="translate(1,0)"/></svg>
                  </span>}
                  {col.is_fk && <span className="key-icon fk-icon">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-emerald)" stroke="none"><path d="M8 1a3 3 0 00-1.5 5.6V9H4v2h2.5v3H4v2h5v-2H7.5v-3H10V9H7.5V6.6A3 3 0 008 1zM8 3a1 1 0 110 2 1 1 0 010-2z"/></svg>
                  </span>}
                  {!col.is_pk && !col.is_fk && <span className="key-placeholder"></span>}
                </div>

                {/* Editable Column Name */}
                {editingColName === col.name ? (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <input
                      type="text"
                      value={tempColName}
                      onChange={(e) => { setTempColName(e.target.value); setColNameError(null); }}
                      onBlur={() => handleSaveColumnName(col.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveColumnName(col.name);
                        if (e.key === 'Escape') { setEditingColName(null); setColNameError(null); }
                      }}
                      autoFocus
                      className={`column-name-input ${colNameError ? 'input-error' : ''}`}
                    />
                    {colNameError && <span className="validation-error">{colNameError}</span>}
                  </div>
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

                {/* Nullable status - Double click to toggle */}
                <span 
                  className="column-nullable" 
                  onDoubleClick={() => toggleColumnNullable(tableId, col.name)}
                  title="Double click to toggle NULL / NOT NULL"
                >
                  {col.nullable ? 'NULL' : 'N-N'}
                </span>

                {/* Description comment bubble */}
                <button 
                  className={`comment-bubble-btn ${(descriptions[tableId]?.[col.name]) ? 'has-comment' : ''}`}
                  onClick={() => setActiveCommentCol(activeCommentCol === col.name ? null : col.name)}
                  title="Edit description comment"
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12v8H6l-3 3v-3H2z" strokeLinejoin="round"/></svg>
                </button>

                {/* Delete column button */}
                <button
                  className="delete-col-btn"
                  onClick={() => {
                    if (data.columns.length <= 1) {
                      alert('Cannot delete the last column. Delete the table instead.');
                      return;
                    }
                    deleteColumn(tableId, col.name);
                  }}
                  title="Delete column"
                >
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg>
                </button>

                {/* Right Handle for FK/PK connections */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`right_${col.name}`}
                  style={{ top: '50%', transform: 'translateY(-50%)', right: '-6px', background: 'var(--color-emerald)' }}
                />
              </div>

              {/* Comment editor input overlay */}
              {activeCommentCol === col.name && (
                <div className="column-comment-editor">
                  <input
                    type="text"
                    placeholder="Add description..."
                    value={descriptions[tableId]?.[col.name] || ''}
                    onChange={(e) => updateDescription(tableId, col.name, e.target.value)}
                    onBlur={() => setActiveCommentCol(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setActiveCommentCol(null);
                    }}
                    autoFocus
                    className="column-comment-input"
                  />
                </div>
              )}
            </div>
          );
        })}
        
        {/* Add Column Button */}
        <button 
          className="add-column-btn"
          onClick={() => addColumn(tableId)}
          title="Add Column"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 1v8M1 5h8"/></svg>
          Add Column
        </button>
      </div>
    </div>
  );
};
export default TableNode;
