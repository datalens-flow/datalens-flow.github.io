import { parseLineage } from '../lineageParser';
import { preprocessDbtSql, extractSqlFromPythonDag, ExtractedScript } from './dbtAirflowParser';
import { LineageFlow } from './types';

export interface RepositoryFileInput {
  filename: string;
  content: string;
}

export interface RepositoryLineageResult {
  scripts: ExtractedScript[];
  combinedFlows: LineageFlow[];
  fileDependencies: { sourceFile: string; targetFile: string; sharedTable: string }[];
}

export const parseRepositoryLineage = (files: RepositoryFileInput[]): RepositoryLineageResult => {
  const extractedScripts: ExtractedScript[] = [];
  const combinedFlows: LineageFlow[] = [];

  // Step 1: Preprocess and extract SQL from files
  files.forEach(f => {
    const lowerName = f.filename.toLowerCase();

    if (lowerName.endsWith('.py')) {
      const scripts = extractSqlFromPythonDag(f.content, f.filename);
      extractedScripts.push(...scripts);
    } else if (lowerName.endsWith('.sql') || lowerName.endsWith('.txt') || lowerName.endsWith('.ddl')) {
      const isDbt = f.content.includes('ref(') || f.content.includes('source(') || f.content.includes('config(') || lowerName.includes('model');
      let cleaned = preprocessDbtSql(f.content);

      if (isDbt && !/^\s*(?:insert|create|update|merge|delete)\b/i.test(cleaned)) {
        const parts = f.filename.replace(/\\/g, '/').split('/');
        const modelName = parts[parts.length - 1].replace(/\.sql$/i, '');
        if (modelName) {
          cleaned = `CREATE TABLE ${modelName} AS ${cleaned}`;
        }
      }

      extractedScripts.push({
        filename: f.filename,
        sql: cleaned,
        type: isDbt ? 'dbt' : 'sql'
      });
    }
  });

  // Step 2: Parse Lineage for each extracted script
  const fileProducersMap = new Map<string, string>(); // tableName -> producerFilename

  extractedScripts.forEach(script => {
    const parsed = parseLineage(script.sql);

    parsed.flows.forEach(f => {
      combinedFlows.push({
        ...f,
        fileOrigin: script.filename
      });
      fileProducersMap.set(f.targetTable.toLowerCase(), script.filename);
    });
  });

  // Step 3: Compute Cross-File Dependencies
  const fileDependencies: { sourceFile: string; targetFile: string; sharedTable: string }[] = [];
  const depSet = new Set<string>();

  combinedFlows.forEach(f => {
    const producerFile = fileProducersMap.get(f.sourceTable.toLowerCase());
    if (producerFile && f.fileOrigin && producerFile !== f.fileOrigin) {
      const key = `${producerFile}->${f.fileOrigin}:${f.sourceTable}`;
      if (!depSet.has(key)) {
        depSet.add(key);
        fileDependencies.push({
          sourceFile: producerFile,
          targetFile: f.fileOrigin,
          sharedTable: f.sourceTable
        });
      }
    }
  });

  return {
    scripts: extractedScripts,
    combinedFlows,
    fileDependencies
  };
};
