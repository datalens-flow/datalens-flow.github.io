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
  const { schema, nodePositions, updateNodePosition } = useSchemaStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  // Compute Layout on parse
  useEffect(() => {
    if (!schema) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      schema.tables,
      schema.relationships
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
  }, [schema]);

  const handleNodeDragStop = (_event: any, node: any) => {
    updateNodePosition(node.id, node.position.x, node.position.y);
  };

  return (
    <div className="erd-canvas-container">
      {/* SVG Cardinality Defs */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* One cardinality indicator: two vertical slashes */}
          <marker
            id="one-cardinality"
            markerWidth="12"
            markerHeight="12"
            refX="0"
            refY="6"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M 3,2 L 3,10 M 7,2 L 7,10" stroke="#6366f1" strokeWidth="2" fill="none" />
          </marker>

          {/* Many cardinality indicator: crow's foot fork + slash */}
          <marker
            id="many-cardinality"
            markerWidth="16"
            markerHeight="16"
            refX="16"
            refY="8"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            {/* The fork lines */}
            <path d="M 16,8 L 4,2 M 16,8 L 4,14 M 4,8 L 16,8" stroke="#6366f1" strokeWidth="2" fill="none" />
            {/* Single vertical line before the fork */}
            <path d="M 0,3 L 0,13" stroke="#6366f1" strokeWidth="2" fill="none" />
          </marker>
        </defs>
      </svg>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background color="#334155" gap={16} size={1} />
        <Controls style={{ background: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }} />
        <MiniMap 
          style={{ background: '#0f172a' }} 
          nodeColor="#1e293b" 
          maskColor="rgba(0, 0, 0, 0.4)" 
        />
      </ReactFlow>
    </div>
  );
};
export default ERDCanvas;
