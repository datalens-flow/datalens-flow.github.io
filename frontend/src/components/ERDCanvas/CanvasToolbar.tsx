import React, { useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';

export const CanvasToolbar: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    addTable,
    layoutDir,
    setLayoutDir,
    inferRelationships,
    setInferRelationships,
    showGrid,
    setShowGrid,
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

      {/* Theme Selectors */}
      <div className="toolbar-group">
        <span className="toolbar-label">Theme:</span>
        <button 
          className={`toolbar-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setTheme('dark')}
        >
          🌌 Dark
        </button>
        <button 
          className={`toolbar-toggle-btn ${theme === 'light' ? 'active' : ''}`}
          onClick={() => setTheme('light')}
        >
          ☀️ Light
        </button>
      </div>

      <div className="toolbar-divider"></div>

      {/* Canvas Settings Dropdown */}
      <div className="toolbar-settings-container" style={{ position: 'relative' }}>
        <button 
          className={`toolbar-btn ${settingsOpen ? 'active' : ''}`}
          onClick={() => setSettingsOpen(!settingsOpen)}
          style={{ minWidth: '110px' }}
        >
          ⚙️ Settings ▼
        </button>
        
        {settingsOpen && (
          <div className="toolbar-settings-dropdown glass-panel" style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '200px',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--bg-secondary)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: '10px 12px',
            gap: '8px'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Canvas Options
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-primary)', cursor: 'pointer', userSelect: 'none' }}>
              <input 
                type="checkbox" 
                checked={showGrid} 
                onChange={(e) => setShowGrid(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Show Background Grid
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-primary)', cursor: 'pointer', userSelect: 'none' }}>
              <input 
                type="checkbox" 
                checked={inferRelationships} 
                onChange={(e) => setInferRelationships(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Heuristic Relations
            </label>
          </div>
        )}
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
