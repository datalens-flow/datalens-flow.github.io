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

export const buildLineageGraph = (procedureSql: string) => {
  const result = parseLineage(procedureSql);
  const newNodes: any[] = [];
  const newEdges: any[] = [];

  const sourceOnly: string[] = [];
  const targetOnly: string[] = [];
  const bothTables: string[] = [];

  const allTables = new Set([...result.sources, ...result.targets]);
  allTables.forEach(table => {
    const isSrc = result.sources.includes(table);
    const isTgt = result.targets.includes(table);
    if (isSrc && isTgt) bothTables.push(table);
    else if (isSrc) sourceOnly.push(table);
    else targetOnly.push(table);
  });

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

  const COL_WIDTH = 250;
  const ROW_HEIGHT = 45;
  const COLUMN_GAP = 150;

  const COL_X_SOURCE = 50;
  const COL_X_BOTH = COL_X_SOURCE + COL_WIDTH + COLUMN_GAP;
  const COL_X_TARGET = COL_X_BOTH + COL_WIDTH + COLUMN_GAP;

  const createColumnNodes = (tablesList: string[], startX: number, role: 'source' | 'target' | 'both') => {
    let currentY = 50;
    tablesList.forEach(table => {
      const columns = getColumnsForTable(table);
      const nodeHeight = 50 + columns.length * ROW_HEIGHT;
      newNodes.push({
        id: table,
        type: 'lineageNode',
        position: { x: startX, y: currentY },
        data: { tableName: table, columns, role },
        style: {
          width: COL_WIDTH,
          background: 'var(--bg-secondary)',
          border: `1px solid var(--color-border)`,
          borderRadius: '6px',
          color: 'var(--color-text-primary)',
        }
      });
      currentY += nodeHeight + 40;
    });
  };

  createColumnNodes(sourceOnly, COL_X_SOURCE, 'source');
  createColumnNodes(bothTables, COL_X_BOTH, 'both');
  createColumnNodes(targetOnly, COL_X_TARGET, 'target');

  const allSourceTables = [...new Set(result.flows.map(f => f.sourceTable))];
  const sourceColorMap: Record<string, string> = {};
  allSourceTables.forEach((src, idx) => {
    sourceColorMap[src] = EDGE_COLORS[idx % EDGE_COLORS.length];
  });

  result.flows.forEach((flow, idx) => {
    const sourceCol = flow.sourceCol === '*' ? 'All Columns' : flow.sourceCol;
    const targetCol = flow.targetCol === '*' ? 'All Columns' : flow.targetCol;
    const edgeColor = sourceColorMap[flow.sourceTable] || '#38bdf8';

    newEdges.push({
      id: `e-${flow.sourceTable}-${flow.targetTable}-${sourceCol}-${targetCol}-${idx}`,
      source: flow.sourceTable,
      target: flow.targetTable,
      sourceHandle: `col-${sourceCol}`,
      targetHandle: `col-${targetCol}`,
      type: 'smoothstep',
      style: { stroke: edgeColor, strokeWidth: 1.5, opacity: 0.8 },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 12, height: 12 }
    });
  });

  return { newNodes, newEdges };
};
