import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ColumnSchema } from '../../types/schema';
import { useToastStore } from '../../store/useToastStore';
import { isValidSqlName } from './TableNodeHeader';

interface TableNodeColumnProps {
  tableId: string;
  col: ColumnSchema;
  index: number;
  allColumns: ColumnSchema[];
  dragOverIndex: number | null;
  activeCommentCol: string | null;
  setActiveCommentCol: (colName: string | null) => void;
  updateColumnName: (tableId: string, oldName: string, newName: string) => void;
  updateColumnType: (tableId: string, colName: string, type: string) => void;
  toggleColumnPk: (tableId: string, colName: string) => void;
  toggleColumnNullable: (tableId: string, colName: string) => void;
  deleteColumn: (tableId: string, colName: string) => void;
  descriptions: Record<string, Record<string, string>>;
  updateDescription: (tableId: string, colName: string, desc: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

export const TableNodeColumn: React.FC<TableNodeColumnProps> = ({
  tableId,
  col,
  index,
  allColumns,
  dragOverIndex,
  activeCommentCol,
  setActiveCommentCol,
  updateColumnName,
  updateColumnType,
  toggleColumnPk,
  toggleColumnNullable,
  deleteColumn,
  descriptions,
  updateDescription,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) => {
  const [editingColName, setEditingColName] = useState<string | null>(null);
  const [tempColName, setTempColName] = useState('');
  const [colNameError, setColNameError] = useState<string | null>(null);
  
  const [editingColType, setEditingColType] = useState<string | null>(null);
  const [tempColType, setTempColType] = useState('');

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
    if (trimmed !== oldName && allColumns.some(c => c.name === trimmed)) {
      setColNameError('Duplicate name');
      return;
    }
    if (trimmed !== oldName) {
      updateColumnName(tableId, oldName, trimmed);
    }
    setEditingColName(null);
    setColNameError(null);
  };

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

  const [isDraggable, setIsDraggable] = useState(false);

  return (
    <div 
      className={`column-wrapper ${dragOverIndex === index ? 'drag-over' : ''}`}
      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}
      draggable={isDraggable}
      onDragStart={(e) => {
        if (!isDraggable) {
          e.preventDefault();
          return;
        }
        onDragStart(e, index);
      }}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <div 
        className={`column-row ${col.is_pk ? 'pk-row' : ''} ${col.is_fk ? 'fk-row' : ''}`}
        style={{ position: 'relative' }}
      >
        <span 
          className="drag-handle" 
          title="Drag to reorder"
          onMouseEnter={() => setIsDraggable(true)}
          onMouseLeave={() => setIsDraggable(false)}
        >
          <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" opacity="0.3">
            <circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/>
            <circle cx="2" cy="6" r="1"/><circle cx="6" cy="6" r="1"/>
            <circle cx="2" cy="10" r="1"/><circle cx="6" cy="10" r="1"/>
          </svg>
        </span>

        <Handle
          type="target"
          position={Position.Left}
          id={`left_${col.name}`}
          style={{ top: '50%', transform: 'translateY(-50%)', left: '-6px', background: 'var(--color-edge)' }}
        />

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

        <span 
          className="column-nullable" 
          onDoubleClick={() => toggleColumnNullable(tableId, col.name)}
          title="Double click to toggle NULL / NOT NULL"
        >
          {col.nullable ? 'NULL' : 'NOT NULL'}
        </span>

        <button 
          className={`comment-bubble-btn ${(descriptions[tableId]?.[col.name]) ? 'has-comment' : ''}`}
          onClick={() => setActiveCommentCol(activeCommentCol === col.name ? null : col.name)}
          title="Edit description comment"
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12v8H6l-3 3v-3H2z" strokeLinejoin="round"/></svg>
        </button>

        <button
          className="delete-col-btn"
          onClick={() => {
            if (allColumns.length <= 1) {
              useToastStore.getState().addToast({ type: 'warning', message: 'Cannot delete the last column. Delete the table instead.' });
              return;
            }
            deleteColumn(tableId, col.name);
          }}
          title="Delete column"
        >
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg>
        </button>

        <Handle
          type="source"
          position={Position.Right}
          id={`right_${col.name}`}
          style={{ top: '50%', transform: 'translateY(-50%)', right: '-6px', background: 'var(--color-emerald)' }}
        />
      </div>

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
};
