import React, { useState, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import { parseLineage } from '../../utils/lineageParser';
import '@xyflow/react/dist/style.css';
import './DataLineage.css';

export const DataLineage: React.FC = () => {
  const [procedureSql, setProcedureSql] = useState<string>(`-- Sample ETL Stored Procedure
INSERT INTO sales_summary (customer_name, revenue)
SELECT u.name, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id;`);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = () => {
    const result = parseLineage(procedureSql);
    const newNodes: any[] = [];
    const newEdges: any[] = [];

    // Layout source nodes on the left
    result.sources.forEach((src, idx) => {
      const relatedFlows = result.flows.filter(f => f.sourceTable === src);
      newNodes.push({
        id: src,
        type: 'default',
        position: { x: 80, y: 50 + idx * 180 },
        data: { 
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
          width: 220, 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--color-border)', 
          color: 'var(--color-text-primary)', 
          borderRadius: '6px',
          padding: 0
        }
      });
    });

    // Layout target nodes on the right
    result.targets.forEach((tgt, idx) => {
      const relatedFlows = result.flows.filter(f => f.targetTable === tgt);
      newNodes.push({
        id: tgt,
        type: 'default',
        position: { x: 480, y: 50 + idx * 180 },
        data: { 
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
          width: 220, 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--color-border)', 
          color: 'var(--color-text-primary)', 
          borderRadius: '6px',
          padding: 0
        }
      });
    });

    // Connect edges
    result.flows.forEach((flow, idx) => {
      newEdges.push({
        id: `e-${flow.sourceTable}-${flow.targetTable}-${idx}`,
        source: flow.sourceTable,
        target: flow.targetTable,
        label: flow.sourceCol === '*' ? 'Full Flow' : `${flow.sourceCol} ➜ ${flow.targetCol}`,
        style: { stroke: 'var(--color-indigo)', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-indigo)' }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setProcedureSql(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  useEffect(() => {
    handleAnalyze();
  }, [procedureSql]);

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
        <textarea
          className="lineage-textarea"
          value={procedureSql}
          onChange={(e) => setProcedureSql(e.target.value)}
          placeholder="Paste or write your INSERT INTO / SELECT stored procedure queries here..."
        />
      </div>
      <div className="lineage-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
