import React from 'react';
import { SqlEditor } from './components/SqlEditor/SqlEditor';
import { useSchemaStore } from './store/useSchemaStore';

function App() {
  const { activeTab, setActiveTab, error, loading } = useSchemaStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 24px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderBottom: '1px solid var(--color-border)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🔷</span>
          <h1 style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '0.02em' }}>
            DataLens <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--color-text-muted)' }}>v1.0</span>
          </h1>
        </div>
        
        {/* Placeholder for export panel */}
        <div id="export-panel-anchor"></div>
      </header>

      {/* Main Workspace */}
      <main style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', padding: '16px', gap: '16px' }}>
        {/* Left Side: SQL Input */}
        <section style={{ width: '400px', height: '100%', flexShrink: 0 }}>
          <SqlEditor />
        </section>

        {/* Right Side: Visualizers */}
        <section className="glass-panel" style={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab Selection */}
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'erd' ? 'active' : ''}`}
              onClick={() => setActiveTab('erd')}
            >
              📊 Interactive ERD
            </button>
            <button 
              className={`tab-btn ${activeTab === 'dict' ? 'active' : ''}`}
              onClick={() => setActiveTab('dict')}
            >
              📖 Data Dictionary
            </button>
          </div>

          {/* Status Message or Warnings */}
          {error && (
            <div style={{ 
              padding: '8px 16px', 
              backgroundColor: 'rgba(244, 63, 94, 0.1)', 
              borderBottom: '1px solid var(--color-rose)', 
              color: 'var(--color-rose)', 
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-mono)'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Canvas Workspace */}
          <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
            {activeTab === 'erd' ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                  <p style={{ fontSize: '18px', marginBottom: '8px' }}>ERD Diagram Area</p>
                  <p style={{ fontSize: '13px', opacity: 0.7 }}>Click "Parse DDL" on the left to render diagram</p>
                </div>
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                  <p style={{ fontSize: '18px', marginBottom: '8px' }}>Data Dictionary Grid</p>
                  <p style={{ fontSize: '13px', opacity: 0.7 }}>Click "Parse DDL" on the left to show columns list</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
