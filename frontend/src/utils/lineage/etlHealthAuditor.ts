import { parseLineage } from '../lineageParser';
import { splitProcedures } from './procedureSplitter';

export interface EtlHealthIssue {
  id: string;
  type: 'dead_temp' | 'orphan_source' | 'isolated_node' | 'unmapped_col';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  tableName: string;
  procedureName: string;
  suggestion: string;
}

export interface EtlHealthReport {
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  issues: EtlHealthIssue[];
}

export const auditEtlHealth = (procedureSql: string, ignoredTablesStr: string = ''): EtlHealthReport => {
  const issues: EtlHealthIssue[] = [];
  const ignoredSet = new Set(ignoredTablesStr.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0));

  const procedures = splitProcedures(procedureSql || '');

  procedures.forEach(proc => {
    const result = parseLineage(proc.sql);
    const flows = result.flows.filter(f => 
      !ignoredSet.has(f.sourceTable.toLowerCase()) && 
      !ignoredSet.has(f.targetTable.toLowerCase())
    );

    const sources = new Set<string>();
    const targets = new Set<string>();

    flows.forEach(f => {
      sources.add(f.sourceTable);
      targets.add(f.targetTable);
    });

    const isTemp = (name: string) => {
      const l = name.toLowerCase();
      return l.startsWith('tmp_') || l.startsWith('temp_') || l.startsWith('stg_') || l.startsWith('wrk_') || l.startsWith('#');
    };

    // Rule 1: Dead Temp Table (Written to as a target, but never read from as a source in any flow)
    targets.forEach(tbl => {
      if (isTemp(tbl) && !sources.has(tbl)) {
        issues.push({
          id: `dead-temp-${proc.name}-${tbl}`,
          type: 'dead_temp',
          severity: 'warning',
          title: `Dead Temp/Staging Table: ${tbl}`,
          description: `Table "${tbl}" is populated by an INSERT/CREATE statement in procedure "${proc.name}", but it is never read by any downstream query.`,
          tableName: tbl,
          procedureName: proc.name,
          suggestion: 'Verify if this temporary table is redundant, or if a downstream SELECT/JOIN statement was omitted.'
        });
      }
    });

    // Rule 2: Wildcard Column Mappings
    sources.forEach(tbl => {
      const tableFlows = flows.filter(f => f.sourceTable === tbl);
      if (tableFlows.length > 0 && tableFlows.every(f => f.sourceCol === '*')) {
        issues.push({
          id: `unmapped-col-${proc.name}-${tbl}`,
          type: 'unmapped_col',
          severity: 'info',
          title: `Wildcard (*) Column Mapping: ${tbl}`,
          description: `Table "${tbl}" in procedure "${proc.name}" uses wildcard (*) column mapping without explicit column-level projection.`,
          tableName: tbl,
          procedureName: proc.name,
          suggestion: 'Specify explicit column mappings for better query performance and schema lineage tracking.'
        });
      }
    });
  });

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  return {
    totalIssues: issues.length,
    errorCount,
    warningCount,
    infoCount,
    issues
  };
};
