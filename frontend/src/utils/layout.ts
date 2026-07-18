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
}

export function getLayoutedElements(
  tables: TableSchema[],
  relationships: RelationshipSchema[]
): { nodes: LayoutedNode[]; edges: LayoutedEdge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 120 });
  g.setDefaultEdgeLabel(() => ({}));

  tables.forEach((table) => {
    const nodeWidth = 220;
    const nodeHeight = 40 + table.columns.length * 28;
    g.setNode(table.id, { width: nodeWidth, height: nodeHeight });
  });

  relationships.forEach((rel) => {
    g.setEdge(rel.from_table, rel.to_table);
  });

  dagre.layout(g);

  const layoutedNodes: LayoutedNode[] = tables.map((table) => {
    const dagreNode = g.node(table.id);
    const x = dagreNode.x - 220 / 2;
    const y = dagreNode.y - (40 + table.columns.length * 28) / 2;
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

  const layoutedEdges: LayoutedEdge[] = relationships.map((rel) => {
    return {
      id: rel.id,
      source: rel.from_table,
      target: rel.to_table,
      sourceHandle: `right_${rel.from_column}`,
      targetHandle: `left_${rel.to_column}`,
      type: 'crowsFootEdge',
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
