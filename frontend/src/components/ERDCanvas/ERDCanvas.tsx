import React, { useEffect, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  ReactFlowProvider,
  useReactFlow
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

const ERDCanvasContent: React.FC = () => {
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const { fitView } = useReactFlow();

  const hasSearch = searchQuery.trim().length > 0;
  const query = searchQuery.toLowerCase().trim();

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

    // Apply any existing user-dragged position updates and search highlights
    const positionedNodes = layoutedNodes.map((node) => {
      const savedPos = nodePositions[node.id];
      const nodePos = savedPos || node.position;
      
      let matches = false;
      if (hasSearch) {
        const tableNameMatches = node.data.name.toLowerCase().includes(query);
        const colNameMatches = node.data.columns.some((c: any) => c.name.toLowerCase().includes(query));
        matches = tableNameMatches || colNameMatches;
      }
      
      return { 
        ...node, 
        position: nodePos,
        className: `table-node ${hasSearch ? (matches ? 'highlighted-node' : 'dimmed-node') : ''}`,
        style: hasSearch ? {
          opacity: matches ? 1 : 0.2,
          boxShadow: matches ? '0 0 20px var(--color-border-hover)' : 'none',
          transition: 'opacity 0.2s ease, box-shadow 0.2s ease'
        } : undefined
      };
    });

    // Dim edges not linked to match nodes
    const processedEdges = layoutedEdges.map((edge) => {
      let edgeOpacity = 1;
      if (hasSearch) {
        const sourceTable = schema.tables.find(t => t.id === edge.source);
        const targetTable = schema.tables.find(t => t.id === edge.target);
        
        const sourceMatch = edge.source.toLowerCase().includes(query) || 
          sourceTable?.columns.some(c => c.name.toLowerCase().includes(query));
        const targetMatch = edge.target.toLowerCase().includes(query) || 
          targetTable?.columns.some(c => c.name.toLowerCase().includes(query));
          
        edgeOpacity = (sourceMatch || targetMatch) ? 1 : 0.15;
      }
      
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: edgeOpacity,
          transition: 'opacity 0.2s ease'
        }
      };
    });

    setNodes(positionedNodes);
    setEdges(processedEdges);
  }, [schema, layoutDir, inferRelationships, searchQuery]);

  // Viewport Autofocus Zoom
  useEffect(() => {
    if (!hasSearch || nodes.length === 0) return;
    
    const firstMatch = nodes.find(n => {
      const tableNameMatches = n.data.name.toLowerCase().includes(query);
      const colNameMatches = n.data.columns.some((c: any) => c.name.toLowerCase().includes(query));
      return tableNameMatches || colNameMatches;
    });

    if (firstMatch) {
      fitView({ nodes: [firstMatch], duration: 800, minZoom: 0.8, maxZoom: 1.2 });
    }
  }, [searchQuery]);

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
      <div className="canvas-toolbar glass-panel" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
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
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '12px', marginLeft: '-24px', zIndex: 10 }}
            >
              ❌
            </button>
          )}
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

export const ERDCanvas: React.FC = () => (
  <ReactFlowProvider>
    <ERDCanvasContent />
  </ReactFlowProvider>
);

export default ERDCanvas;
