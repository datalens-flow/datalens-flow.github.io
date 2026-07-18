import { SchemaResponse, ExportRequest } from '../types/schema';

const API_BASE = '/api';

export async function parseSql(sql: string, dialect: string): Promise<SchemaResponse> {
  const res = await fetch(`${API_BASE}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, dialect }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to parse SQL');
  }
  return res.json();
}

export async function exportDrawio(schema: SchemaResponse): Promise<Blob> {
  const res = await fetch(`${API_BASE}/export/drawio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schema),
  });
  if (!res.ok) throw new Error('Failed to export Draw.io XML');
  return res.blob();
}

export async function exportXlsx(
  schema: SchemaResponse,
  descriptions: Record<string, Record<string, string>>
): Promise<Blob> {
  const body: ExportRequest = { schema_data: schema, descriptions };
  const res = await fetch(`${API_BASE}/export/xlsx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to export Excel file');
  return res.blob();
}

export async function exportMarkdown(
  schema: SchemaResponse,
  descriptions: Record<string, Record<string, string>>
): Promise<Blob> {
  const body: ExportRequest = { schema_data: schema, descriptions };
  const res = await fetch(`${API_BASE}/export/md`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to export Markdown file');
  return res.blob();
}

export async function exportSql(schema: SchemaResponse): Promise<Blob> {
  const res = await fetch(`${API_BASE}/export/sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schema),
  });
  if (!res.ok) throw new Error('Failed to export SQL file');
  return res.blob();
}

export async function exportMigration(
  originalSchema: SchemaResponse,
  currentSchema: SchemaResponse,
  renameEvents: any
): Promise<Blob> {
  const body = {
    original_schema: originalSchema,
    current_schema: currentSchema,
    rename_events: renameEvents,
  };
  const res = await fetch(`${API_BASE}/export/migration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to export Migration script');
  return res.blob();
}

