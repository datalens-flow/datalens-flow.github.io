import { SqlEditor } from './components/SqlEditor/SqlEditor';
import { ERDCanvas } from './components/ERDCanvas/ERDCanvas';
import { DataDictionary } from './components/DataDictionary/DataDictionary';
import { ExportPanel } from './components/ExportPanel/ExportPanel';
import { CanvasToolbar } from './components/ERDCanvas/CanvasToolbar';
import { useSchemaStore } from './store/useSchemaStore';

function App() {
  const { activeTab, setActiveTab, error } = useSchemaStore();

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
            DataLens
          </h1>
        </div>
        
        {/* Canvas Controls (only active on ERD tab) */}
        {activeTab === 'erd' && <CanvasToolbar />}
        
        {/* Export options dropdown */}
        <ExportPanel />
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
              <ERDCanvas />
            ) : (
              <DataDictionary />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
