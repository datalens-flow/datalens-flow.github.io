import React, { useState, useRef } from 'react';
import { ColumnSchema } from '../../types/schema';
import { useSchemaStore } from '../../store/useSchemaStore';
import './TableNode.css';
import { TableNodeHeader } from './TableNodeHeader';
import { TableNodeColumn } from './TableNodeColumn';

interface TableNodeProps {
  id: string;
  data: {
    name: string;
    columns: ColumnSchema[];
  };
}

export const TableNode: React.FC<TableNodeProps> = ({ id: tableId, data }) => {
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
    deleteTable,
    tableColors,
    setTableColor
  } = useSchemaStore();

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

  const activeColor = tableColors[tableId] || '#6366f1';

  return (
    <div className="table-node glass-panel">
      <TableNodeHeader
        tableId={tableId}
        tableName={data.name}
        activeColor={activeColor}
        setTableColor={setTableColor}
        deleteTable={deleteTable}
        updateTableName={updateTableName}
      />
      <div className="table-node-columns">
        {data.columns.map((col, index) => (
          <TableNodeColumn
            key={col.name}
            tableId={tableId}
            col={col}
            index={index}
            allColumns={data.columns}
            dragOverIndex={dragOverIndex}
            activeCommentCol={activeCommentCol}
            setActiveCommentCol={setActiveCommentCol}
            updateColumnName={updateColumnName}
            updateColumnType={updateColumnType}
            toggleColumnPk={toggleColumnPk}
            toggleColumnNullable={toggleColumnNullable}
            deleteColumn={deleteColumn}
            descriptions={descriptions}
            updateDescription={updateDescription}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
        
        <button 
          className="add-column-btn"
          onClick={() => addColumn(tableId)}
          title="Add Column"
          style={{
            color: activeColor
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 1v8M1 5h8"/></svg>
          Add Column
        </button>
      </div>
    </div>
  );
};
export default TableNode;
