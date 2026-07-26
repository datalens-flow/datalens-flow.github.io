import React, { useState, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls,
  MiniMap,
  ReactFlowProvider,
  BackgroundVariant,
  useReactFlow
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
import { LineageEmptyState } from './LineageEmptyState';
import { LineageFilterBar } from './LineageFilterBar';
import { ImpactPanel } from './ImpactPanel';
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
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showImpactPanel, setShowImpactPanel] = useState(false);
  const { getViewport } = useReactFlow();

  const { 
    showMiniMap, showGrid, activeLineageProcedureIndex, setActiveLineageProcedureIndex, 
    ignoredLineageTables, setIgnoredLineageTables, showSidebarExplorer,
    showGlobalSearchModal, setShowGlobalSearchModal,
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
  } = useDataLineageFlow(procedureSql, viewRef, onSwitchToDiagram, isFocusMode);

  // Load SQL from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#sql=')) {
      try {
        const encoded = hash.slice(5);
        const decoded = decodeURIComponent(atob(encoded));
        if (decoded.trim()) {
          setProcedureSql(decoded);
        }
      } catch (e) {
        console.warn('Failed to decode SQL from URL hash', e);
      }
    }
  }, []);

  // Auto-exit Focus Mode when user deselects a node
  useEffect(() => {
    if (!selectedNodeId && isFocusMode) {
      setIsFocusMode(false);
    }
  }, [selectedNodeId, isFocusMode]);

  const handleShareLink = () => {
    const encoded = btoa(encodeURIComponent(procedureSql));
    const url = `${window.location.origin}${window.location.pathname}#sql=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      // Show a brief toast/notification
      const toast = document.createElement('div');
      toast.textContent = '✓ Link copied!';
      toast.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;background:#10b981;color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;animation:fadeIn 0.2s';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    });
  };


  // Export canvas as PNG by capturing ReactFlow viewport DOM
  const handleExportPng = () => {
    const flowEl = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    const container = document.querySelector('.react-flow') as HTMLElement | null;
    if (!flowEl || !container) return;
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const { x, y, zoom } = getViewport();
    // Use XMLSerializer to capture the rendered SVG/HTML tree as a data URL
    const data = new XMLSerializer().serializeToString(flowEl);
    const svgBlob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" style="transform:translate(${x}px,${y}px) scale(${zoom});transform-origin:0 0;">${data}</div></foreignObject></svg>`], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w * 2; c.height = h * 2;
      const ctx = c.getContext('2d')!;
      ctx.scale(2, 2);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0f172a';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      c.toBlob(b => {
        if (!b) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = `lineage-${new Date().toISOString().slice(0, 10)}.png`;
        a.click();
      }, 'image/png');
    };
    img.src = url;
  };

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

        {/* Welcome Empty State — shown when no table nodes exist yet */}
        {nodes.filter(n => n.type === 'lineageNode').length === 0 && !isAnalyzing && (
          <LineageEmptyState
            onFocusEditor={() => {
              if (!showSidebarExplorer) {
                const { setShowSidebarExplorer } = useSchemaStore.getState();
                setShowSidebarExplorer(true);
              }
              setTimeout(() => viewRef.current?.focus(), 150);
            }}
            onImport={() => setIsRepoModalOpen(true)}
          />
        )}

        {/* Unified Filter Bar — legend + filters + actions merged */}
        {nodes.filter(n => n.type === 'lineageNode').length > 0 && (
          <LineageFilterBar
            hasSelection={!!selectedNodeId}
            onFocusMode={() => setIsFocusMode(true)}
            isFocusMode={isFocusMode}
            onExitFocus={() => setIsFocusMode(false)}
            nodeCount={nodes.filter(n => n.type === 'lineageNode' && !n.hidden).length}
            onToggleImpact={() => setShowImpactPanel(p => !p)}
            showImpactPanel={showImpactPanel}
            onExportPng={handleExportPng}
            onShare={handleShareLink}
          />
        )}

        {/* Impact Analysis Panel */}
        {showImpactPanel && selectedNodeId && (
          <ImpactPanel
            selectedNodeId={selectedNodeId}
            nodes={nodes}
            edges={edges}
            onClose={() => setShowImpactPanel(false)}
            onSelectNode={(id) => setSelectedNodeId(id)}
          />
        )}

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
