import { SchemaResponse } from '../../types/schema';

// 1. Local Draw.io XML Generator
export function generateDrawioXml(schema: SchemaResponse): string {
  const mxCells: string[] = [
    '<mxGraphModel><root>',
    '<mxCell id="0" />',
    '<mxCell id="1" parent="0" />'
  ];

  let currentId = 2;
  const tableIdsMap: Record<string, number> = {};

  // Positions grid layout
  let x = 40;
  let y = 40;
  const colWidth = 240;
  const rowHeight = 350;
  const itemsPerRow = 4;
  let count = 0;

  for (const table of schema.tables) {
    const tableCellId = currentId++;
    tableIdsMap[table.id] = tableCellId;

    const posX = x + (count % itemsPerRow) * colWidth;
    const posY = y + Math.floor(count / itemsPerRow) * rowHeight;
    count++;

    // Generate table cell
    mxCells.push(
      `<mxCell id="${tableCellId}" value="${table.name}" style="shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;fillColor=#0284c7;strokeColor=#0369a1;fontColor=#ffffff;rounded=1;" vertex="1" parent="1">`,
      `  <mxGeometry x="${posX}" y="${posY}" width="180" height="${30 + table.columns.length * 24}" as="geometry" />`,
      `</mxCell>`
    );

    // Generate column child rows inside table
    table.columns.forEach((col, idx) => {
      const colCellId = currentId++;
      const isPkText = col.is_pk ? ' [PK]' : '';
      const isFkText = col.is_fk ? ' [FK]' : '';
      const label = `${col.name} : ${col.type}${isPkText}${isFkText}`;

      mxCells.push(
        `<mxCell id="${colCellId}" value="${label}" style="shape=tableRow;horizontal=0;startSize=0;connectable=0;fillColor=none;strokeColor=none;align=left;spacingLeft=8;fontSize=11;" vertex="1" parent="${tableCellId}">`,
        `  <mxGeometry y="${30 + idx * 24}" width="180" height="24" as="geometry" />`,
        `</mxCell>`
      );
    });
  }

  // Draw connector edges
  for (const rel of schema.relationships) {
    const sourceCellId = tableIdsMap[rel.from_table];
    const targetCellId = tableIdsMap[rel.to_table];

    if (sourceCellId && targetCellId) {
      const edgeId = currentId++;
      mxCells.push(
        `<mxCell id="${edgeId}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;strokeColor=#10b981;endArrow=classic;" edge="1" parent="1" source="${sourceCellId}" target="${targetCellId}">`,
        `  <mxGeometry relative="1" as="geometry" />`,
        `</mxCell>`
      );
    }
  }

  mxCells.push('</root></mxGraphModel>');
  return mxCells.join('\\n');
}
