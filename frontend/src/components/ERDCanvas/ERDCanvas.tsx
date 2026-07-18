import React, { useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSchemaStore } from '../../store/useSchemaStore';
import { getLayoutedElements } from '../../utils/layout';
import TableNode from './TableNode';
import CrowsFootEdge from './CrowsFootEdge';
import './ERDCanvas.css';

const nodeTypes = {
  tableNode: TableNode,
};

const edgeTypes = {
  crowsFootEdge: CrowsFootEdge,
};

export const ERDCanvas: React.FC = () => {
  const { 
    schema, 
    nodePositions, 
    updateNodePosition,
    addRelationship,
    deleteRelationship,
    addTable,
    theme,
    setTheme,
    layoutDir,
    setLayoutDir,
    inferRelationships,
    setInferRelationships
  } = useSchemaStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  // Compute Layout on parse or when settings change
  useEffect(() => {
    if (!schema) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      schema.tables,
      schema.relationships,
      layoutDir,
      inferRelationships
    );

    // Apply any existing user-dragged position updates
    const positionedNodes = layoutedNodes.map((node) => {
      const savedPos = nodePositions[node.id];
      if (savedPos) {
        return { ...node, position: savedPos };
      }
      return node;
    });

    setNodes(positionedNodes);
    setEdges(layoutedEdges);
  }, [schema, layoutDir, inferRelationships]);

  const handleNodeDragStop = (_event: any, node: any) => {
    updateNodePosition(node.id, node.position.x, node.position.y);
  };

  const handleConnect = (params: any) => {
    const fromTable = params.source;
    const toTable = params.target;
    
    const fromCol = params.sourceHandle?.replace('right_', '') || '';
    const toCol = params.targetHandle?.replace('left_', '') || '';
    
    if (fromTable && toTable && fromCol && toCol) {
      addRelationship(fromTable, fromCol, toTable, toCol);
    }
  };

  const handleEdgeDoubleClick = (_event: any, edge: any) => {
    if (edge.id.startsWith('inferred_')) {
      alert('This is an inferred relationship. You cannot delete it. Turn off Heuristic Detection to hide it.');
      return;
    }
    if (window.confirm('Delete this relationship connection?')) {
      deleteRelationship(edge.id);
    }
  };

  return (
    <div className={`erd-canvas-container theme-${theme}`}>
      {/* Top Controls Toolbar */}
      <div className="canvas-toolbar glass-panel">
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
      </div>

      {/* SVG Cardinality Defs */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="one-cardinality"
            markerWidth="12"
            markerHeight="12"
            refX="0"
            refY="6"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M 3,2 L 3,10 M 7,2 L 7,10" stroke="var(--color-edge)" strokeWidth="2" fill="none" />
          </marker>

          <marker
            id="many-cardinality"
            markerWidth="16"
            markerHeight="16"
            refX="16"
            refY="8"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M 16,8 L 4,2 M 16,8 L 4,14 M 4,8 L 16,8" stroke="var(--color-edge)" strokeWidth="2" fill="none" />
            <path d="M 0,3 L 0,13" stroke="var(--color-edge)" strokeWidth="2" fill="none" />
          </marker>
        </defs>
      </svg>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background color="var(--color-grid)" gap={16} size={1} />
        <Controls style={{ background: 'var(--bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
        <MiniMap 
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--color-border)' }} 
          nodeColor="var(--bg-primary)" 
          maskColor="rgba(0, 0, 0, 0.4)" 
        />
      </ReactFlow>
    </div>
  );
};
export default ERDCanvas;
