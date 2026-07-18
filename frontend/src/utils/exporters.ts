import * as XLSX from 'xlsx';
import { SchemaResponse } from '../types/schema';

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
      `<mxCell id="${tableCellId}" value="${table.name}" style="shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;fillColor=#6366f1;strokeColor=#4f46e5;fontColor=#ffffff;rounded=1;" vertex="1" parent="1">`,
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
  return mxCells.join('\n');
}

// 2. Local Markdown Data Dictionary Generator
export function generateMarkdownDataDict(
  schema: SchemaResponse,
  descriptions: Record<string, Record<string, string>>
): string {
  const lines: string[] = [
    '# Data Dictionary',
    '',
    `Generated on: ${new Date().toLocaleDateString()}`,
    ''
  ];

  for (const table of schema.tables) {
    lines.push(`## Table: ${table.name}`);
    lines.push('');
    lines.push('| Column Name | Type | Key | Nullable | Default | Description |');
    lines.push('|---|---|---|---|---|---|');

    for (const col of table.columns) {
      const keys: string[] = [];
      if (col.is_pk) keys.push('PK');
      if (col.is_fk) keys.push('FK');
      const keyStr = keys.join(', ') || '-';

      const nullableStr = col.nullable ? 'YES' : 'NO';
      const defaultStr = col.default || '-';
      const commentStr = descriptions[table.id]?.[col.name] || col.comment || '';

      lines.push(`| **${col.name}** | \`${col.type}\` | ${keyStr} | ${nullableStr} | \`${defaultStr}\` | ${commentStr} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// 3. Local Excel Exporter using SheetJS
export function generateXlsxDataDict(
  schema: SchemaResponse,
  descriptions: Record<string, Record<string, string>>
): Blob {
  const wb = XLSX.utils.book_new();

  for (const table of schema.tables) {
    const rows: any[] = [];
    rows.push([`DATABASE TABLE: ${table.name.toUpperCase()}`]);
    rows.push([`Generated on: ${new Date().toLocaleDateString()}`]);
    rows.push([]);
    rows.push(['Column Name', 'Data Type', 'Key', 'Nullable', 'Default', 'Description']);

    for (const col of table.columns) {
      const keys: string[] = [];
      if (col.is_pk) keys.push('PK');
      if (col.is_fk) keys.push('FK');
      const keyStr = keys.join(', ') || '-';

      const nullableStr = col.nullable ? 'YES' : 'NO';
      const defaultStr = col.default || '-';
      const commentStr = descriptions[table.id]?.[col.name] || col.comment || '';

      rows.push([col.name, col.type, keyStr, nullableStr, defaultStr, commentStr]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    // Sanitize sheet name for SheetJS (max 30 chars, no special characters)
    const sheetName = table.name.replace(/[:\?\*\/\\\[\]]/g, '').substring(0, 30) || 'Table';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Generate buffer
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  const buf = new ArrayBuffer(out.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < out.length; i++) {
    view[i] = out.charCodeAt(i) & 0xff;
  }

  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// 4. Dialect-aware SQL DDL Formatter
export function generateSqlDdlLocal(schema: SchemaResponse, targetDialect: string = 'postgres'): string {
  const dialect = targetDialect.toLowerCase();
  const statements: string[] = [];

  // Helper to map generic SQL types to dialect-specific types
  const mapType = (type: string): string => {
    let t = type.toUpperCase().trim();
    if (dialect === 'oracle') {
      if (t.startsWith('VARCHAR')) return t.replace('VARCHAR', 'VARCHAR2');
      if (t === 'INT' || t === 'INTEGER') return 'NUMBER(10)';
      if (t === 'BOOLEAN') return 'NUMBER(1)';
    } else if (dialect === 'mysql') {
      if (t === 'BOOLEAN') return 'TINYINT(1)';
    } else if (dialect === 'sqlite') {
      if (t.startsWith('VARCHAR') || t === 'TEXT') return 'TEXT';
      if (t.startsWith('DECIMAL') || t === 'FLOAT' || t === 'DOUBLE') return 'REAL';
    }
    return t;
  };

  for (const table of schema.tables) {
    const colDefs: string[] = [];

    for (const col of table.columns) {
      const typeStr = mapType(col.type);
      let colStr = `${col.name} ${typeStr}`;

      if (col.is_pk) {
        colStr += ' PRIMARY KEY';
      }
      if (!col.nullable) {
        colStr += ' NOT NULL';
      }
      if (col.default) {
        // Enclose text defaults in single quotes
        const val = col.default.replace(/['"]/g, '');
        if (/^\d+(\.\d+)?$/.test(val) || val.toUpperCase() === 'NULL' || val.toUpperCase() === 'CURRENT_TIMESTAMP') {
          colStr += ` DEFAULT ${val}`;
        } else {
          colStr += ` DEFAULT '${val}'`;
        }
      }

      colDefs.push(colStr);
    }

    // Outline Foreign Keys
    for (const col of table.columns) {
      if (col.is_fk && col.fk_ref_table && col.fk_ref_column) {
        colDefs.push(`FOREIGN KEY (${col.name}) REFERENCES ${col.fk_ref_table}(${col.fk_ref_column})`);
      }
    }

    statements.push(`CREATE TABLE ${table.name} (\n  ${colDefs.join(',\n  ')}\n);`);
  }

  return statements.join('\n\n');
}
