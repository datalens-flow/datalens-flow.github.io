import dagre from '@dagrejs/dagre';
import { TableSchema, RelationshipSchema } from '../types/schema';

export interface LayoutedNode {
  id: string;
  type: string;
  data: {
    name: string;
    columns: any[];
  };
  position: { x: number; y: number };
}

export interface LayoutedEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  type: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

export function getLayoutedElements(
  tables: TableSchema[],
  relationships: RelationshipSchema[],
  layoutDir: 'LR' | 'TB' = 'LR',
  inferRelationships: boolean = false
): { nodes: LayoutedNode[]; edges: LayoutedEdge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: layoutDir, nodesep: 150, ranksep: 240 });
  g.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 240;

  tables.forEach((table) => {
    const nodeHeight = 60 + table.columns.length * 28; // height includes header and Add Column button
    g.setNode(table.id, { width: nodeWidth, height: nodeHeight });
  });

  const allRelationships = [...relationships];
  if (inferRelationships) {
    const tableIds = new Set(tables.map(t => t.id));
    tables.forEach((table) => {
      table.columns.forEach((col) => {
        if (!col.is_fk && !col.is_pk) {
          const colNameLower = col.name.toLowerCase();
          if (colNameLower.endsWith('_id') || colNameLower.endsWith('_pk')) {
            const suffix = colNameLower.endsWith('_id') ? '_id' : '_pk';
            const targetBase = colNameLower.slice(0, -suffix.length);
            
            let targetTableId = '';
            if (tableIds.has(targetBase)) {
              targetTableId = targetBase;
            } else if (tableIds.has(targetBase + 's')) {
              targetTableId = targetBase + 's';
            } else if (targetBase.endsWith('y') && tableIds.has(targetBase.slice(0, -1) + 'ies')) {
              targetTableId = targetBase.slice(0, -1) + 'ies';
            }
            
            if (targetTableId && targetTableId !== table.id) {
              allRelationships.push({
                id: `inferred_${table.id}_${col.name}_to_${targetTableId}`,
                from_table: table.id,
                from_column: col.name,
                to_table: targetTableId,
                to_column: 'id',
                type: 'many-to-one',
                isInferred: true
              } as any);
            }
          }
        }
      });
    });
  }

  allRelationships.forEach((rel) => {
    // dagre safety: make sure source and target exist
    const sourceExists = tables.some(t => t.id === rel.from_table);
    const targetExists = tables.some(t => t.id === rel.to_table);
    if (sourceExists && targetExists) {
      g.setEdge(rel.from_table, rel.to_table);
    }
  });

  dagre.layout(g);

  const layoutedNodes: LayoutedNode[] = tables.map((table) => {
    const dagreNode = g.node(table.id) || { x: 100, y: 100 };
    const x = dagreNode.x - nodeWidth / 2;
    const y = dagreNode.y - (60 + table.columns.length * 28) / 2;
    return {
      id: table.id,
      type: 'tableNode',
      data: {
        name: table.name,
        columns: table.columns,
      },
      position: { x, y },
    };
  });

  const layoutedEdges: LayoutedEdge[] = allRelationships
    .filter(rel => tables.some(t => t.id === rel.from_table) && tables.some(t => t.id === rel.to_table))
    .map((rel) => {
      const isInferred = (rel as any).isInferred;
      return {
        id: rel.id,
        source: rel.from_table,
        target: rel.to_table,
        sourceHandle: `right_${rel.from_column}`,
        targetHandle: `left_${rel.to_column}`,
        type: 'crowsFootEdge',
        animated: isInferred,
        style: isInferred ? { strokeDasharray: '5,5', stroke: '#a5b4fc', opacity: 0.6 } : undefined
      };
    });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
