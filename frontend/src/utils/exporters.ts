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

export function generateHtmlReport(
  schema: SchemaResponse,
  descriptions: Record<string, Record<string, string>>,
  tableColors: Record<string, string>
): string {
  const tableRows = schema.tables.map(t => {
    const color = tableColors[t.id] || '#6366f1';
    return `
      <tr>
        <td>
          <a href="#table-${t.id}" style="color: ${color}; font-weight: bold; text-decoration: none;">
            ${t.name}
          </a>
        </td>
        <td><code>${t.columns.length}</code></td>
        <td>
          ${t.columns.filter(c => c.is_pk).map(c => `<code>${c.name}</code>`).join(', ') || '-'}
        </td>
        <td>
          ${t.columns.filter(c => c.is_fk).map(c => `<code>${c.name} ➔ ${c.fk_ref_table}.${c.fk_ref_column}</code>`).join('<br>') || '-'}
        </td>
      </tr>
    `;
  }).join('');

  const tableSections = schema.tables.map(t => {
    const color = tableColors[t.id] || '#6366f1';
    const colRows = t.columns.map(c => {
      const isPk = c.is_pk ? '<span class="badge badge-pk">PK</span>' : '';
      const isFk = c.is_fk ? `<span class="badge badge-fk" title="References ${c.fk_ref_table}.${c.fk_ref_column}">FK</span>` : '';
      const comment = descriptions[t.id]?.[c.name] || c.comment || '';
      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <strong>${c.name}</strong>
              ${isPk}
              ${isFk}
            </div>
          </td>
          <td><code>${c.type}</code></td>
          <td><code>${c.nullable ? 'NULL' : 'NOT NULL'}</code></td>
          <td>
            ${c.is_fk ? `<code>${c.fk_ref_table}.${c.fk_ref_column}</code>` : '-'}
          </td>
          <td class="comment-cell">${comment || '<span style="color: #94a3b8; font-style: italic;">No description</span>'}</td>
        </tr>
      `;
    }).join('');

    const colDefs: string[] = t.columns.map(col => {
      let colStr = `  ${col.name} ${col.type}`;
      if (col.is_pk) colStr += ' PRIMARY KEY';
      if (!col.nullable) colStr += ' NOT NULL';
      return colStr;
    });
    t.columns.forEach(col => {
      if (col.is_fk) {
        colDefs.push(`  FOREIGN KEY (${col.name}) REFERENCES ${col.fk_ref_table}(${col.fk_ref_column})`);
      }
    });
    const tableSql = `CREATE TABLE ${t.name} (\n${colDefs.join(',\n')}\n);`;

    return `
      <section id="table-${t.id}" class="table-section">
        <h2 class="table-title" style="border-left: 5px solid ${color}; padding-left: 10px;">
          ${t.name}
        </h2>
        <p style="margin: -8px 0 16px 0; color: #64748b; font-size: 13px;">
          Total: ${t.columns.length} columns | Tag Color: <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span> ${color}
        </p>

        <table>
          <thead>
            <tr>
              <th style="width: 25%;">Column Name</th>
              <th style="width: 15%;">Data Type</th>
              <th style="width: 15%;">Nullable</th>
              <th style="width: 20%;">FK Reference</th>
              <th style="width: 25%;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${colRows}
          </tbody>
        </table>

        <div class="sql-box">
          <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied SQL to clipboard!');">Copy SQL</button>
          <pre><code>${tableSql}</code></pre>
        </div>
      </section>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Documentation Report</title>
  <style>
    :root {
      --bg-primary: #f8fafc;
      --bg-card: #ffffff;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --border-color: #e2e8f0;
      --color-indigo: #6366f1;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.5;
      padding: 40px 20px;
      margin: 0;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
    }

    h1 {
      font-size: 28px;
      margin-top: 0;
      margin-bottom: 8px;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: 30px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 20px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }

    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    th {
      background-color: #f1f5f9;
      color: var(--text-secondary);
      font-weight: 600;
    }

    tr:hover {
      background-color: #f8fafc;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background-color: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 12px;
      color: #0f172a;
    }

    .badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .badge-pk {
      background-color: #fef3c7;
      color: #d97706;
      border: 1px solid #fde68a;
    }

    .badge-fk {
      background-color: #d1fae5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .table-section {
      margin-top: 40px;
      border-top: 1px solid var(--border-color);
      padding-top: 30px;
    }

    .table-title {
      font-size: 20px;
      margin-top: 0;
      color: var(--text-primary);
    }

    .sql-box {
      background-color: #0f172a;
      color: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      position: relative;
      margin-top: 12px;
      overflow-x: auto;
    }

    .sql-box pre {
      margin: 0;
    }

    .sql-box code {
      background: none;
      color: #e2e8f0;
      padding: 0;
    }

    .copy-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #f8fafc;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Print media customization */
    @media print {
      body {
        background-color: #fff;
        padding: 0;
      }
      .container {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .sql-box, .copy-btn {
        display: none !important; /* Hide SQL codes and Copy button during PDF print to save paper */
      }
      .table-section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-indigo);">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      Database Schema Report
    </h1>
    <div class="subtitle">
      Generated by DataLens Flow on ${new Date().toLocaleDateString()} | Total Tables: <strong>${schema.tables.length}</strong>
    </div>

    <h2>Table of Contents</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 30%;">Table Name</th>
          <th style="width: 15%;">Columns</th>
          <th style="width: 25%;">Primary Key(s)</th>
          <th style="width: 30%;">Foreign Keys</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    ${tableSections}
  </div>
</body>
</html>`;
}

