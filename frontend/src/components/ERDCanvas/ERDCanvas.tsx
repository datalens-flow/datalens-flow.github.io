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
import { useToastStore } from '../../store/useToastStore';

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
      // Only reuse saved position if it exists, otherwise fall back to dagre layout coordinates
      const nodePos = savedPos && Object.keys(savedPos).length > 0 ? savedPos : node.position;
      
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

    // Fit view to correctly display all tables formatted nicely without overlapping on initial render or parse
    requestAnimationFrame(() => {
      fitView({ padding: 0.25, duration: 600 });
    });
  }, [schema, layoutDir, inferRelationships, searchQuery, nodePositions, fitView]);

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
      useToastStore.getState().addToast({ type: 'info', message: 'This is an inferred relationship. Turn off "Heuristic Relations" in Settings to hide it.' });
      return;
    }
    if (window.confirm('Delete this relationship connection?')) {
      deleteRelationship(edge.id);
    }
  };

  const { setCenter } = useReactFlow();

  const handleFocusTable = (tableId: string) => {
    const targetNode = nodes.find(n => n.id === tableId);
    if (targetNode) {
      // Smooth fly-to animation targeting the node center (Node Width 240, height dynamically calculated)
      const x = targetNode.position.x + 120;
      const y = targetNode.position.y + (60 + targetNode.data.columns.length * 28) / 2;
      setCenter(x, y, { zoom: 1.1, duration: 800 });
    }
  };

  return (
    <div className="erd-canvas-container" style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Canvas Area */}
      <div style={{ flexGrow: 1, height: '100%', position: 'relative' }}>
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

      {/* Sidebar Explorer */}
      {schema && schema.tables.length > 0 && (
        <div 
          className="erd-sidebar-explorer glass-panel"
          style={{
            width: '240px',
            borderLeft: '1px solid var(--color-border)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-indigo)" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M7 4h2M4 7v2M12 7v2"/></svg>
            <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>Table Explorer</strong>
          </div>
          
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {schema.tables.map((t) => {
                const color = tableColors[t.id] || '#6366f1';
                return (
                  <button
                    key={t.id}
                    onClick={() => handleFocusTable(t.id)}
                    className="erd-explorer-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '4px',
                      width: '100%',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <span 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: color,
                        boxShadow: `0 0 4px ${color}88`,
                        flexShrink: 0
                      }} 
                    />
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        {t.columns.length} columns
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ERDCanvas: React.FC = () => {
  return <ERDCanvasContent />;
};

export default ERDCanvas;
