import { SchemaResponse } from '../types/schema';
import { parseSqlLocal } from '../utils/sqlParser';
import { 
  generateDrawioXml, 
  generateMarkdownDataDict, 
  generateXlsxDataDict, 
  generateSqlDdlLocal 
} from '../utils/exporters';
import { generateMigrationScriptLocal } from '../utils/migrationGenerator';

export async function parseSql(sql: string, dialect: string): Promise<SchemaResponse> {
  // Execute parsing entirely inside client browser (No-Backend!)
  try {
    const result = parseSqlLocal(sql, dialect);
    return result;
  } catch (err: any) {
    throw new Error(err.message || 'Failed to parse SQL locally');
  }
}

export async function exportDrawio(schema: SchemaResponse): Promise<Blob> {
  const xml = generateDrawioXml(schema);
  return new Blob([xml], { type: 'application/xml' });
}

export async function exportXlsx(
  schema: SchemaResponse,
  descriptions: Record<string, Record<string, string>>
): Promise<Blob> {
  return generateXlsxDataDict(schema, descriptions);
}

export async function exportMarkdown(
  schema: SchemaResponse,
  descriptions: Record<string, Record<string, string>>
): Promise<Blob> {
  const md = generateMarkdownDataDict(schema, descriptions);
  return new Blob([md], { type: 'text/markdown' });
}

export async function exportSql(schema: SchemaResponse, targetDialect: string = 'postgres'): Promise<Blob> {
  const sql = generateSqlDdlLocal(schema, targetDialect);
  return new Blob([sql], { type: 'text/plain' });
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
  const sql = generateMigrationScriptLocal(body);
  return new Blob([sql], { type: 'text/plain' });
}
