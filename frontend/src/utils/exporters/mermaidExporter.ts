import { splitProcedures } from '../lineage/procedureSplitter';
import { parseLineage } from '../lineageParser';

/** Generate Mermaid.js ERD diagram code (erDiagram) */
export const generateErdMermaid = (schema: any): string => {
  if (!schema || !schema.tables || schema.tables.length === 0) {
    return 'erDiagram\n';
  }

  let lines: string[] = ['erDiagram'];

  // Add tables & columns
  schema.tables.forEach((table: any) => {
    const tableName = table.name.replace(/[^a-zA-Z0-9_]/g, '_');
    lines.push(`    ${tableName} {`);
    table.columns.forEach((col: any) => {
      const colName = col.name.replace(/[^a-zA-Z0-9_]/g, '_');
      const colType = (col.type || 'VARCHAR').replace(/[^a-zA-Z0-9_()]/g, '_');
      const pkMarker = col.pk ? 'PK' : (col.fk ? 'FK' : '');
      lines.push(`        ${colType} ${colName} ${pkMarker}`.trim());
    });
    lines.push('    }');
  });

  // Add relationships
  if (schema.relationships) {
    schema.relationships.forEach((rel: any) => {
      const fromTable = rel.fromTable.replace(/[^a-zA-Z0-9_]/g, '_');
      const toTable = rel.toTable.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(`    ${fromTable} ||--o{ ${toTable} : "${rel.fromColumn} -> ${rel.toColumn}"`);
    });
  }

  return lines.join('\n');
};

/** Generate Mermaid.js Data Lineage flowchart code (flowchart LR) */
export const generateLineageMermaid = (procedureSql: string): string => {
  if (!procedureSql.trim()) {
    return 'flowchart LR\n';
  }

  const procs = splitProcedures(procedureSql);
  const lines: string[] = ['flowchart LR'];

  procs.forEach(proc => {
    const result = parseLineage(proc.sql);
    result.flows.forEach(flow => {
      const source = `${flow.sourceTable}_${flow.sourceCol}`.replace(/[^a-zA-Z0-9_]/g, '_');
      const target = `${flow.targetTable}_${flow.targetCol}`.replace(/[^a-zA-Z0-9_]/g, '_');
      const label = flow.sourceCol === '*' ? 'ALL' : `${flow.sourceCol} -> ${flow.targetCol}`;
      lines.push(`    ${source}["${flow.sourceTable}.${flow.sourceCol}"] -->|"${label}"| ${target}["${flow.targetTable}.${flow.targetCol}"]`);
    });
  });

  return lines.join('\n');
};

/** Generate PlantUML Data Lineage diagram code */
export const generateLineagePlantUml = (procedureSql: string): string => {
  if (!procedureSql.trim()) {
    return '@startuml\n@enduml\n';
  }

  const procs = splitProcedures(procedureSql);
  const lines: string[] = ['@startuml', 'left to right direction', 'skinparam componentStyle rectangle'];

  procs.forEach(proc => {
    const result = parseLineage(proc.sql);
    result.flows.forEach(flow => {
      const source = `${flow.sourceTable}_${flow.sourceCol}`.replace(/[^a-zA-Z0-9_]/g, '_');
      const target = `${flow.targetTable}_${flow.targetCol}`.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(`rectangle "${flow.sourceTable}.${flow.sourceCol}" as ${source}`);
      lines.push(`rectangle "${flow.targetTable}.${flow.targetCol}" as ${target}`);
      lines.push(`${source} --> ${target} : "${flow.action}"`);
    });
  });

  lines.push('@enduml');
  return lines.join('\n');
};
