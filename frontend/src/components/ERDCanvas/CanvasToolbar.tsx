import React from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';

export const CanvasToolbar: React.FC = () => {
  const {
    addTable,
    layoutDir,
    setLayoutDir,
    inferRelationships,
    setInferRelationships,
    theme,
    setTheme,
    searchQuery,
    setSearchQuery
  } = useSchemaStore();

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="canvas-toolbar" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
      <button className="toolbar-btn add-btn" onClick={addTable}>
        ➕ Add Table
      </button>
      
      <div className="toolbar-divider"></div>

      {/* Layout Direction Selector */}
      <div className="toolbar-group">
        <span className="toolbar-label">Layout:</span>
        <button 
          className={`toolbar-toggle-btn ${layoutDir === 'LR' ? 'active' : ''}`}
          onClick={() => setLayoutDir('LR')}
        >
          ↔️ Horizontal
        </button>
        <button 
          className={`toolbar-toggle-btn ${layoutDir === 'TB' ? 'active' : ''}`}
          onClick={() => setLayoutDir('TB')}
        >
          ↕️ Vertical
        </button>
      </div>

      <div className="toolbar-divider"></div>

      {/* Implicit relationship toggle */}
      <button 
        className={`toolbar-btn implicit-btn ${inferRelationships ? 'active' : ''}`}
        onClick={() => setInferRelationships(!inferRelationships)}
      >
        {inferRelationships ? '🟢 Heuristics: ON' : '⚫ Heuristics: OFF'}
      </button>

      <div className="toolbar-divider"></div>

      {/* Theme Selectors */}
      <div className="toolbar-group">
        <span className="toolbar-label">Theme:</span>
        <button 
          className={`toolbar-toggle-btn ${theme === 'neon' ? 'active' : ''}`}
          onClick={() => setTheme('neon')}
        >
          🌌 Neon
        </button>
        <button 
          className={`toolbar-toggle-btn ${theme === 'cyberpunk' ? 'active' : ''}`}
          onClick={() => setTheme('cyberpunk')}
        >
          🟡 Cyber
        </button>
        <button 
          className={`toolbar-toggle-btn ${theme === 'light' ? 'active' : ''}`}
          onClick={() => setTheme('light')}
        >
          ☀️ Light
        </button>
      </div>

      <div className="toolbar-divider"></div>

      {/* Search bar focus filter */}
      <div className="toolbar-group">
        <input
          type="text"
          placeholder="🔍 Search table/column..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="toolbar-search-input"
        />
        {hasSearch && (
          <button 
            onClick={() => setSearchQuery('')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-text-muted)', 
              cursor: 'pointer', 
              fontSize: '12px', 
              marginLeft: '-24px', 
              zIndex: 10 
            }}
          >
            ❌
          </button>
        )}
      </div>
    </div>
  );
};
export default CanvasToolbar;
