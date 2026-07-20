import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import { useSchemaStore } from '../../../store/useSchemaStore';
import { useToastStore } from '../../../store/useToastStore';
import { buildLineageGraph } from '../buildLineageGraph';
import { splitProcedures } from '../../../utils/lineage/procedureSplitter';
import { parseLineage } from '../../../utils/lineageParser';

export const useDataLineageFlow = (procedureSql: string, viewRef: any, onSwitchToDiagram?: () => void) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const { fitView, setCenter, getZoom } = useReactFlow();

  const { 
    layoutDir, 
    activeLineageProcedureIndex, 
    ignoredLineageTables,
    lineageSearchQuery
  } = useSchemaStore();

  const parsedProcedures = useMemo(() => splitProcedures(procedureSql), [procedureSql]);

  const activeProcedures = useMemo(() => {
    if (activeLineageProcedureIndex === 0 || parsedProcedures.length === 0) {
      return parsedProcedures.length > 0 ? parsedProcedures : [{ name: 'Global Script', sql: procedureSql }];
    }
    const idx = activeLineageProcedureIndex - 1;
    if (idx >= 0 && idx < parsedProcedures.length) {
      return [parsedProcedures[idx]];
    }
    return [{ name: 'Global Script', sql: procedureSql }];
  }, [procedureSql, parsedProcedures, activeLineageProcedureIndex]);

  const onToggleCollapse = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedNodes(new Set(nodes.map(n => n.id)));
  }, [nodes]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  useEffect(() => {
    window.addEventListener('lineage-expand-all', handleExpandAll);
    window.addEventListener('lineage-collapse-all', handleCollapseAll);
    return () => {
      window.removeEventListener('lineage-expand-all', handleExpandAll);
      window.removeEventListener('lineage-collapse-all', handleCollapseAll);
    };
  }, [handleExpandAll, handleCollapseAll]);

  const { lineageViewMode } = useSchemaStore();

  const handleAnalyze = useCallback(() => {
    try {
      const ignoredArr = ignoredLineageTables.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const { newNodes, newEdges } = buildLineageGraph(activeProcedures, layoutDir, expandedNodes, ignoredArr, lineageViewMode);
      const nodesWithCallback = newNodes.map(n => ({
        ...n, data: { ...n.data, onToggleCollapse }
      }));
      setNodes(nodesWithCallback);
      setEdges(newEdges);
      setSelectedNodeId(null);
      setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
    } catch (err: any) {
      console.error(err);
      useToastStore.getState().addToast({ type: 'error', message: 'Failed to analyze lineage: ' + (err.message || 'Unknown error') });
    }
  }, [activeProcedures, layoutDir, expandedNodes, ignoredLineageTables, onToggleCollapse, setNodes, setEdges, fitView, lineageViewMode]);

  useEffect(() => {
    handleAnalyze();
  }, [layoutDir, expandedNodes, activeProcedures, ignoredLineageTables, lineageViewMode]);

  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => {
        if (!selectedNodeId) return { ...node, style: { ...node.style, opacity: 1 } };
        const isConnected = edges.some(edge => 
          (edge.source === selectedNodeId && edge.target === node.id) ||
          (edge.target === selectedNodeId && edge.source === node.id)
        );
        if (node.id === selectedNodeId || isConnected) return { ...node, style: { ...node.style, opacity: 1 } };
        return { ...node, style: { ...node.style, opacity: 0.2 } };
      })
    );
  }, [selectedNodeId, edges, setNodes]);

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
      if (n.id.toLowerCase().includes(lower)) matchIds.add(n.id);
      else if (n.data?.columns?.some((c: any) => (c.name || '').toLowerCase().includes(lower))) matchIds.add(n.id);
    });

    setNodes(nds => nds.map(n => ({ ...n, style: { ...n.style, opacity: matchIds.has(n.id) ? 1 : 0.15 } })));
    setEdges(eds => eds.map(e => ({ ...e, style: { ...e.style, opacity: matchIds.has(e.source) || matchIds.has(e.target) ? 0.8 : 0.08 } })));

    if (matchIds.size > 0) {
      const firstMatch = nodes.find(n => matchIds.has(n.id));
      if (firstMatch) {
        const x = firstMatch.position.x + 100;
        const y = firstMatch.position.y + 60;
        setCenter(x, y, { zoom: getZoom() || 0.85, duration: 300 });
      }
    }
  }, [lineageSearchQuery, nodes, setNodes, setEdges, setCenter, getZoom]);

  const onNodeClick = (_: React.MouseEvent, node: any) => {
    if (node.type === 'group') return;
    setSelectedNodeId(prev => prev === node.id ? null : node.id);
    if (viewRef.current) {
      const docStr = viewRef.current.state.doc.toString().toLowerCase();
      const searchStr = node.id.toLowerCase();
      const regex = new RegExp(`\\b${searchStr.replace(/\\./g, '\\\\.')}\\b`);
      const match = docStr.match(regex);
      if (match && match.index !== undefined) {
        viewRef.current.dispatch({ selection: { anchor: match.index, head: match.index + searchStr.length }, scrollIntoView: true });
        viewRef.current.focus();
      }
    }
  };

  const handleInspectInDiagram = () => {
    if (!selectedNodeId) return;
    const { setActiveTab, setSearchQuery } = useSchemaStore.getState();
    setActiveTab('erd');
    setSearchQuery(selectedNodeId);
    if (onSwitchToDiagram) onSwitchToDiagram();
  };

  const columnsInvolved = new Set<string>();
  if (selectedNodeId) {
    let allFlows: any[] = [];
    activeProcedures.forEach(p => {
      allFlows.push(...parseLineage(p.sql).flows);
    });
    allFlows.forEach(f => {
      if (f.sourceTable === selectedNodeId) columnsInvolved.add(f.sourceCol === '*' ? 'All Columns' : f.sourceCol);
      if (f.targetTable === selectedNodeId) columnsInvolved.add(f.targetCol === '*' ? 'All Columns' : f.targetCol);
    });
  }

  const selectedNodeData = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  return {
    nodes, edges, onNodesChange, onEdgesChange, onNodeClick,
    selectedNodeId, setSelectedNodeId, selectedNodeData, columnsInvolved, handleInspectInDiagram,
    handleAnalyze, parsedProcedures, activeProcedures, setCenter, getZoom
  };
};
