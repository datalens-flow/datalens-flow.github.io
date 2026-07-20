import React, { useRef, useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';

interface DataLineageSidebarProps {
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;
  parsedProcedures: any[];
  activeLineageProcedureIndex: number;
  setActiveLineageProcedureIndex: (v: number) => void;
  ignoredLineageTables: string;
  setIgnoredLineageTables: (v: string) => void;
  handleAnalyze: () => void;
  editorRef: any;
  viewRef: any;
  setProcedureSql: (v: string) => void;
  nodes: any[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setCenter: any;
  getZoom: any;
  columnsInvolved: Set<string>;
  handleInspectInDiagram: () => void;
}

export const DataLineageSidebar: React.FC<DataLineageSidebarProps> = ({
  isFullscreen, setIsFullscreen, parsedProcedures, activeLineageProcedureIndex, setActiveLineageProcedureIndex,
  ignoredLineageTables, setIgnoredLineageTables, handleAnalyze, editorRef, viewRef, setProcedureSql,
  nodes, selectedNodeId, setSelectedNodeId, setCenter, getZoom, columnsInvolved, handleInspectInDiagram
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'sql' | 'explorer'>('sql');
  const [isDragging, setIsDragging] = useState(false);
  const { lineageSearchQuery } = useSchemaStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const contents = await Promise.all(
        Array.from(files).map(file => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string || '');
          reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
          reader.readAsText(file);
        }))
      );
      const combinedContent = contents.join('\n\n-- ==========================================\n-- IMPORTED: LINEAGE PROCEDURE\n-- ==========================================\n\n');
      if (combinedContent) {
        setProcedureSql(combinedContent);
        if (viewRef.current) {
          viewRef.current.dispatch({ changes: { from: 0, to: viewRef.current.state.doc.length, insert: combinedContent } });
        }
      }
    } catch (err) { console.error(err); }
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.sql') || f.name.toLowerCase().endsWith('.txt'));
      if (validFiles.length === 0) return;
      try {
        const contents = await Promise.all(validFiles.map(file => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = event => resolve(event.target?.result as string || '');
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        })));
        const combinedContent = contents.join('\n\n-- ==========================================\n-- IMPORTED: LINEAGE PROCEDURE\n-- ==========================================\n\n');
        if (combinedContent) {
          setProcedureSql(combinedContent);
          if (viewRef.current) {
            viewRef.current.dispatch({ changes: { from: 0, to: viewRef.current.state.doc.length, insert: combinedContent } });
          }
        }
      } catch (err) { console.error(err); }
    }
  };

  const onExplorerNodeClick = (nodeId: string) => {
    setSelectedNodeId(selectedNodeId === nodeId ? null : nodeId);
    setActiveSidebarTab('sql');
    if (viewRef.current) {
      const docStr = viewRef.current.state.doc.toString().toLowerCase();
      const match = docStr.match(new RegExp(`\\b${nodeId.toLowerCase().replace(/\\./g, '\\\\.')}\\b`));
      if (match && match.index !== undefined) {
        viewRef.current.dispatch({ selection: { anchor: match.index, head: match.index + nodeId.length }, scrollIntoView: true });
        viewRef.current.focus();
      }
    }
    const node = nodes.find(n => n.id === nodeId);
    if (node) setCenter(node.position.x + 100, node.position.y + 60, { zoom: getZoom() || 0.85, duration: 300 });
  };

  const renderGroup = (title: string, items: any[], colorVar: string) => {
    if (items.length === 0) return null;
    return (
      <div className="table-explorer-category">
        <h4 style={{ color: `var(${colorVar})` }}>{title} ({items.length})</h4>
        <ul className="table-explorer-list">
          {items.map(n => {
            const isMatch = lineageSearchQuery && n.id.toLowerCase().includes(lineageSearchQuery.toLowerCase());
            return (
              <li key={n.id} className={`table-explorer-item ${selectedNodeId === n.id ? 'selected' : ''} ${isMatch ? 'highlight' : ''}`} onClick={() => onExplorerNodeClick(n.id)}>
                <span className="table-name">{n.id}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const allTableNodes = nodes.filter(n => n.type === 'lineageNode');

  return (
    <div className={`lineage-sidebar ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="lineage-sidebar-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="lineage-title">STORED PROCEDURE INPUT</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="file" ref={fileInputRef} accept=".sql" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => fileInputRef.current?.click()}>📁 Import</button>
            <button className="btn btn-primary" onClick={handleAnalyze} style={{ padding: '4px 10px', fontSize: '11px' }}>Analyze</button>
            <button className="btn btn-secondary" onClick={handleAnalyze} style={{ padding: '4px 10px', fontSize: '11px' }} title="Refresh Diagram">🔄</button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center' }} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              {isFullscreen ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              )}
            </button>
          </div>
        </div>
        {parsedProcedures.length > 1 && (
          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Select Procedure:</label>
            <select value={activeLineageProcedureIndex} onChange={(e) => setActiveLineageProcedureIndex(Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--bg-primary)', color: 'var(--color-text-primary)', fontSize: '11px' }}>
              <option value={0}>All Procedures (Combined)</option>
              {parsedProcedures.map((p, i) => <option key={i} value={i + 1}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div style={{ marginTop: '12px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Ignored Tables (comma separated):</label>
          <input type="text" placeholder="e.g. log_table, audit_trail" value={ignoredLineageTables} onChange={(e) => setIgnoredLineageTables(e.target.value)} onBlur={handleAnalyze} onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--bg-primary)', color: 'var(--color-text-primary)', fontSize: '11px' }} />
        </div>
        <div className="lineage-sidebar-tabs">
          <button className={`lineage-tab ${activeSidebarTab === 'sql' ? 'active' : ''}`} onClick={() => setActiveSidebarTab('sql')}>SQL Editor</button>
          <button className={`lineage-tab ${activeSidebarTab === 'explorer' ? 'active' : ''}`} onClick={() => setActiveSidebarTab('explorer')}>Explorer</button>
        </div>
      </div>
      
      <div 
        className="lineage-textarea" 
        ref={editorRef} 
        style={{ position: 'relative', display: activeSidebarTab === 'sql' ? 'block' : 'none' }} 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }} 
        onDrop={handleDrop}
      >
        {isDragging && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '2px dashed var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>Drop .sql or .txt files here</span>
          </div>
        )}
      </div>

      <div 
        className="lineage-textarea" 
        style={{ padding: '12px', paddingBottom: '30px', display: activeSidebarTab === 'explorer' ? 'block' : 'none' }}
      >
        <div className="table-explorer-container">
          {renderGroup('Sources', allTableNodes.filter(n => n.data?.nodeTypeOverride === 'source'), '--color-emerald')}
          {renderGroup('Views', allTableNodes.filter(n => n.data?.nodeTypeOverride === 'view'), '--color-purple')}
          {renderGroup('Intermediate (Both)', allTableNodes.filter(n => n.data?.nodeTypeOverride === 'both'), '--color-amber')}
          {renderGroup('Temp Tables', allTableNodes.filter(n => n.data?.nodeTypeOverride === 'temp'), '--color-text-secondary')}
          {renderGroup('Targets', allTableNodes.filter(n => n.data?.nodeTypeOverride === 'target'), '--color-indigo')}
          {allTableNodes.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>No tables found. Click "Analyze" to parse the SQL.</div>}
        </div>
      </div>
      
      {selectedNodeId && nodes.find(n => n.id === selectedNodeId) && (
        <div className="lineage-inspection-panel" style={{ padding: '16px', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
              Inspection:<br/>{selectedNodeId.toUpperCase()}
            </h3>
            <button 
              onClick={() => setSelectedNodeId(null)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex' }}
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div>
            <strong style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Columns Involved:</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '12px', color: 'var(--color-text-primary)', maxHeight: '300px', overflowY: 'auto' }}>
              {Array.from(columnsInvolved).map(col => <li key={col}>{col}</li>)}
            </ul>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={handleInspectInDiagram}>
            🔍 Inspect in Diagram
          </button>
        </div>
      )}
    </div>
  );
};
