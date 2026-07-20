import { buildLineageGraph } from '../buildLineageGraph';

console.log('[Worker] lineageWorker script loaded successfully!');

self.onmessage = (e: MessageEvent) => {
  console.log('[Worker] Received message to process:', e.data);
  const { procedures, direction, expandedNodesArray, ignoredTables, viewMode } = e.data;
  
  try {
    const t0 = performance.now();
    const expandedNodes = new Set<string>(expandedNodesArray || []);
    console.log('[Worker] Starting buildLineageGraph...');
    const { newNodes, newEdges } = buildLineageGraph(procedures, direction, expandedNodes, ignoredTables, viewMode);
    const t1 = performance.now();
    console.log(`[Worker] Graph built in ${t1 - t0}ms. Nodes: ${newNodes.length}, Edges: ${newEdges.length}`);
    
    console.log('[Worker] Posting message back to main thread...');
    self.postMessage({ type: 'SUCCESS', payload: { newNodes, newEdges } });
    console.log('[Worker] PostMessage complete.');
  } catch (error: any) {
    console.error('[Worker] Error during graph build:', error);
    self.postMessage({ type: 'ERROR', error: error.message || 'Unknown error' });
  }
};
