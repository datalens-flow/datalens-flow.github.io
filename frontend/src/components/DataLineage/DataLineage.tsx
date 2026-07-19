import React, { useState, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { basicSetup } from 'codemirror';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { useSchemaStore } from '../../store/useSchemaStore';
import { parseLineage, LineageFlow } from '../../utils/lineageParser';
import '@xyflow/react/dist/style.css';
import './DataLineage.css';

// Custom Lineage Node with Left/Right handles strictly positioned
const LineageNode: React.FC<{ data: any }> = ({ data }) => {
  const isSource = data.isSource;
  return (
    <div style={{ position: 'relative', width: '160px', height: '100%' }}>
      {/* Target/Input handle strictly on the Left side */}
      {!isSource && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: 'var(--color-emerald)', width: '8px', height: '8px', top: '50%', transform: 'translateY(-50%)', left: '-4px' }}
        />
      )}
      
      {data.label}

      {/* Source/Output handle strictly on the Right side */}
      {isSource && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: 'var(--color-indigo)', width: '8px', height: '8px', top: '50%', transform: 'translateY(-50%)', right: '-4px' }}
        />
      )}
    </div>
  );
};

const nodeTypes = {
  lineageNode: LineageNode
};

const darkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#38bdf8', fontWeight: 'bold' },
  { tag: t.operator, color: '#38bdf8' },
  { tag: t.modifier, color: '#38bdf8' },
  { tag: t.standard(t.name), color: '#38bdf8', fontWeight: 'bold' },
  { tag: t.typeName, color: '#34d399' },
  { tag: t.string, color: '#fda4af' },
  { tag: t.special(t.string), color: '#fda4af' },
  { tag: t.number, color: '#f59e0b' },
  { tag: t.bool, color: '#f59e0b' },
  { tag: t.null, color: '#94a3b8' },
  { tag: t.name, color: '#f8fafc' },
  { tag: t.special(t.name), color: '#67e8f9' },
  { tag: t.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.lineComment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.blockComment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.variableName, color: '#f8fafc' },
  { tag: t.punctuation, color: '#94a3b8' }
]);

const lightHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#1e40af', fontWeight: 'bold' },
  { tag: t.operator, color: '#1e40af' },
  { tag: t.modifier, color: '#1e40af' },
  { tag: t.standard(t.name), color: '#1e40af', fontWeight: 'bold' },
  { tag: t.typeName, color: '#059669' },
  { tag: t.string, color: '#dc2626' },
  { tag: t.special(t.string), color: '#dc2626' },
  { tag: t.number, color: '#b45309' },
  { tag: t.bool, color: '#b45309' },
  { tag: t.null, color: '#64748b' },
  { tag: t.name, color: '#1e293b' },
  { tag: t.special(t.name), color: '#0891b2' },
  { tag: t.comment, color: '#94a3b8', fontStyle: 'italic' },
  { tag: t.lineComment, color: '#94a3b8', fontStyle: 'italic' },
  { tag: t.blockComment, color: '#94a3b8', fontStyle: 'italic' },
  { tag: t.variableName, color: '#1e293b' },
  { tag: t.punctuation, color: '#64748b' }
]);

export interface DataLineageProps {
  onSwitchToDiagram?: () => void;
}

