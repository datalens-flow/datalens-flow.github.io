import React, { useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  BackgroundVariant,
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSchemaStore } from '../../store/useSchemaStore';
import { getLayoutedElements } from '../../utils/layout';
import TableNode from './TableNode';
import CrowsFootEdge from './CrowsFootEdge';
import CardinalityMarkers from './CardinalityMarkers';
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
    layoutDir,
    inferRelationships,
    searchQuery,
    showGrid,
    tableColors
  } = useSchemaStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  
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
    <div className="erd-canvas-container">
      {/* SVG Cardinality Marker Defs */}
      <CardinalityMarkers />

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
        minZoom={0.05}
        maxZoom={2}
        fitView
      >
        {showGrid && <Background variant={BackgroundVariant.Lines} color="var(--color-grid)" gap={24} size={0.6} />}
        <Controls style={{ background: 'var(--bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
        <MiniMap 
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--color-border)' }} 
          nodeColor={(node) => tableColors[node.id] || "var(--bg-primary)"} 
          maskColor="rgba(0, 0, 0, 0.4)" 
        />
      </ReactFlow>
    </div>
  );
};

export const ERDCanvas: React.FC = () => {
  return <ERDCanvasContent />;
};

export default ERDCanvas;
