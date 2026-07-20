import { buildLineageGraph } from '../buildLineageGraph';

self.onmessage = (e: MessageEvent) => {
  const { procedures, direction, expandedNodesArray, ignoredTables, viewMode } = e.data;
  
  try {
    const expandedNodes = new Set<string>(expandedNodesArray || []);
    const { newNodes, newEdges } = buildLineageGraph(procedures, direction, expandedNodes, ignoredTables, viewMode);
    
    self.postMessage({ type: 'SUCCESS', payload: { newNodes, newEdges } });
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', error: error.message || 'Unknown error' });
  }
};
