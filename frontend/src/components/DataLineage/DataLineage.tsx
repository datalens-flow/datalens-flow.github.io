import React, { useState, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
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
import { parseLineage } from '../../utils/lineageParser';
import '@xyflow/react/dist/style.css';
import './DataLineage.css';

// Column data for LineageNode
interface ColInfo {
  name: string;
  hasLeft: boolean;   // incoming handle (target)
  hasRight: boolean;  // outgoing handle (source)
}

// Custom Lineage Node with per-column handles (supports dual-role: both source + target)
const LineageNode: React.FC<{ data: any }> = ({ data }) => {
  const columns: ColInfo[] = data.columns || [];
  const role: 'source' | 'target' | 'both' = data.role || 'source';
  return (
    <div style={{ position: 'relative', width: '200px' }}>
      <div className="lineage-node">
        <div className={`lineage-node-header ${role}`}>
          {role === 'source' ? '◀ Source' : role === 'target' ? 'Target ▶' : '◀ ▶'}&nbsp;&nbsp;{data.tableName}
        </div>
        <div className="lineage-node-body">
          {columns.map((col, i) => (
            <div key={i} className="lineage-col-row">
              {/* Left handle (incoming) */}
              {col.hasLeft && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`col-${col.name}`}
                  style={{
                    background: 'var(--color-emerald)',
                    border: '2px solid var(--bg-primary)',
                    width: '10px',
                    height: '10px',
                    left: '-17px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    position: 'absolute',
                  }}
                />
              )}
              <span className="lineage-col-flow">{col.name}</span>
              {/* Right handle (outgoing) */}
              {col.hasRight && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`col-${col.name}`}
                  style={{
                    background: 'var(--color-indigo)',
                    border: '2px solid var(--bg-primary)',
                    width: '10px',
                    height: '10px',
                    right: '-17px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    position: 'absolute',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
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

// Edge color palette for different source tables
const EDGE_COLORS = [
  '#38bdf8', // sky blue
  '#34d399', // emerald
  '#a78bfa', // violet
  '#fb923c', // orange
  '#f472b6', // pink
  '#facc15', // yellow
  '#2dd4bf', // teal
  '#818cf8', // indigo
];

const DataLineageInner: React.FC<DataLineageProps> = ({ onSwitchToDiagram }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { lineageSearchQuery, theme } = useSchemaStore();
  const { fitView, setCenter, getZoom } = useReactFlow();

  const [procedureSql, setProcedureSql] = useState<string>(`-- Sample ETL Stored Procedure
INSERT INTO sales_summary (customer_name, revenue)
SELECT u.name, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id;`);

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

    // --- Classify tables into 3 columns ---
    const sourceOnly: string[] = [];
    const targetOnly: string[] = [];
    const bothTables: string[] = [];

    const allTables = new Set([...result.sources, ...result.targets]);
    allTables.forEach(table => {
      const isSrc = result.sources.includes(table);
      const isTgt = result.targets.includes(table);
      if (isSrc && isTgt) bothTables.push(table);
      else if (isSrc) sourceOnly.push(table);
      else targetOnly.push(table);
    });

    // --- Helper: get columns with handle directions for a table ---
    const getColumnsForTable = (table: string): ColInfo[] => {
      const incomingCols = new Set<string>();
      const outgoingCols = new Set<string>();

      result.flows.forEach(f => {
        if (f.targetTable === table) {
          incomingCols.add(f.targetCol === '*' ? 'All Columns' : f.targetCol);
        }
        if (f.sourceTable === table) {
          outgoingCols.add(f.sourceCol === '*' ? 'All Columns' : f.sourceCol);
        }
      });

      const allCols: ColInfo[] = [];
      const seen = new Set<string>();

      incomingCols.forEach(col => {
        seen.add(col);
        allCols.push({ name: col, hasLeft: true, hasRight: outgoingCols.has(col) });
      });
      outgoingCols.forEach(col => {
        if (!seen.has(col)) {
          allCols.push({ name: col, hasLeft: false, hasRight: true });
        }
      });

      return allCols;
    };

    // --- Calculate actual node heights for dynamic spacing ---
    // Header ~32px + each column row ~24px + padding ~16px
    const NODE_HEADER_HEIGHT = 36;
    const COL_ROW_HEIGHT = 24;
    const NODE_PADDING = 16;
    const NODE_GAP = 30; // gap between nodes in same column
    const NODE_WIDTH = 200;

    const calcNodeHeight = (table: string): number => {
      const cols = getColumnsForTable(table);
      return NODE_HEADER_HEIGHT + cols.length * COL_ROW_HEIGHT + NODE_PADDING;
    };

    // Calculate total height for each column
    const calcColumnTotalHeight = (tables: string[]): number => {
      if (tables.length === 0) return 0;
      let total = 0;
      tables.forEach((t, i) => {
        total += calcNodeHeight(t);
        if (i < tables.length - 1) total += NODE_GAP;
      });
      return total;
    };

    const srcTotalH = calcColumnTotalHeight(sourceOnly);
    const bothTotalH = calcColumnTotalHeight(bothTables);
    const tgtTotalH = calcColumnTotalHeight(targetOnly);
    const maxTotalH = Math.max(srcTotalH, bothTotalH, tgtTotalH, 100);

    // --- Layout X positions ---
    const hasBothColumn = bothTables.length > 0;
    const COL_X_SOURCE = 0;
    const COL_X_BOTH = hasBothColumn ? 350 : 0;
    const COL_X_TARGET = hasBothColumn ? 700 : 400;

    // --- Create nodes for a column of tables (vertically centered) ---
    const createColumnNodes = (tables: string[], xPos: number, role: 'source' | 'target' | 'both') => {
      const colTotalH = calcColumnTotalHeight(tables);
      let currentY = (maxTotalH - colTotalH) / 2; // center vertically

      tables.forEach((table) => {
        const columns = getColumnsForTable(table);
        newNodes.push({
          id: table,
          type: 'lineageNode',
          position: { x: xPos, y: currentY },
          data: {
            tableName: table.toUpperCase(),
            role,
            columns,
          },
          style: {
            width: NODE_WIDTH,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            borderRadius: '6px',
            padding: 0,
            opacity: 1,
            transition: 'opacity 0.2s ease'
          }
        });
        currentY += calcNodeHeight(table) + NODE_GAP;
      });
    };

    createColumnNodes(sourceOnly, COL_X_SOURCE, 'source');
    createColumnNodes(bothTables, COL_X_BOTH, 'both');
    createColumnNodes(targetOnly, COL_X_TARGET, 'target');

    // --- Build color map: each source table gets a unique color ---
    const allSourceTables = [...new Set(result.flows.map(f => f.sourceTable))];
    const sourceColorMap: Record<string, string> = {};
    allSourceTables.forEach((src, idx) => {
      sourceColorMap[src] = EDGE_COLORS[idx % EDGE_COLORS.length];
    });

    // --- Create per-flow edges: NO labels, color-coded by source, smoothstep routing ---
    result.flows.forEach((flow, idx) => {
      const sourceCol = flow.sourceCol === '*' ? 'All Columns' : flow.sourceCol;
      const targetCol = flow.targetCol === '*' ? 'All Columns' : flow.targetCol;
      const edgeColor = sourceColorMap[flow.sourceTable] || '#38bdf8';

      newEdges.push({
        id: `e-${flow.sourceTable}-${flow.targetTable}-${sourceCol}-${targetCol}-${idx}`,
        source: flow.sourceTable,
        target: flow.targetTable,
        sourceHandle: `col-${sourceCol}`,
        targetHandle: `col-${targetCol}`,
        type: 'smoothstep',
        style: { stroke: edgeColor, strokeWidth: 1.5, opacity: 0.8 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 12, height: 12 }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodeId(null);

    // Auto-fit view after layout settles
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

  // Execute filtering & centering when global lineageSearchQuery changes
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

// Wrap with ReactFlowProvider so useReactFlow() works
export const DataLineage: React.FC<DataLineageProps> = (props) => (
  <ReactFlowProvider>
    <DataLineageInner {...props} />
  </ReactFlowProvider>
);
export default DataLineage;
