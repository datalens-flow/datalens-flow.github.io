import React, { useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls,
  MiniMap,
  ReactFlowProvider,
  BackgroundVariant
} from '@xyflow/react';
import { useSchemaStore } from '../../store/useSchemaStore';
import { LineageNode } from './LineageNode';
import { ProcedureGroupNode } from './ProcedureGroupNode';
import { useSqlEditor } from './useSqlEditor';
import { useDataLineageFlow } from './hooks/useDataLineageFlow';
import { DataLineageSidebar } from './DataLineageSidebar';
import { MappingMatrixModal } from './MappingMatrixModal';
import { FormulaInspectorDrawer } from './FormulaInspectorDrawer';
import { RepoImportModal } from './RepoImportModal';
import { LineageDiffModal } from './LineageDiffModal';
import { AnnotationModal } from './AnnotationModal';
import { GlobalSearchModal } from './GlobalSearchModal';
import '@xyflow/react/dist/style.css';
import './DataLineage.css';

const nodeTypes = {
  lineageNode: LineageNode,
  group: ProcedureGroupNode
};

export interface DataLineageProps {
  onSwitchToDiagram?: () => void;
}

const DataLineageInner: React.FC<DataLineageProps> = ({ onSwitchToDiagram }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [annotationTargetKey, setAnnotationTargetKey] = useState<string | null>(null);

  const { 
    showMiniMap, showGrid, activeLineageProcedureIndex, setActiveLineageProcedureIndex, 
    ignoredLineageTables, setIgnoredLineageTables, showSidebarExplorer,
    showGlobalSearchModal, setShowGlobalSearchModal
  } = useSchemaStore();

  const { procedureSql, setProcedureSql, editorRef, viewRef } = useSqlEditor(`-- Sample ETL Stored Procedure
INSERT INTO sales_summary (customer_name, revenue)
SELECT u.name, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id;`, showSidebarExplorer);

  const {
    nodes, edges, onNodesChange, onEdgesChange, onNodeClick, onEdgeClick,
    selectedNodeId, setSelectedNodeId, columnsInvolved, handleInspectInDiagram,
    handleAnalyze, parsedProcedures, setCenter, getZoom, isAnalyzing,
    inspectorData, setInspectorData
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
          onOpenRepoModal={() => setIsRepoModalOpen(true)}
          onOpenAnnotationModal={(key) => setAnnotationTargetKey(key)}
        />
      )}
      <div className="lineage-canvas" style={{ position: 'relative' }}>
        {/* dbt DAG Legend Bar Overlay */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          color: 'var(--color-text-primary)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <span style={{ fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>dbt DAG Lineage Mode</span>
          </span>
          <div style={{ width: '1px', height: '14px', background: 'var(--color-border)' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            <span>Source</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#06b6d4' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} />
            <span>Staging [View]</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#818cf8' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8' }} />
            <span>Marts [Table/Incremental]</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f97316' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />
            <span>Exposure</span>
          </span>
        </div>

        {isAnalyzing && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold'
          }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            Analyzing SQL & Calculating dbt DAG Graph...
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          minZoom={0.1}
          maxZoom={2}
          fitView
        >
          {showGrid && <Background color="var(--color-grid)" variant={BackgroundVariant.Lines} gap={24} size={1} />}
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
      <MappingMatrixModal />
      <FormulaInspectorDrawer data={inspectorData} onClose={() => setInspectorData(null)} />
      <RepoImportModal isOpen={isRepoModalOpen} onClose={() => setIsRepoModalOpen(false)} />
      <LineageDiffModal />
      <AnnotationModal isOpen={!!annotationTargetKey} targetKey={annotationTargetKey} onClose={() => setAnnotationTargetKey(null)} />
      <GlobalSearchModal isOpen={showGlobalSearchModal} onClose={() => setShowGlobalSearchModal(false)} onSelectNode={(id) => setSelectedNodeId(id)} />
    </div>
  );
};

export const DataLineage: React.FC<DataLineageProps> = (props) => (
  <ReactFlowProvider>
    <DataLineageInner {...props} />
  </ReactFlowProvider>
);
export default DataLineage;
