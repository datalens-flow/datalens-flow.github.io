import React, { useState, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType
} from '@xyflow/react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { basicSetup } from 'codemirror';
import { syntaxHighlighting } from '@codemirror/language';
import { useSchemaStore } from '../../store/useSchemaStore';
import { parseLineage } from '../../utils/lineageParser';
import { LineageNode, ColInfo } from './LineageNode';
import { darkHighlightStyle, lightHighlightStyle } from './codeMirrorStyles';
import '@xyflow/react/dist/style.css';
import './DataLineage.css';

const nodeTypes = {
  lineageNode: LineageNode
};

export interface DataLineageProps {
  onSwitchToDiagram?: () => void;
}

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

    const COL_WIDTH = 250;
    const ROW_HEIGHT = 45;
    const COLUMN_GAP = 150;

    const COL_X_SOURCE = 50;
    const COL_X_BOTH = COL_X_SOURCE + COL_WIDTH + COLUMN_GAP;
    const COL_X_TARGET = COL_X_BOTH + COL_WIDTH + COLUMN_GAP;

    const createColumnNodes = (tablesList: string[], startX: number, role: 'source' | 'target' | 'both') => {
      let currentY = 50;
      tablesList.forEach(table => {
        const columns = getColumnsForTable(table);
        const nodeHeight = 50 + columns.length * ROW_HEIGHT;
        newNodes.push({
          id: table,
          type: 'lineageNode',
          position: { x: startX, y: currentY },
          data: { tableName: table, columns, role },
          style: {
            width: COL_WIDTH,
            background: 'var(--bg-secondary)',
            border: `1px solid var(--color-border)`,
            borderRadius: '6px',
            color: 'var(--color-text-primary)',
          }
        });
        currentY += nodeHeight + 40;
      });
    };

    createColumnNodes(sourceOnly, COL_X_SOURCE, 'source');
    createColumnNodes(bothTables, COL_X_BOTH, 'both');
    createColumnNodes(targetOnly, COL_X_TARGET, 'target');

    const allSourceTables = [...new Set(result.flows.map(f => f.sourceTable))];
    const sourceColorMap: Record<string, string> = {};
    allSourceTables.forEach((src, idx) => {
      sourceColorMap[src] = EDGE_COLORS[idx % EDGE_COLORS.length];
    });

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
  }, []);

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

export const DataLineage: React.FC<DataLineageProps> = (props) => (
  <ReactFlowProvider>
    <DataLineageInner {...props} />
  </ReactFlowProvider>
);
export default DataLineage;
