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

  const { layoutDir, activeLineageProcedureIndex, setActiveLineageProcedureIndex } = useSchemaStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Split procedures whenever SQL changes
  const parsedProcedures = React.useMemo(() => splitProcedures(procedureSql), [procedureSql]);

  // Determine the active SQL to analyze
  const activeSql = React.useMemo(() => {
    if (activeLineageProcedureIndex === 0 || parsedProcedures.length === 0) {
      return procedureSql; // All combined
    }
    const idx = activeLineageProcedureIndex - 1;
    if (idx >= 0 && idx < parsedProcedures.length) {
      return parsedProcedures[idx].sql;
    }
    return procedureSql;
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
    const { newNodes, newEdges } = buildLineageGraph(activeSql, layoutDir, expandedNodes);

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

  useEffect(() => {
    handleAnalyze();
  }, [layoutDir, expandedNodes, activeSql]);

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
    setSelectedNodeId((prev: string | null) => (prev === node.id ? null : node.id));
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
    const result = parseLineage(activeSql);
    result.flows.forEach(f => {
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

  return (
    <div className="lineage-container">
      <div className={`lineage-sidebar ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className="lineage-sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="lineage-title">Stored Procedure Input</span>
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
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
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
              style={{ fontSize: '11px', padding: '6px 12px' }}
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Import
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '11px', padding: '6px 12px' }}
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Import
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleAnalyze} 
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              Analyze
            </button>
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
        </div>
        <div className="lineage-textarea" ref={editorRef}></div>
        
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
          <Background color="var(--color-grid)" gap={16} size={1} />
          <Controls />
          <MiniMap 
            nodeColor={(n: any) => {
              if (n.data?.isTemp) return 'var(--color-indigo)';
              if (n.data?.role === 'source') return 'var(--color-emerald)';
              if (n.data?.role === 'target') return 'var(--color-indigo)';
              return 'var(--color-border)';
            }}
            maskColor="var(--bg-primary-transparent)"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
          />
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

