import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import { useSchemaStore } from '../../../store/useSchemaStore';
import { useToastStore } from '../../../store/useToastStore';
import { splitProcedures } from '../../../utils/lineage/procedureSplitter';
import { parseLineage } from '../../../utils/lineageParser';
import { buildLineageGraph } from '../buildLineageGraph';
import { FormulaInspectorData } from '../FormulaInspectorDrawer';
// @ts-ignore
import LineageWorker from '../workers/lineageWorker?worker';

export const useDataLineageFlow = (procedureSql: string, viewRef: any, onSwitchToDiagram?: () => void) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const { fitView, setCenter, getZoom } = useReactFlow();

  const { 
    layoutDir, 
    activeLineageProcedureIndex, 
    ignoredLineageTables,
    lineageSearchQuery,
    showProcedureGroups
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
      workerRef.current?.terminate();
    };
  }, [handleExpandAll, handleCollapseAll]);

  const { lineageViewMode } = useSchemaStore();

  const handleAnalyze = useCallback(() => {
    console.log('[Main] handleAnalyze called');
    const ignoredArr = ignoredLineageTables.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    const runSynchronousFallback = (reason: string) => {
      console.warn(`[Main] Falling back to synchronous layout calculation. Reason: ${reason}`);
      try {
        const t0 = performance.now();
        const { newNodes, newEdges } = buildLineageGraph(
          activeProcedures,
          layoutDir,
          expandedNodes,
          ignoredArr,
          lineageViewMode,
          showProcedureGroups
        );
        const t1 = performance.now();
        console.log(`[Main] Synced Graph built in ${t1 - t0}ms. Nodes: ${newNodes.length}, Edges: ${newEdges.length}`);
        
        if (newNodes.length > 30 && lineageViewMode !== 'overview') {
          console.log('[Main] Large graph detected in sync fallback. Switching to overview mode.');
          useToastStore.getState().addToast({ type: 'info', message: 'Large graph detected. Switched to Overview Mode for better performance.' });
          useSchemaStore.getState().setLineageViewMode('overview');
          return;
        }

        const nodesWithCallback = newNodes.map((n: any) => ({
          ...n, data: { ...n.data, onToggleCollapse }
        }));
        setNodes(nodesWithCallback);
        setEdges(newEdges);
        setSelectedNodeId(null);
        setIsAnalyzing(false);
        setTimeout(() => {
          fitView({ padding: 0.15, duration: 400 });
        }, 50);
      } catch (err: any) {
        console.error('[Main] Sync fallback failed:', err);
        setIsAnalyzing(false);
        useToastStore.getState().addToast({ type: 'error', message: 'Failed to analyze lineage: ' + (err.message || 'Unknown error') });
      }
    };

    try {
      console.log('[Main] Terminating old worker (if any)...');
      workerRef.current?.terminate();
      
      console.log('[Main] Initializing new Worker...');
      const worker = new LineageWorker();
      workerRef.current = worker;
      setIsAnalyzing(true);

      let workerIsResponsive = false;
      
      // Fallback timer: if worker doesn't say PONG within 150ms, run sync fallback
      const fallbackTimeout = setTimeout(() => {
        if (!workerIsResponsive) {
          worker.terminate();
          runSynchronousFallback('Worker did not respond to PING within 150ms');
        }
      }, 150);

      worker.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'PONG') {
          console.log('[Main] Received PONG from worker. Worker is active!');
          workerIsResponsive = true;
          clearTimeout(fallbackTimeout);
          return;
        }

        console.log('[Main] Received message from worker:', e.data.type);
        setIsAnalyzing(false);
        worker.terminate();
        if (e.data.type === 'SUCCESS') {
          const { newNodes, newEdges } = e.data.payload;
          
          if (newNodes.length > 30 && lineageViewMode !== 'overview') {
            console.log('[Main] Large graph detected. Switching to overview mode.');
            useToastStore.getState().addToast({ type: 'info', message: 'Large graph detected. Switched to Overview Mode for better performance.' });
            useSchemaStore.getState().setLineageViewMode('overview');
            return;
          }
          
          const nodesWithCallback = newNodes.map((n: any) => ({
            ...n, data: { ...n.data, onToggleCollapse }
          }));
          setNodes(nodesWithCallback);
          setEdges(newEdges);
          setSelectedNodeId(null);
          setTimeout(() => {
            fitView({ padding: 0.15, duration: 400 });
          }, 50);
        } else {
          console.error('[Main] Worker returned ERROR:', e.data.error);
          runSynchronousFallback(`Worker error: ${e.data.error}`);
        }
      };

      worker.onerror = (err: any) => {
        console.error('[Main] Worker initialization failed or crashed:', err);
        clearTimeout(fallbackTimeout);
        worker.terminate();
        runSynchronousFallback('Worker error event triggered');
      };

      // 1. Send PING to check responsiveness
      worker.postMessage({ type: 'PING' });

      // 2. Send actual job
      console.log('[Main] Posting analysis task to worker...', { activeProceduresLength: activeProcedures.length });
      worker.postMessage({
        procedures: activeProcedures,
        direction: layoutDir,
        expandedNodesArray: Array.from(expandedNodes),
        ignoredTables: ignoredArr,
        viewMode: lineageViewMode,
        showProcedureGroups
      });
      
    } catch (err: any) {
      console.error('[Main] Failed to start lineage worker (catch block):', err);
      runSynchronousFallback(`Worker instantiation failed: ${err.message || 'Unknown error'}`);
    }
  }, [activeProcedures, layoutDir, expandedNodes, ignoredLineageTables, onToggleCollapse, setNodes, setEdges, fitView, lineageViewMode, showProcedureGroups]);


  useEffect(() => {
    handleAnalyze();
  }, [layoutDir, expandedNodes, activeProcedures, ignoredLineageTables, lineageViewMode, showProcedureGroups]);

  const { traceMode } = useSchemaStore();

  const pathTracingData = useMemo(() => {
    const upNodes = new Set<string>();
    const downNodes = new Set<string>();
    const upEdges = new Set<string>();
    const downEdges = new Set<string>();

    if (!selectedNodeId) {
      return { upNodes, downNodes, upEdges, downEdges };
    }

    // Traverse Upstream (Sources feeding into selectedNodeId)
    const queueUp = [selectedNodeId];
    while (queueUp.length > 0) {
      const curr = queueUp.shift()!;
      edges.forEach(e => {
        if (e.target === curr && !upNodes.has(e.source)) {
          upNodes.add(e.source);
          upEdges.add(e.id);
          queueUp.push(e.source);
        }
      });
    }

    // Traverse Downstream (Targets fed by selectedNodeId)
    const queueDown = [selectedNodeId];
    while (queueDown.length > 0) {
      const curr = queueDown.shift()!;
      edges.forEach(e => {
        if (e.source === curr && !downNodes.has(e.target)) {
          downNodes.add(e.target);
          downEdges.add(e.id);
          queueDown.push(e.target);
        }
      });
    }

    return { upNodes, downNodes, upEdges, downEdges };
  }, [selectedNodeId, edges]);

  useEffect(() => {
    if (!selectedNodeId) {
      setNodes(nds => nds.map(n => ({
        ...n,
        style: {
          ...n.style,
          opacity: 1,
          boxShadow: undefined,
          borderColor: n.data?.isTemp ? 'var(--color-indigo)' : (n.data?.isView ? 'var(--color-purple)' : 'var(--color-border)')
        }
      })));
      setEdges(eds => eds.map(e => ({
        ...e,
        style: { ...e.style, opacity: 0.8, strokeWidth: 1.5 }
      })));
      return;
    }

    const { upNodes, downNodes, upEdges, downEdges } = pathTracingData;

    const showUpstream = traceMode === 'both' || traceMode === 'upstream' || traceMode === 'all';
    const showDownstream = traceMode === 'both' || traceMode === 'downstream' || traceMode === 'all';

    setNodes(nds => nds.map(node => {
      if (node.id === selectedNodeId) {
        return {
          ...node,
          style: {
            ...node.style,
            opacity: 1,
            boxShadow: '0 0 20px #38bdf8, 0 0 40px rgba(56, 189, 248, 0.4)',
            borderColor: '#38bdf8'
          }
        };
      }

      const isUp = showUpstream && upNodes.has(node.id);
      const isDown = showDownstream && downNodes.has(node.id);

      if (isUp) {
        return {
          ...node,
          style: {
            ...node.style,
            opacity: 1,
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.6)',
            borderColor: '#10b981'
          }
        };
      }

      if (isDown) {
        return {
          ...node,
          style: {
            ...node.style,
            opacity: 1,
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.6)',
            borderColor: '#6366f1'
          }
        };
      }

      return {
        ...node,
        style: {
          ...node.style,
          opacity: 0.15,
          boxShadow: undefined
        }
      };
    }));

    setEdges(eds => eds.map(edge => {
      const isUp = showUpstream && upEdges.has(edge.id);
      const isDown = showDownstream && downEdges.has(edge.id);

      if (isUp) {
        return {
          ...edge,
          style: { ...edge.style, opacity: 1, stroke: '#10b981', strokeWidth: 2.5 }
        };
      }
      if (isDown) {
        return {
          ...edge,
          style: { ...edge.style, opacity: 1, stroke: '#6366f1', strokeWidth: 2.5 }
        };
      }
      return {
        ...edge,
        style: { ...edge.style, opacity: 0.08, strokeWidth: 1 }
      };
    }));
  }, [selectedNodeId, pathTracingData, traceMode, setNodes, setEdges]);

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

  const [inspectorData, setInspectorData] = useState<FormulaInspectorData | null>(null);

  useEffect(() => {
    const handleCursorWord = (e: any) => {
      const words = e.detail?.words as string[];
      if (!words || words.length === 0) return;
      const nodeIds = new Set(nodes.map(n => n.id.toLowerCase()));
      for (const w of words) {
        if (nodeIds.has(w.toLowerCase())) {
          const matched = nodes.find(n => n.id.toLowerCase() === w.toLowerCase());
          if (matched && matched.id !== selectedNodeId) {
            setSelectedNodeId(matched.id);
            break;
          }
        }
      }
    };

    window.addEventListener('sql-cursor-word', handleCursorWord);
    return () => window.removeEventListener('sql-cursor-word', handleCursorWord);
  }, [nodes, selectedNodeId]);

  const onEdgeClick = (_: React.MouseEvent, edge: any) => {
    let allFlows: any[] = [];
    activeProcedures.forEach(p => {
      allFlows.push(...parseLineage(p.sql).flows);
    });

    const matchedFlow = allFlows.find(f => 
      edge.id.includes(f.sourceTable) && edge.id.includes(f.targetTable)
    );

    if (matchedFlow) {
      setInspectorData({
        sourceTable: matchedFlow.sourceTable,
        sourceCol: matchedFlow.sourceCol,
        targetTable: matchedFlow.targetTable,
        targetCol: matchedFlow.targetCol,
        action: matchedFlow.action || 'insert',
        rawExpr: matchedFlow.rawExpr || `${matchedFlow.sourceCol}`,
        fileOrigin: matchedFlow.fileOrigin
      });
    }
  };

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
    nodes, edges, onNodesChange, onEdgesChange, onNodeClick, onEdgeClick,
    selectedNodeId, setSelectedNodeId, selectedNodeData, columnsInvolved, handleInspectInDiagram,
    handleAnalyze, parsedProcedures, activeProcedures, setCenter, getZoom, isAnalyzing,
    inspectorData, setInspectorData
  };
};
