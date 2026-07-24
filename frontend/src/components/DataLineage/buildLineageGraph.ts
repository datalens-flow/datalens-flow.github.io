import dagre from '@dagrejs/dagre';
import { parseLineage } from '../../utils/lineageParser';
import { ColInfo } from './types';

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
  ignoredTables: string[] = [],
  viewMode: 'dbt' | 'overview' | 'detailed' = 'dbt',
  showProcedureGroups: boolean = true
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

  const isTempTable = (tableName: string) => {
    const lower = tableName.toLowerCase();
    return lower.startsWith('tmp_') || 
           lower.startsWith('temp_') || 
           lower.startsWith('stg_') || 
           lower.startsWith('wrk_') || 
           lower.startsWith('work_') || 
           lower.startsWith('dummy_') || 
           lower.startsWith('#');
  };

  const isArchiveTable = (tableName: string) => {
    const lower = tableName.toLowerCase();
    return lower.endsWith('_arch') || 
           lower.endsWith('_bkp') || 
           lower.endsWith('_backup') || 
           lower.endsWith('_hist') || 
           lower.endsWith('_log');
  };

  // --- Optimization: O(N) Pre-indexing ---
  const tableIncomingCols = new Map<string, Set<string>>();
  const tableOutgoingCols = new Map<string, Set<string>>();
  const feedsNonTempMap = new Set<string>();

  combinedFlows.forEach(f => {
    if (!tableIncomingCols.has(f.targetTable)) tableIncomingCols.set(f.targetTable, new Set());
    tableIncomingCols.get(f.targetTable)!.add(f.targetCol === '*' ? 'All Columns' : f.targetCol);

    if (!tableOutgoingCols.has(f.sourceTable)) tableOutgoingCols.set(f.sourceTable, new Set());
    tableOutgoingCols.get(f.sourceTable)!.add(f.sourceCol === '*' ? 'All Columns' : f.sourceCol);
    
    if (f.sourceTable !== f.targetTable && !isArchiveTable(f.targetTable) && !isTempTable(f.targetTable)) {
      feedsNonTempMap.add(f.sourceTable);
    }
  });

  const getColumnsForTable = (table: string): ColInfo[] => {
    const incoming = tableIncomingCols.get(table) || new Set<string>();
    const outgoing = tableOutgoingCols.get(table) || new Set<string>();
    
    const allCols: ColInfo[] = [];
    const seen = new Set<string>();
    incoming.forEach(c => { allCols.push({ name: c, hasLeft: true, hasRight: outgoing.has(c) }); seen.add(c); });
    outgoing.forEach(c => { if (!seen.has(c)) allCols.push({ name: c, hasLeft: false, hasRight: true }); });
    return allCols.sort((a, b) => a.name.localeCompare(b.name));
  };
  // ---------------------------------------

  const dagreGraph = new dagre.graphlib.Graph({ compound: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  // Increased spacing for complex/dense graphs
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 200 });

  const COL_WIDTH = 250;
  const ROW_HEIGHT = 45;
  const MAX_COLS_VISIBLE = 5;

  // Add group nodes for procedures
  const activeProcedures = new Set<string>();
  if (showProcedureGroups) {
    allTables.forEach(table => {
      const procs = tableProcedures.get(table);
      if (procs && procs.size === 1 && procedures.length > 1) {
        activeProcedures.add(procs.values().next().value!);
      }
    });

    activeProcedures.forEach(procName => {
      if (procName === 'Global Script') return;
      if (procedures.length > 1 && activeProcedures.size > 1) {
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
      }
    });
  }

  allTables.forEach(table => {
    const roleObj = tableRoles[table];
    const isSrc = roleObj.isSource;
    const isTgt = roleObj.isTarget;
    
    let role = isSrc && isTgt ? 'both' : (isSrc ? 'source' : 'target');
    
    // Check if 'both' should actually be 'target'
    if (role === 'both') {
      if (!feedsNonTempMap.has(table)) {
        role = 'target';
      }
    }
    
    const lowerTable = table.toLowerCase();
    
    // ext_ tables are external staging tables, they should be Intermediate (both) rather than final Targets
    if (role === 'target' && lowerTable.startsWith('ext_')) {
      role = 'both';
    }
    
    const isTemp = isTempTable(table);
    const isView = lowerTable.startsWith('v_') || lowerTable.startsWith('vw_') || lowerTable.startsWith('view_');
    
    // dbt DAG Node Classification & Materialization Inferencing
    let dbtType: 'source' | 'staging' | 'marts' | 'exposure' | 'seed' = 'marts';
    let dbtMaterialization: 'table' | 'view' | 'incremental' | 'ephemeral' | 'source' = 'table';
    let dbtSchema = 'analytics';

    if (!isTgt && isSrc) {
      dbtType = 'source';
      dbtMaterialization = 'source';
      dbtSchema = lowerTable.startsWith('raw_') ? 'raw' : (lowerTable.startsWith('src_') ? 'src' : 'public');
    } else if (lowerTable.startsWith('seed_') || lowerTable.endsWith('_seed')) {
      dbtType = 'seed';
      dbtMaterialization = 'table';
      dbtSchema = 'seeds';
    } else if (isTemp || lowerTable.startsWith('stg_') || lowerTable.startsWith('int_') || lowerTable.startsWith('tmp_')) {
      dbtType = 'staging';
      dbtMaterialization = isTemp ? 'ephemeral' : 'view';
      dbtSchema = lowerTable.startsWith('stg_') ? 'staging' : 'intermediate';
    } else if (lowerTable.startsWith('fct_') || lowerTable.startsWith('dim_') || lowerTable.startsWith('rpt_') || lowerTable.startsWith('summary') || lowerTable.startsWith('analytics')) {
      dbtType = 'marts';
      dbtMaterialization = lowerTable.startsWith('fct_') ? 'incremental' : 'table';
      dbtSchema = 'marts';
    } else if (isSrc && isTgt) {
      dbtType = 'staging';
      dbtMaterialization = isView ? 'view' : 'table';
      dbtSchema = 'intermediate';
    } else if (!isSrc && isTgt) {
      dbtType = 'exposure';
      dbtMaterialization = 'table';
      dbtSchema = 'reports';
    }

    const nodeTypeOverride = isTemp ? 'temp' : (isView ? 'view' : role);
    const isCollapsed = !expandedNodes.has(table);
    
    const columns = getColumnsForTable(table);
    const visibleColsCount = isCollapsed ? Math.min(columns.length, MAX_COLS_VISIBLE) : columns.length;
    const hasMoreButton = isCollapsed && columns.length > MAX_COLS_VISIBLE;
    
    const nodeHeight = (viewMode === 'dbt' && isCollapsed) ? 54 : (viewMode === 'overview' ? 40 : 50 + (visibleColsCount * ROW_HEIGHT) + (hasMoreButton ? 30 : 0));
    
    dagreGraph.setNode(table, { width: COL_WIDTH, height: nodeHeight });

    const procs = tableProcedures.get(table);
    let parentNodeId = undefined;
    // Only group if MULTIPLE procedures are being viewed at the same time and showProcedureGroups is enabled
    if (showProcedureGroups && procs && procs.size === 1 && procedures.length > 1 && activeProcedures.size > 1) {
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
      position: { x: 0, y: 0 },
      data: { 
        tableName: table, 
        columns, 
        role, 
        nodeTypeOverride, 
        dbtType,
        dbtMaterialization,
        dbtSchema,
        isCollapsed, 
        isTemp, 
        isView, 
        viewMode,
        hasIncoming: isTgt,
        hasOutgoing: isSrc,
        procKey: procedures.map(p => p.name).join('_')
      },
      style: {
        width: COL_WIDTH,
        background: 'var(--bg-secondary)',
        border: isTemp ? '2px dashed var(--color-indigo)' : (isView ? '1px solid var(--color-purple)' : '1px solid var(--color-border)'),
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

  let dagreLayoutStart = performance.now();
  dagre.layout(dagreGraph);
  let dagreLayoutEnd = performance.now();
  console.log(`Dagre layout with ${dagreGraph.nodeCount()} nodes and ${dagreGraph.edgeCount()} edges took ${dagreLayoutEnd - dagreLayoutStart} ms`);

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

  if (viewMode === 'dbt' || viewMode === 'overview') {
    const edgeSet = new Set<string>();
    combinedFlows.forEach((flow, idx) => {
      const edgeKey = `${flow.sourceTable}-${flow.targetTable}`;
      if (edgeSet.has(edgeKey)) return; // Deduplicate to one edge per table pair
      edgeSet.add(edgeKey);
      
      let edgeColor = sourceColorMap[flow.sourceTable] || '#38bdf8';
      if (flow.action === 'delete') edgeColor = '#ef4444';
      else if (flow.action === 'update') edgeColor = '#f97316';
      else if (flow.action === 'merge') edgeColor = '#eab308';
      else if (flow.action === 'truncate') edgeColor = '#dc2626';
      else if (flow.action === 'drop') edgeColor = '#991b1b';

      const actionLabel = (viewMode === 'dbt') ? '' : (flow.action ? `[${flow.action.toUpperCase()}]` : '');
      const isDestructive = flow.action === 'delete' || flow.action === 'truncate' || flow.action === 'drop';

      newEdges.push({
        id: `e-${flow.sourceTable}-${flow.targetTable}-${idx}`,
        source: flow.sourceTable,
        target: flow.targetTable,
        sourceHandle: 'col-header',
        targetHandle: 'col-header',
        type: 'smoothstep',
        label: actionLabel,
        labelStyle: { fill: edgeColor, fontWeight: 700, fontSize: 10 },
        labelBgStyle: { fill: 'var(--bg-primary)', fillOpacity: 0.8 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        style: { stroke: edgeColor, strokeWidth: isDestructive ? 2 : 2, opacity: 0.9, strokeDasharray: isDestructive ? '4 4' : undefined },
        markerEnd: { type: 'arrowclosed', color: edgeColor, width: 12, height: 12 }
      });
    });
  } else {
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
      
      const hasSrcHandle = srcColIdx !== -1 && srcCols[srcColIdx].hasRight;
      const hasTgtHandle = tgtColIdx !== -1 && tgtCols[tgtColIdx].hasLeft;

      const isSrcCollapsed = (!expandedNodes.has(flow.sourceTable) && srcCols.length > MAX_COLS_VISIBLE) && srcColIdx >= MAX_COLS_VISIBLE;
      const isTgtCollapsed = (!expandedNodes.has(flow.targetTable) && tgtCols.length > MAX_COLS_VISIBLE) && tgtColIdx >= MAX_COLS_VISIBLE;

      const actionLabel = flow.action ? `[${flow.action.toUpperCase()}]` : '';
      const isDestructive = flow.action === 'delete' || flow.action === 'truncate' || flow.action === 'drop';

      const sourceHandleId = (isSrcCollapsed || !hasSrcHandle) ? 'col-header' : `col-${sourceCol.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const targetHandleId = (isTgtCollapsed || !hasTgtHandle) ? 'col-header' : `col-${targetCol.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

      newEdges.push({
        id: `e-${flow.sourceTable}-${flow.targetTable}-${sourceCol}-${targetCol}-${idx}`,
        source: flow.sourceTable,
        target: flow.targetTable,
        sourceHandle: sourceHandleId,
        targetHandle: targetHandleId,
        type: 'smoothstep',
        label: actionLabel,
        labelStyle: { fill: edgeColor, fontWeight: 700, fontSize: 10 },
        labelBgStyle: { fill: 'var(--bg-primary)', fillOpacity: 0.8 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        style: { stroke: edgeColor, strokeWidth: isDestructive ? 2 : 1.5, opacity: 0.8, strokeDasharray: isDestructive ? '4 4' : undefined },
        markerEnd: { type: 'arrowclosed', color: edgeColor, width: 12, height: 12 }
      });
    });
  }

  return { newNodes, newEdges };
};
