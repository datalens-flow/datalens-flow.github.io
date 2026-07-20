import { SchemaResponse } from '../types/schema';
import { parseSqlLocal } from '../utils/sqlParser';
import { 
  generateDrawioXml, 
  generateMarkdownDataDict, 
  generateXlsxDataDict, 
  generateSqlDdlLocal 
} from '../utils/exporters';
import { generateMigrationScriptLocal } from '../utils/migrationGenerator';
import { ServiceMesh } from '../utils/serviceMesh';

export async function parseSql(sql: string, dialect: string): Promise<SchemaResponse> {
  return ServiceMesh.execute(
    async () => parseSqlLocal(sql, dialect),
    { name: 'parseSql', timeoutMs: 10000, retryCount: 0 }
  );
}

export async function exportDrawio(schema: SchemaResponse): Promise<Blob> {
  return ServiceMesh.execute(
    async () => {
      const xml = generateDrawioXml(schema);
      return new Blob([xml], { type: 'application/xml' });
    },
    { name: 'exportDrawio', timeoutMs: 5000 }
  );
}

export async function exportXlsx(
  schema: SchemaResponse,
  descriptions: Record<string, Record<string, string>>
): Promise<Blob> {
  return ServiceMesh.execute(
    async () => generateXlsxDataDict(schema, descriptions),
    { name: 'exportXlsx', timeoutMs: 10000 }
  );
}

export async function exportMarkdown(
  schema: SchemaResponse,
  descriptions: Record<string, Record<string, string>>
): Promise<Blob> {
  return ServiceMesh.execute(
    async () => {
      const md = generateMarkdownDataDict(schema, descriptions);
      return new Blob([md], { type: 'text/markdown' });
    },
    { name: 'exportMarkdown', timeoutMs: 5000 }
  );
}

export async function exportSql(schema: SchemaResponse, targetDialect: string = 'postgres'): Promise<Blob> {
  return ServiceMesh.execute(
    async () => {
      const sql = generateSqlDdlLocal(schema, targetDialect);
      return new Blob([sql], { type: 'text/plain' });
    },
    { name: 'exportSql', timeoutMs: 5000 }
  );
}

export async function exportMigration(
  originalSchema: SchemaResponse,
  currentSchema: SchemaResponse,
  renameEvents: any
): Promise<Blob> {
  return ServiceMesh.execute(
    async () => {
      const body = {
        original_schema: originalSchema,
        current_schema: currentSchema,
        rename_events: renameEvents,
      };
      const sql = generateMigrationScriptLocal(body);
      return new Blob([sql], { type: 'text/plain' });
    },
    { name: 'exportMigration', timeoutMs: 5000 }
  );
}

