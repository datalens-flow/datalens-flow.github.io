import React, { useState, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls,
  MiniMap,
  useNodesState, 
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { useSchemaStore } from '../../store/useSchemaStore';
import { useToastStore } from '../../store/useToastStore';
import { parseLineage } from '../../utils/lineageParser';
import { LineageNode } from './LineageNode';
import { buildLineageGraph } from './buildLineageGraph';
import { useSqlEditor } from './useSqlEditor';
import { splitProcedures } from '../../utils/lineage/procedureSplitter';
import '@xyflow/react/dist/style.css';
import './DataLineage.css';

const nodeTypes = {
  lineageNode: LineageNode
};

export interface DataLineageProps {
  onSwitchToDiagram?: () => void;
}

const DataLineageInner: React.FC<DataLineageProps> = ({ onSwitchToDiagram }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { lineageSearchQuery } = useSchemaStore();
  const { fitView, setCenter, getZoom } = useReactFlow();

  const { procedureSql, setProcedureSql, editorRef, viewRef } = useSqlEditor(`-- Sample ETL Stored Procedure
INSERT INTO sales_summary (customer_name, revenue)
SELECT u.name, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id;`);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'sql' | 'explorer'>('sql');
  const [isDragging, setIsDragging] = useState(false);

  const { 
    layoutDir, 
    activeLineageProcedureIndex, 
    setActiveLineageProcedureIndex,
    ignoredLineageTables,
    setIgnoredLineageTables,
    showMiniMap,
    showGrid
  } = useSchemaStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Split procedures whenever SQL changes
  const parsedProcedures = React.useMemo(() => splitProcedures(procedureSql), [procedureSql]);

  // Determine the active procedures to analyze
  const activeProcedures = React.useMemo(() => {
    if (activeLineageProcedureIndex === 0 || parsedProcedures.length === 0) {
      return parsedProcedures.length > 0 ? parsedProcedures : [{ name: 'Global Script', sql: procedureSql }];
    }
    const idx = activeLineageProcedureIndex - 1;
    if (idx >= 0 && idx < parsedProcedures.length) {
      return [parsedProcedures[idx]];
    }
    return [{ name: 'Global Script', sql: procedureSql }];
  }, [procedureSql, parsedProcedures, activeLineageProcedureIndex]);

  const onToggleCollapse = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleExpandAll = React.useCallback(() => {
    const allIds = nodes.map(n => n.id);
    setExpandedNodes(new Set(allIds));
  }, [nodes]);

  const handleCollapseAll = React.useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  useEffect(() => {
    window.addEventListener('lineage-expand-all', handleExpandAll);
    window.addEventListener('lineage-collapse-all', handleCollapseAll);
    return () => {
      window.removeEventListener('lineage-expand-all', handleExpandAll);
      window.removeEventListener('lineage-collapse-all', handleCollapseAll);
    };
  }, [handleExpandAll, handleCollapseAll]);

  const handleAnalyze = () => {
    try {
      const ignoredArr = ignoredLineageTables.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const { newNodes, newEdges } = buildLineageGraph(activeProcedures, layoutDir, expandedNodes, ignoredArr);

      const nodesWithCallback = newNodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          onToggleCollapse
        }
      }));

      setNodes(nodesWithCallback);
      setEdges(newEdges);
      setSelectedNodeId(null);

      setTimeout(() => {
        fitView({ padding: 0.15, duration: 400 });
      }, 50);
    } catch (err: any) {
      console.error(err);
      useToastStore.getState().addToast({ type: 'error', message: 'Failed to analyze lineage: ' + (err.message || 'Unknown error') });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    try {
      const contents = await Promise.all(
        fileList.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string || '');
            reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
            reader.readAsText(file);
          });
        })
      );
      const combinedContent = contents.join('\n\n-- ==========================================\n-- IMPORTED: LINEAGE PROCEDURE\n-- ==========================================\n\n');
      if (combinedContent) {
        setProcedureSql(combinedContent);
        if (viewRef.current) {
          viewRef.current.dispatch({
            changes: { from: 0, to: viewRef.current.state.doc.length, insert: combinedContent }
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(f => f.name.toLowerCase().endsWith('.sql') || f.name.toLowerCase().endsWith('.txt'));
      
      if (validFiles.length === 0) {
        useToastStore.getState().addToast({ type: 'error', message: 'Failed to parse file. Only .sql and .txt files are supported.' });
        return;
      }

      if (validFiles.length < files.length) {
        useToastStore.getState().addToast({ type: 'warning', message: 'Some files were skipped. Only .sql and .txt files are supported.' });
      }

      try {
        const contents = await Promise.all(
          validFiles.map((file) => {
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (event) => resolve(event.target?.result as string || '');
              reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
              reader.readAsText(file);
            });
          })
        );
        const combinedContent = contents.join('\n\n-- ==========================================\n-- IMPORTED: LINEAGE PROCEDURE\n-- ==========================================\n\n');
        if (combinedContent) {
          setProcedureSql(combinedContent);
          if (viewRef.current) {
            viewRef.current.dispatch({
              changes: { from: 0, to: viewRef.current.state.doc.length, insert: combinedContent }
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    handleAnalyze();
  }, [layoutDir, expandedNodes, activeProcedures, ignoredLineageTables]);

  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => {
        if (!selectedNodeId) {
          return { ...node, style: { ...node.style, opacity: 1 } };
        }
        const isConnected = edges.some(
          (edge) => 
            (edge.source === selectedNodeId && edge.target === node.id) ||
            (edge.target === selectedNodeId && edge.source === node.id)
        );
        if (node.id === selectedNodeId || isConnected) {
          return { ...node, style: { ...node.style, opacity: 1 } };
        }
        return { ...node, style: { ...node.style, opacity: 0.2 } };
      })
    );
  }, [selectedNodeId, edges, setNodes]);

  const onNodeClick = (_: React.MouseEvent, node: any) => {
    if (node.type === 'group') return;
    setSelectedNodeId((prev: string | null) => (prev === node.id ? null : node.id));
    
    // Search the document for the table name to scroll to it
    if (viewRef.current) {
      const docStr = viewRef.current.state.doc.toString().toLowerCase();
      const searchStr = node.id.toLowerCase();
      // Try to find exact table name match
      const regex = new RegExp(`\\b${searchStr.replace(/\\./g, '\\\\.')}\\b`);
      const match = docStr.match(regex);
      if (match && match.index !== undefined) {
        const pos = match.index;
        viewRef.current.dispatch({
          selection: { anchor: pos, head: pos + searchStr.length },
          scrollIntoView: true
        });
        
        // EditorView.scrollIntoView requires the actual import, but we can do a simple DOM scroll if we focus
        viewRef.current.focus();
      }
    }
  };

  const onExplorerNodeClick = (nodeId: string) => {
    setSelectedNodeId(prev => prev === nodeId ? null : nodeId);
    setActiveSidebarTab('sql');
    
    if (viewRef.current) {
      const docStr = viewRef.current.state.doc.toString().toLowerCase();
      const searchStr = nodeId.toLowerCase();
      const regex = new RegExp(`\\b${searchStr.replace(/\\./g, '\\\\.')}\\b`);
      const match = docStr.match(regex);
      if (match && match.index !== undefined) {
        const pos = match.index;
        viewRef.current.dispatch({
          selection: { anchor: pos, head: pos + searchStr.length },
          scrollIntoView: true
        });
        viewRef.current.focus();
      }
    }
    
    // Also center graph
    const node = nodes.find((n: any) => n.id === nodeId);
    if (node) {
      const x = node.position.x + 100;
      const y = node.position.y + 60;
      setCenter(x, y, { zoom: getZoom() || 0.85, duration: 300 });
    }
  };

  const handleInspectInDiagram = () => {
    if (!selectedNodeId) return;
    const { setActiveTab, setSearchQuery } = useSchemaStore.getState();
    setActiveTab('erd');
    setSearchQuery(selectedNodeId);
    if (onSwitchToDiagram) {
      onSwitchToDiagram();
    }
  };

  const selectedNodeData = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const columnsInvolved = new Set<string>();
  if (selectedNodeId) {
    let allFlows: any[] = [];
    activeProcedures.forEach(p => {
      allFlows.push(...parseLineage(p.sql).flows);
    });
    
    allFlows.forEach(f => {
      if (f.sourceTable === selectedNodeId) {
        columnsInvolved.add(f.sourceCol === '*' ? 'All Columns' : f.sourceCol);
      }
      if (f.targetTable === selectedNodeId) {
        columnsInvolved.add(f.targetCol === '*' ? 'All Columns' : f.targetCol);
      }
    });
  }

  useEffect(() => {
    const q = lineageSearchQuery.trim();
    if (!q) {
      setNodes(nds => nds.map(n => ({ ...n, style: { ...n.style, opacity: 1 } })));
      setEdges(eds => eds.map(e => ({ ...e, style: { ...e.style, opacity: 0.8 } })));
      return;
    }
    const lower = q.toLowerCase();
    const matchIds = new Set<string>();
    nodes.forEach(n => {
      if (n.id.toLowerCase().includes(lower)) {
        matchIds.add(n.id);
      } else if (n.data?.columns?.some((c: any) => (c.name || '').toLowerCase().includes(lower))) {
        matchIds.add(n.id);
      }
    });

    setNodes(nds => nds.map(n => ({
      ...n,
      style: { ...n.style, opacity: matchIds.has(n.id) ? 1 : 0.15 }
    })));

    setEdges(eds => eds.map(e => ({
      ...e,
      style: { ...e.style, opacity: matchIds.has(e.source) || matchIds.has(e.target) ? 0.8 : 0.08 }
    })));

    if (matchIds.size > 0) {
      const firstMatch = nodes.find(n => matchIds.has(n.id));
      if (firstMatch) {
        const x = firstMatch.position.x + 100;
        const y = firstMatch.position.y + 60;
        setCenter(x, y, { zoom: getZoom() || 0.85, duration: 300 });
      }
    }
  }, [lineageSearchQuery, nodes, setNodes, setEdges, setCenter, getZoom]);

  const renderTableExplorer = () => {
    const allTableNodes = nodes.filter(n => n.type === 'lineageNode');
    
    // Group nodes by nodeTypeOverride
    const sources = allTableNodes.filter(n => n.data?.nodeTypeOverride === 'source');
    const targets = allTableNodes.filter(n => n.data?.nodeTypeOverride === 'target');
    const both = allTableNodes.filter(n => n.data?.nodeTypeOverride === 'both');
    const temps = allTableNodes.filter(n => n.data?.nodeTypeOverride === 'temp');
    const views = allTableNodes.filter(n => n.data?.nodeTypeOverride === 'view');

    const renderGroup = (title: string, items: any[], colorVar: string) => {
      if (items.length === 0) return null;
      return (
        <div className="table-explorer-category">
          <h4 style={{ color: `var(${colorVar})` }}>{title} ({items.length})</h4>
          <ul className="table-explorer-list">
            {items.map(n => {
              const isMatch = lineageSearchQuery && n.id.toLowerCase().includes(lineageSearchQuery.toLowerCase());
              return (
                <li 
                  key={n.id} 
                  className={`table-explorer-item ${selectedNodeId === n.id ? 'selected' : ''} ${isMatch ? 'highlight' : ''}`}
                  onClick={() => onExplorerNodeClick(n.id)}
                >
                  <span className="table-name">{n.id}</span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    };

    return (
      <div className="table-explorer-container">
        {renderGroup('Sources', sources, '--color-emerald')}
        {renderGroup('Views', views, '--color-purple')}
        {renderGroup('Intermediate (Both)', both, '--color-amber')}
        {renderGroup('Temp Tables', temps, '--color-text-secondary')}
        {renderGroup('Targets', targets, '--color-indigo')}
        {allTableNodes.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
            No tables found. Click "Analyze" to parse the SQL.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lineage-container">
      <div className={`lineage-sidebar ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className="lineage-sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="lineage-title">STORED PROCEDURE INPUT</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".sql" 
                multiple
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
              />
              <button 
                className="btn btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => fileInputRef.current?.click()}
              >
                📁 Import
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleAnalyze} 
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                Analyze
              </button>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          {parsedProcedures.length > 1 && (
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                Select Procedure:
              </label>
              <select
                value={activeLineageProcedureIndex}
                onChange={(e) => setActiveLineageProcedureIndex(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '11px'
                }}
              >
                <option value={0}>All Procedures (Combined)</option>
                {parsedProcedures.map((p, i) => (
                  <option key={i} value={i + 1}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              Ignored Tables (comma separated):
            </label>
            <input 
              type="text" 
              placeholder="e.g. log_table, audit_trail"
              value={ignoredLineageTables}
              onChange={(e) => setIgnoredLineageTables(e.target.value)}
              onBlur={handleAnalyze}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              style={{
                width: '100%',
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--color-text-primary)',
                fontSize: '11px'
              }}
            />
          </div>
          
          <div className="lineage-sidebar-tabs">
            <button 
              className={`lineage-tab ${activeSidebarTab === 'sql' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab('sql')}
            >
              SQL Editor
            </button>
            <button 
              className={`lineage-tab ${activeSidebarTab === 'explorer' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab('explorer')}
            >
              Explorer
            </button>
          </div>
        </div>
        
        {activeSidebarTab === 'sql' ? (
          <div 
            className="lineage-textarea" 
            ref={editorRef}
            style={{ position: 'relative' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '2px dashed var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>Drop .sql or .txt files here</span>
              </div>
            )}
          </div>
        ) : (
          <div className="lineage-textarea" style={{ padding: '12px', paddingBottom: '30px' }}>
            {renderTableExplorer()}
          </div>
        )}
        
        {selectedNodeId && selectedNodeData && (
          <div className="lineage-inspection-panel" style={{
            padding: '16px',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--bg-tertiary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
              Inspection: {selectedNodeId.toUpperCase()}
            </h3>
            
            <div>
              <strong style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Columns Involved:</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '12px', color: 'var(--color-text-primary)', maxHeight: '300px', overflowY: 'auto' }}>
                {Array.from(columnsInvolved).map(col => (
                  <li key={col}>{col}</li>
                ))}
              </ul>
            </div>

            <button 
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              onClick={handleInspectInDiagram}
            >
              🔍 Inspect in Diagram
            </button>
          </div>
        )}
      </div>
      <div className="lineage-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          minZoom={0.1}
          maxZoom={2}
          fitView
        >
          {showGrid && <Background color="rgba(255, 255, 255, 0.05)" gap={20} size={1} />}
          {showMiniMap && (
            <MiniMap 
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              nodeColor={(n) => {
                const nt = n.data?.nodeTypeOverride || n.data?.role;
                if (nt === 'temp') return 'rgba(236, 72, 153, 0.5)';
                if (nt === 'source') return 'rgba(16, 185, 129, 0.5)';
                if (nt === 'target') return 'rgba(99, 102, 241, 0.5)';
                if (nt === 'view') return 'rgba(168, 85, 247, 0.5)';
                return 'var(--color-border)';
              }}
              maskColor="rgba(0, 0, 0, 0.4)"
            />
          )}
          <Controls style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
        </ReactFlow>
      </div>
    </div>
  );
};

export const DataLineage: React.FC<DataLineageProps> = (props) => (
  <ReactFlowProvider>
    <DataLineageInner {...props} />
  </ReactFlowProvider>
);
export default DataLineage;

