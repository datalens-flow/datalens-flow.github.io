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
  procedures: { name: string; sql: string }[], 
  direction: 'LR' | 'TB' = 'LR',
  expandedNodes: Set<string> = new Set(),
  ignoredTables: string[] = []
) => {
  const newNodes: any[] = [];
  const newEdges: any[] = [];

  const ignoredSet = new Set(ignoredTables.map(t => t.trim().toLowerCase()).filter(t => t.length > 0));

  let combinedFlows: any[] = [];
  const tableRoles: Record<string, { isSource: boolean, isTarget: boolean }> = {};
  const tableProcedures = new Map<string, Set<string>>();

  procedures.forEach(proc => {
    const result = parseLineage(proc.sql);
    
    // Filter flows by ignored tables
    const validFlows = result.flows.filter(f => 
      !ignoredSet.has(f.sourceTable.toLowerCase()) && 
      !ignoredSet.has(f.targetTable.toLowerCase())
    );

    combinedFlows.push(...validFlows);

    const procTables = new Set<string>();
    validFlows.forEach(f => {
      procTables.add(f.sourceTable);
      procTables.add(f.targetTable);

      if (!tableRoles[f.sourceTable]) tableRoles[f.sourceTable] = { isSource: false, isTarget: false };
      if (!tableRoles[f.targetTable]) tableRoles[f.targetTable] = { isSource: false, isTarget: false };
      tableRoles[f.sourceTable].isSource = true;
      if (f.action !== 'delete' && f.action !== 'truncate' && f.action !== 'drop') {
         tableRoles[f.targetTable].isTarget = true;
      } else {
         tableRoles[f.targetTable].isTarget = true; // Still target of an action
      }
    });

    procTables.forEach(t => {
      if (!tableProcedures.has(t)) tableProcedures.set(t, new Set());
      tableProcedures.get(t)!.add(proc.name);
    });
  });

  const allTables = new Set(Array.from(tableProcedures.keys()));

  const getColumnsForTable = (table: string): ColInfo[] => {
    const incomingCols = new Set<string>();
    const outgoingCols = new Set<string>();

    combinedFlows.forEach(f => {
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

  const dagreGraph = new dagre.graphlib.Graph({ compound: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  // Increased spacing for complex/dense graphs
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 200 });

  const COL_WIDTH = 250;
  const ROW_HEIGHT = 45;
  const MAX_COLS_VISIBLE = 5;

  // Add group nodes for procedures
  const activeProcedures = new Set<string>();
  allTables.forEach(table => {
    const procs = tableProcedures.get(table);
    if (procs && procs.size === 1 && procedures.length > 1) {
      activeProcedures.add(procs.values().next().value!);
    }
  });

  activeProcedures.forEach(procName => {
    if (procName === 'Global Script') return;
    dagreGraph.setNode(`group-${procName}`, { label: procName, clusterLabelPos: 'top' });
    newNodes.push({
      id: `group-${procName}`,
      type: 'group',
      data: { label: procName },
      style: {
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
        border: '1px dashed var(--color-border)',
        borderRadius: '8px',
        width: 300,
        height: 300,
        zIndex: -1
      }
    });
  });

  allTables.forEach(table => {
    const roleObj = tableRoles[table];
    const isSrc = roleObj.isSource;
    const isTgt = roleObj.isTarget;
    const role = isSrc && isTgt ? 'both' : (isSrc ? 'source' : 'target');
    const isTemp = table.toLowerCase().startsWith('tmp_') || table.toLowerCase().startsWith('temp_') || table.startsWith('#');
    
    const columns = getColumnsForTable(table);
    const isCollapsed = !expandedNodes.has(table) && columns.length > MAX_COLS_VISIBLE;
    const visibleColsCount = isCollapsed ? Math.min(columns.length, MAX_COLS_VISIBLE) : columns.length;
    const hasMoreButton = isCollapsed && columns.length > MAX_COLS_VISIBLE;
    
    const nodeHeight = 50 + (visibleColsCount * ROW_HEIGHT) + (hasMoreButton ? 30 : 0);
    
    dagreGraph.setNode(table, { width: COL_WIDTH, height: nodeHeight });

    const procs = tableProcedures.get(table);
    let parentNodeId = undefined;
    if (procs && procs.size === 1 && procedures.length > 1) {
      const pName = procs.values().next().value!;
      if (pName !== 'Global Script') {
        parentNodeId = `group-${pName}`;
        dagreGraph.setParent(table, parentNodeId);
      }
    }

    newNodes.push({
      id: table,
      type: 'lineageNode',
      parentId: parentNodeId,
      extent: parentNodeId ? 'parent' : undefined,
      position: { x: 0, y: 0 },
      data: { tableName: table, columns, role, isCollapsed, isTemp },
      style: {
        width: COL_WIDTH,
        background: 'var(--bg-secondary)',
        border: isTemp ? '2px dashed var(--color-indigo)' : '1px solid var(--color-border)',
        borderRadius: '6px',
        color: 'var(--color-text-primary)',
      }
    });
  });

  const tableLevelEdges = new Set<string>();
  combinedFlows.forEach(flow => {
    const edgeId = `${flow.sourceTable}-${flow.targetTable}`;
    if (!tableLevelEdges.has(edgeId)) {
      tableLevelEdges.add(edgeId);
      dagreGraph.setEdge(flow.sourceTable, flow.targetTable);
    }
  });

  dagre.layout(dagreGraph);

  newNodes.forEach(node => {
    if (node.type === 'group') {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.position = {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      };
      node.style = {
        ...node.style,
        width: nodeWithPosition.width,
        height: nodeWithPosition.height
      };
    } else {
      const nodeWithPosition = dagreGraph.node(node.id);
      // For children in compound graphs, dagre positions them relative to the top-left of the entire graph,
      // but ReactFlow expects positions relative to the parent.
      // So if parent exists, we adjust the coordinates. Wait, dagre gives absolute coordinates for all nodes!
      // To get relative coordinates for ReactFlow children, we subtract parent's absolute top-left.
      let absX = nodeWithPosition.x - COL_WIDTH / 2;
      let absY = nodeWithPosition.y - nodeWithPosition.height / 2;
      
      if (node.parentId) {
        const parentPos = dagreGraph.node(node.parentId);
        const parentTopLeftX = parentPos.x - parentPos.width / 2;
        const parentTopLeftY = parentPos.y - parentPos.height / 2;
        node.position = {
          x: absX - parentTopLeftX,
          y: absY - parentTopLeftY
        };
      } else {
        node.position = { x: absX, y: absY };
      }
    }
  });

  const allSourceTables = [...new Set(combinedFlows.map(f => f.sourceTable))];
  const sourceColorMap: Record<string, string> = {};
  allSourceTables.forEach((src, idx) => {
    sourceColorMap[src] = EDGE_COLORS[idx % EDGE_COLORS.length];
  });

  combinedFlows.forEach((flow, idx) => {
    const sourceCol = flow.sourceCol === '*' ? 'All Columns' : flow.sourceCol;
    const targetCol = flow.targetCol === '*' ? 'All Columns' : flow.targetCol;
    
    let edgeColor = sourceColorMap[flow.sourceTable] || '#38bdf8';
    if (flow.action === 'delete') edgeColor = '#ef4444'; // red-500
    else if (flow.action === 'update') edgeColor = '#f97316'; // orange-500
    else if (flow.action === 'merge') edgeColor = '#eab308'; // yellow-500
    else if (flow.action === 'truncate') edgeColor = '#dc2626'; // red-600
    else if (flow.action === 'drop') edgeColor = '#991b1b'; // red-800

    // If a node is collapsed and the column is beyond MAX_COLS_VISIBLE, we route the edge to the header handle 'header'
    const srcCols = getColumnsForTable(flow.sourceTable);
    const tgtCols = getColumnsForTable(flow.targetTable);
    
    const srcColIdx = srcCols.findIndex(c => c.name === sourceCol);
    const tgtColIdx = tgtCols.findIndex(c => c.name === targetCol);
    
    const isSrcCollapsed = (!expandedNodes.has(flow.sourceTable) && srcCols.length > MAX_COLS_VISIBLE) && srcColIdx >= MAX_COLS_VISIBLE;
    const isTgtCollapsed = (!expandedNodes.has(flow.targetTable) && tgtCols.length > MAX_COLS_VISIBLE) && tgtColIdx >= MAX_COLS_VISIBLE;

    const actionLabel = flow.action ? `[${flow.action.toUpperCase()}]` : '';
    const isDestructive = flow.action === 'delete' || flow.action === 'truncate' || flow.action === 'drop';

    newEdges.push({
      id: `e-${flow.sourceTable}-${flow.targetTable}-${sourceCol}-${targetCol}-${idx}`,
      source: flow.sourceTable,
      target: flow.targetTable,
      sourceHandle: isSrcCollapsed ? 'col-header' : `col-${sourceCol}`,
      targetHandle: isTgtCollapsed ? 'col-header' : `col-${targetCol}`,
      type: 'smoothstep',
      label: actionLabel,
      labelStyle: { fill: edgeColor, fontWeight: 700, fontSize: 10 },
      labelBgStyle: { fill: 'var(--bg-primary)', fillOpacity: 0.8 },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      style: { stroke: edgeColor, strokeWidth: isDestructive ? 2 : 1.5, opacity: 0.8, strokeDasharray: isDestructive ? '4 4' : undefined },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 12, height: 12 }
    });
  });

  return { newNodes, newEdges };
};
