import React, { useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls,
  MiniMap,
  ReactFlowProvider,
} from '@xyflow/react';
import { useSchemaStore } from '../../store/useSchemaStore';
import { LineageNode } from './LineageNode';
import { useSqlEditor } from './useSqlEditor';
import { useDataLineageFlow } from './hooks/useDataLineageFlow';
import { DataLineageSidebar } from './DataLineageSidebar';
import '@xyflow/react/dist/style.css';
import './DataLineage.css';

const nodeTypes = {
  lineageNode: LineageNode
};

export interface DataLineageProps {
  onSwitchToDiagram?: () => void;
}

const DataLineageInner: React.FC<DataLineageProps> = ({ onSwitchToDiagram }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { showMiniMap, showGrid, activeLineageProcedureIndex, setActiveLineageProcedureIndex, ignoredLineageTables, setIgnoredLineageTables, showSidebarExplorer } = useSchemaStore();

  const { procedureSql, setProcedureSql, editorRef, viewRef } = useSqlEditor(`-- Sample ETL Stored Procedure
INSERT INTO sales_summary (customer_name, revenue)
SELECT u.name, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id;`, showSidebarExplorer);

  const {
    nodes, edges, onNodesChange, onEdgesChange, onNodeClick,
    selectedNodeId, setSelectedNodeId, columnsInvolved, handleInspectInDiagram,
    handleAnalyze, parsedProcedures, setCenter, getZoom
  } = useDataLineageFlow(procedureSql, viewRef, onSwitchToDiagram);

  return (
    <div className="lineage-container">
      {showSidebarExplorer && (
        <DataLineageSidebar 
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
          parsedProcedures={parsedProcedures}
          activeLineageProcedureIndex={activeLineageProcedureIndex}
          setActiveLineageProcedureIndex={setActiveLineageProcedureIndex}
          ignoredLineageTables={ignoredLineageTables}
          setIgnoredLineageTables={setIgnoredLineageTables}
          handleAnalyze={handleAnalyze}
          editorRef={editorRef}
          viewRef={viewRef}
          setProcedureSql={setProcedureSql}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          setCenter={setCenter}
          getZoom={getZoom}
          columnsInvolved={columnsInvolved}
          handleInspectInDiagram={handleInspectInDiagram}
        />
      )}
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
          {showGrid && <Background color="rgba(255, 255, 255, 0.05)" gap={20} size={1} />}
          {showMiniMap && (
            <MiniMap 
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              nodeColor={(n) => {
                const nt = n.data?.nodeTypeOverride || n.data?.role;
                if (nt === 'temp') return 'rgba(236, 72, 153, 0.5)';
                if (nt === 'source') return 'rgba(16, 185, 129, 0.5)';
                if (nt === 'target') return 'rgba(99, 102, 241, 0.5)';
                if (nt === 'view') return 'rgba(168, 85, 247, 0.5)';
                return 'var(--color-border)';
              }}
              maskColor="rgba(0, 0, 0, 0.4)"
            />
          )}
          <Controls style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
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
