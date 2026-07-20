import dagre from '@dagrejs/dagre';
import { MarkerType } from '@xyflow/react';
import { parseLineage } from '../../utils/lineageParser';
import { ColInfo } from './LineageNode';

const EDGE_COLORS = [
  '#38bdf8', // sky blue
  '#34d399', // emerald
  '#a78bfa', // violet
  '#fb923c', // orange
  '#f472b6', // pink
  '#facc15', // yellow
  '#2dd4bf', // teal
  '#818cf8', // indigo
];

export const buildLineageGraph = (
  procedureSql: string, 
  direction: 'LR' | 'TB' = 'LR',
  collapsedNodes: Set<string> = new Set()
) => {
  const result = parseLineage(procedureSql);
  const newNodes: any[] = [];
  const newEdges: any[] = [];

  const allTables = new Set([...result.sources, ...result.targets]);

  const getColumnsForTable = (table: string): ColInfo[] => {
    const incomingCols = new Set<string>();
    const outgoingCols = new Set<string>();

    result.flows.forEach(f => {
      if (f.targetTable === table) {
        incomingCols.add(f.targetCol === '*' ? 'All Columns' : f.targetCol);
      }
      if (f.sourceTable === table) {
        outgoingCols.add(f.sourceCol === '*' ? 'All Columns' : f.sourceCol);
      }
    });

    const allCols: ColInfo[] = [];
    const seen = new Set<string>();

    incomingCols.forEach(col => {
      seen.add(col);
      allCols.push({ name: col, hasLeft: true, hasRight: outgoingCols.has(col) });
    });
    outgoingCols.forEach(col => {
      if (!seen.has(col)) {
        allCols.push({ name: col, hasLeft: false, hasRight: true });
      }
    });

    return allCols;
  };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 150 });

  const COL_WIDTH = 250;
  const ROW_HEIGHT = 45;
  const MAX_COLS_VISIBLE = 5;

  allTables.forEach(table => {
    const isSrc = result.sources.includes(table);
    const isTgt = result.targets.includes(table);
    const role = isSrc && isTgt ? 'both' : (isSrc ? 'source' : 'target');
    
    const columns = getColumnsForTable(table);
    const isCollapsed = collapsedNodes.has(table);
    const visibleColsCount = isCollapsed ? Math.min(columns.length, MAX_COLS_VISIBLE) : columns.length;
    const hasMoreButton = isCollapsed && columns.length > MAX_COLS_VISIBLE;
    
    const nodeHeight = 50 + (visibleColsCount * ROW_HEIGHT) + (hasMoreButton ? 30 : 0);
    
    dagreGraph.setNode(table, { width: COL_WIDTH, height: nodeHeight });

    newNodes.push({
      id: table,
      type: 'lineageNode',
      position: { x: 0, y: 0 },
      data: { tableName: table, columns, role, isCollapsed },
      style: {
        width: COL_WIDTH,
        background: 'var(--bg-secondary)',
        border: `1px solid var(--color-border)`,
        borderRadius: '6px',
        color: 'var(--color-text-primary)',
      }
    });
  });

  const tableLevelEdges = new Set<string>();
  result.flows.forEach(flow => {
    const edgeId = `${flow.sourceTable}-${flow.targetTable}`;
    if (!tableLevelEdges.has(edgeId)) {
      tableLevelEdges.add(edgeId);
      dagreGraph.setEdge(flow.sourceTable, flow.targetTable);
    }
  });

  dagre.layout(dagreGraph);

  newNodes.forEach(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - COL_WIDTH / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    };
  });

  const allSourceTables = [...new Set(result.flows.map(f => f.sourceTable))];
  const sourceColorMap: Record<string, string> = {};
  allSourceTables.forEach((src, idx) => {
    sourceColorMap[src] = EDGE_COLORS[idx % EDGE_COLORS.length];
  });

  result.flows.forEach((flow, idx) => {
    const sourceCol = flow.sourceCol === '*' ? 'All Columns' : flow.sourceCol;
    const targetCol = flow.targetCol === '*' ? 'All Columns' : flow.targetCol;
    const edgeColor = sourceColorMap[flow.sourceTable] || '#38bdf8';

    // If a node is collapsed and the column is beyond MAX_COLS_VISIBLE, we route the edge to the header handle 'header'
    const srcCols = getColumnsForTable(flow.sourceTable);
    const tgtCols = getColumnsForTable(flow.targetTable);
    
    const srcColIdx = srcCols.findIndex(c => c.name === sourceCol);
    const tgtColIdx = tgtCols.findIndex(c => c.name === targetCol);
    
    const isSrcCollapsed = collapsedNodes.has(flow.sourceTable) && srcColIdx >= MAX_COLS_VISIBLE;
    const isTgtCollapsed = collapsedNodes.has(flow.targetTable) && tgtColIdx >= MAX_COLS_VISIBLE;

    newEdges.push({
      id: `e-${flow.sourceTable}-${flow.targetTable}-${sourceCol}-${targetCol}-${idx}`,
      source: flow.sourceTable,
      target: flow.targetTable,
      sourceHandle: isSrcCollapsed ? 'col-header' : `col-${sourceCol}`,
      targetHandle: isTgtCollapsed ? 'col-header' : `col-${targetCol}`,
      type: 'smoothstep',
      style: { stroke: edgeColor, strokeWidth: 1.5, opacity: 0.8 },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 12, height: 12 }
    });
  });

  return { newNodes, newEdges };
};
