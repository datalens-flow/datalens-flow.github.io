import * as XLSX from 'xlsx';
import { SchemaResponse } from '../../types/schema';

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
    const sheetName = table.name.replace(/[:\\?\\*\\/\\\\\\[\\]]/g, '').substring(0, 30) || 'Table';
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