export const DataLineage: React.FC<DataLineageProps> = ({ onSwitchToDiagram }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [procedureSql, setProcedureSql] = useState<string>(`-- Sample ETL Stored Procedure
INSERT INTO sales_summary (customer_name, revenue)
SELECT u.name, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id;`);

  const { theme } = useSchemaStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const selection = viewRef.current?.state.selection;

    const startState = EditorState.create({
      doc: procedureSql,
      extensions: [
        basicSetup,
        sqlLang(),
        keymap.of(defaultKeymap),
        syntaxHighlighting(theme === 'dark' ? darkHighlightStyle : lightHighlightStyle),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setProcedureSql(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': { height: '100%', minHeight: '300px', flex: 1, backgroundColor: 'var(--bg-secondary)', color: 'var(--color-text-primary)' },
          '.cm-content': { fontFamily: 'var(--font-mono)', fontSize: '13px' },
          '.cm-gutters': { backgroundColor: 'var(--bg-tertiary)', color: 'var(--color-text-muted)', borderRight: '1px solid var(--color-border)' },
          '.cm-cursor': { borderLeftColor: 'var(--color-indigo)' },
          '.cm-scroller': { overflow: 'auto' }
        })
      ],
      selection: selection || undefined
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [theme]);

  const handleAnalyze = () => {
    const result = parseLineage(procedureSql);
    const newNodes: any[] = [];
    const newEdges: any[] = [];

    // Layout source nodes on the left
    result.sources.forEach((src, idx) => {
      const relatedFlows = result.flows.filter(f => f.sourceTable === src);
      newNodes.push({
        id: src,
        type: 'lineageNode',
        position: { x: 80, y: 50 + idx * 180 },
        data: { 
          isSource: true,
          label: (
            <div className="lineage-node">
              <div className="lineage-node-header source">Source: {src.toUpperCase()}</div>
              <div className="lineage-node-body">
                {relatedFlows.map((f, i) => (
                  <div key={i} className="lineage-col-flow">{f.sourceCol === '*' ? 'All Columns' : f.sourceCol}</div>
                ))}
              </div>
            </div>
          )
        },
        style: { 
          width: 160, 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--color-border)', 
          color: 'var(--color-text-primary)', 
          borderRadius: '6px',
          padding: 0,
          opacity: 1,
          transition: 'opacity 0.2s ease'
        }
      });
    });

    // Layout target nodes on the right
    result.targets.forEach((tgt, idx) => {
      const relatedFlows = result.flows.filter(f => f.targetTable === tgt);
      newNodes.push({
        id: tgt,
        type: 'lineageNode',
        position: { x: 400, y: 50 + idx * 180 },
        data: { 
          isSource: false,
          label: (
            <div className="lineage-node">
              <div className="lineage-node-header target">Target: {tgt.toUpperCase()}</div>
              <div className="lineage-node-body">
                {relatedFlows.map((f, i) => (
                  <div key={i} className="lineage-col-flow">{f.targetCol === '*' ? 'All Columns' : f.targetCol}</div>
                ))}
              </div>
            </div>
          )
        },
        style: { 
          width: 160, 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--color-border)', 
          color: 'var(--color-text-primary)', 
          borderRadius: '6px',
          padding: 0,
          opacity: 1,
          transition: 'opacity 0.2s ease'
        }
      });
    });

    // Group flows by source→target pair, then create one edge per pair
    const edgeMap: Record<string, LineageFlow[]> = {};
    result.flows.forEach((flow) => {
      const key = `${flow.sourceTable}→${flow.targetTable}`;
      if (!edgeMap[key]) edgeMap[key] = [];
      edgeMap[key].push(flow);
    });

    Object.entries(edgeMap).forEach(([key, groupedFlows], idx) => {
      const label = groupedFlows
        .map(f => f.sourceCol === '*' ? 'Full Flow' : `${f.sourceCol} ➜ ${f.targetCol}`)
        .join('\n');
      
      newEdges.push({
        id: `e-${key}-${idx}`,
        source: groupedFlows[0].sourceTable,
        target: groupedFlows[0].targetTable,
        label,
        style: { stroke: 'var(--color-indigo)', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-indigo)' }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodeId(null);
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

  // Parse only on initial mount with sample SQL
  useEffect(() => {
    handleAnalyze();
  }, []);

  // Update node opacities based on selection
  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => {
        if (!selectedNodeId) {
          // No selection, full opacity for all
          return { ...node, style: { ...node.style, opacity: 1 } };
        }

        // Check if this node is connected to the selected node
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

  // Get selected node details
  const selectedNodeData = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  
  // Extract unique columns involved in flows for the selected node
  const columnsInvolved = new Set<string>();
  if (selectedNodeId) {
    const result = parseLineage(procedureSql);
    result.flows.forEach(f => {
      if (f.sourceTable === selectedNodeId) {
        columnsInvolved.add(f.sourceCol === '*' ? 'All Columns' : f.sourceCol);
      }
      if (f.targetTable === selectedNodeId) {
        columnsInvolved.add(f.targetCol === '*' ? 'All Columns' : f.targetCol);
      }
    });
  }

  return (
    <div className="lineage-container">
      <div className="lineage-sidebar">
        <div className="lineage-sidebar-header">
          <span className="lineage-title">Stored Procedure Input</span>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
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
              📁 Import Procedure
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleAnalyze} 
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              Analyze
            </button>
          </div>
        </div>
        <div className="lineage-textarea" ref={editorRef}></div>
        
        {/* Inspection Panel */}
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
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '12px', color: 'var(--color-text-primary)' }}>
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
        </ReactFlow>
      </div>
    </div>
  );
};
export default DataLineage;
