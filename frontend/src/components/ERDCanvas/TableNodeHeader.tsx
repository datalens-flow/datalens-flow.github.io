import React, { useState } from 'react';

// SQL name validation — allows letters, digits, underscores; must start with letter or underscore
export const isValidSqlName = (name: string): boolean => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

// Available theme-friendly colors for tagging
export const paletteColors = [
  { hex: '#6366f1', label: 'Indigo' },
  { hex: '#0ea5e9', label: 'Sky' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#f43f5e', label: 'Rose' },
  { hex: '#a855f7', label: 'Purple' },
  { hex: '#64748b', label: 'Muted' }
];

interface TableNodeHeaderProps {
  tableId: string;
  tableName: string;
  activeColor: string;
  setTableColor: (id: string, color: string) => void;
  deleteTable: (id: string) => void;
  updateTableName: (id: string, name: string) => void;
}

export const TableNodeHeader: React.FC<TableNodeHeaderProps> = ({
  tableId,
  tableName,
  activeColor,
  setTableColor,
  deleteTable,
  updateTableName
}) => {
  const [editingTableName, setEditingTableName] = useState(false);
  const [tempTableName, setTempTableName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleDoubleClickTable = () => {
    setEditingTableName(true);
    setTempTableName(tableName);
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
    if (trimmed !== tableName) {
      updateTableName(tableId, trimmed);
    }
    setEditingTableName(false);
    setNameError(null);
  };

  return (
    <div 
      className="table-node-header" 
      style={{ 
        justifyContent: 'space-between', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center',
        background: `linear-gradient(180deg, ${activeColor}1a 0%, ${activeColor}05 100%)`,
        borderBottom: `1px solid ${activeColor}33`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, minWidth: 0 }}>
        {/* Color palette selector button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            className="table-color-picker-trigger"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Change table tag color"
            style={{
              background: activeColor,
              border: 'none',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              boxShadow: `0 0 6px ${activeColor}66`,
              transition: 'transform 0.15s ease'
            }}
          />
          {showColorPicker && (
            <div 
              className="table-color-picker-dropdown glass-panel"
              style={{
                position: 'absolute',
                top: '18px',
                left: '0',
                zIndex: 999,
                padding: '6px',
                display: 'flex',
                gap: '4px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--bg-secondary)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              {paletteColors.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => {
                    setTableColor(tableId, color.hex);
                    setShowColorPicker(false);
                  }}
                  style={{
                    background: color.hex,
                    border: activeColor === color.hex ? '2px solid #ffffff' : 'none',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: `0 0 4px ${color.hex}44`
                  }}
                  title={color.label}
                />
              ))}
            </div>
          )}
        </div>

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
              style={{ borderColor: activeColor }}
            />
            {nameError && <span className="validation-error">{nameError}</span>}
          </div>
        ) : (
          <span 
            className="table-name"
            onDoubleClick={handleDoubleClickTable}
            title="Double click to edit table name"
          >
            {tableName}
          </span>
        )}
      </div>
      <button 
        className="delete-table-btn"
        onClick={() => {
          if (window.confirm(`Delete table ${tableName}?`)) {
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
  );
};
