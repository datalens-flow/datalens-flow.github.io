// @ts-nocheck

import { LineageFlow, LineageResult, SQL_KEYWORDS } from './types';
import { extractTableName } from './parserUtils';
import { extractCTEs, resolveCteSources as resolveCteSourcesImpl } from './parserCte';
import { handleInsert } from './parserInsert';
import { handleUpdate, handleMerge } from './parserUpdateMerge';

export const parseLineage = (sql: string): LineageResult => {
  const allFlows: LineageFlow[] = [];
  const tableRoles: Record<string, { isSource: boolean; isTarget: boolean }> = {};

  // Remove comments
  const cleanSql = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');

  const { cteNames, cteToRealSources, cteOrder } = extractCTEs(cleanSql);

  const resolveCteSources = (cteName: string, visited = new Set<string>()): string[] => {
    return resolveCteSourcesImpl(cteName, cteToRealSources, cteOrder, visited);
  };

  const statements = cleanSql.split(';').map(s => s.trim()).filter(s => s.length > 0);

  statements.forEach((stmt) => {
    let cleanStmt = stmt;
    const stmtLower = stmt.toLowerCase();
    const withIdx = stmtLower.match(/\bwith\b/);
    if (withIdx && withIdx.index !== undefined) {
      let depth = 0;
      let mainActionIdx = -1;
      const searchStart = withIdx.index + 4;
      for (let i = searchStart; i < stmt.length; i++) {
        if (stmt[i] === '(') depth++;
        if (stmt[i] === ')') depth--;
        if (depth === 0) {
          const sub = stmtLower.substring(i).trim();
          if (/^(?:select|insert|update|delete|merge)\b/i.test(sub)) {
            mainActionIdx = i;
            break;
          }
        }
      }
      if (mainActionIdx !== -1) {
        cleanStmt = stmt.substring(0, withIdx.index) + ' ' + stmt.substring(mainActionIdx);
      }
    }

    let targetTable = '';
    let targetCols: string[] = [];
    let isInsert = false;
    let isUpdate = false;
    let isMerge = false;
    let isCtas = false;

    const insertMatch = cleanStmt.match(/insert\s+into\s+([\w.]+)\s*(?:\(([^)]+)\))?/i);
    const createMatch = cleanStmt.match(/create\s+(?:table|view)\s+([\w.]+)\s+as\s/i);
    const updateMatch = cleanStmt.match(/update\s+([\w.]+)(?:\s+(\w+))?\s+set\s/i);
    const mergeMatch = cleanStmt.match(/merge\s+into\s+([\w.]+)\s+/i);

    if (insertMatch) {
      targetTable = extractTableName(insertMatch[1]);
      if (insertMatch[2]) {
        targetCols = insertMatch[2].split(',').map(c => c.trim().toLowerCase());
      }
      isInsert = true;
    } else if (createMatch) {
      targetTable = extractTableName(createMatch[1]);
      isInsert = true;
      isCtas = true;
    } else if (updateMatch) {
      targetTable = extractTableName(updateMatch[1]);
      isUpdate = true;
    } else if (mergeMatch) {
      targetTable = extractTableName(mergeMatch[1]);
      isMerge = true;
    } else {
      return;
    }

    if (!tableRoles[targetTable]) tableRoles[targetTable] = { isSource: false, isTarget: false };
    tableRoles[targetTable].isTarget = true;

    const aliasMap: Record<string, string> = {};
    const aliasMatches = [...cleanStmt.matchAll(/(?:from|join|using)\s+([\w.]+)(?:\s+(?:as\s+)?(\w+))?/gi)];
    aliasMatches.forEach(m => {
      const fullPath = m[1].toLowerCase();
      const dotParts = fullPath.split('.');
      if (dotParts.length > 1) {
        const prefix = dotParts[0];
        if (SQL_KEYWORDS.has(prefix)) return;
      }
      const tableName = extractTableName(m[1]);
      if (SQL_KEYWORDS.has(tableName)) return;
      const alias = m[2] && !SQL_KEYWORDS.has(m[2].toLowerCase()) ? m[2].toLowerCase() : tableName;
      aliasMap[alias] = tableName;
      aliasMap[tableName] = tableName;
    });

    if (isUpdate && updateMatch && updateMatch[2]) {
      const possibleAlias = updateMatch[2].toLowerCase();
      if (!SQL_KEYWORDS.has(possibleAlias)) {
        aliasMap[possibleAlias] = targetTable;
      }
    }

    const cteAliasExpansions: Record<string, string[]> = {};
    Object.entries(aliasMap).forEach(([alias, tableName]) => {
      if (cteNames.has(tableName)) {
        const realSources = resolveCteSources(tableName);
        cteAliasExpansions[alias] = realSources;
        if (realSources.length > 0) {
          aliasMap[alias] = realSources[0];
        } else {
          delete aliasMap[alias];
        }
      }
    });

    Object.keys(aliasMap).forEach(key => {
      if (cteNames.has(aliasMap[key])) {
        const realSources = resolveCteSources(aliasMap[key]);
        if (realSources.length > 0) {
          aliasMap[key] = realSources[0];
        } else {
          delete aliasMap[key];
        }
      }
    });

    const resolvedCteBases = new Set<string>();
    Object.values(cteAliasExpansions).forEach(realSources => {
      realSources.forEach(src => resolvedCteBases.add(src));
    });

    const sourceTables = [...new Set(Object.values(aliasMap))]
      .filter(t => t !== targetTable && (!cteNames.has(t) || resolvedCteBases.has(t)));

    Object.values(cteAliasExpansions).forEach(realSources => {
      realSources.forEach(src => {
        if (src !== targetTable && !sourceTables.includes(src)) {
          sourceTables.push(src);
        }
      });
    });

    sourceTables.forEach(srcTable => {
      if (cteNames.has(srcTable) && !resolvedCteBases.has(srcTable)) return;
      if (!tableRoles[srcTable]) tableRoles[srcTable] = { isSource: false, isTarget: false };
      tableRoles[srcTable].isSource = true;
    });

    if (isInsert) {
      handleInsert(
        cleanStmt,
        targetTable,
        targetCols,
        isCtas,
        aliasMap,
        sourceTables,
        cteNames,
        resolveCteSources,
        allFlows
      );
    }

    if (isUpdate) {
      handleUpdate(cleanStmt, targetTable, aliasMap, sourceTables, allFlows);
    }

    if (isMerge) {
      handleMerge(targetTable, sourceTables, allFlows);
    }
  });

  const globalResolvedCteBases = new Set<string>();

  statements.forEach((stmt) => {
    const aliasMap: Record<string, string> = {};
    const aliasMatches = [...stmt.matchAll(/(?:from|join|using)\s+([\w.]+)(?:\s+(?:as\s+)?(\w+))?/gi)];
    aliasMatches.forEach(m => {
      const tableName = extractTableName(m[1]);
      if (SQL_KEYWORDS.has(tableName)) return;
      const alias = m[2] && !SQL_KEYWORDS.has(m[2].toLowerCase()) ? m[2].toLowerCase() : tableName;
      aliasMap[alias] = tableName;
      aliasMap[tableName] = tableName;
    });
    Object.values(aliasMap).forEach(tableName => {
      if (cteNames.has(tableName)) {
        resolveCteSources(tableName).forEach(src => globalResolvedCteBases.add(src));
      }
    });
  });

  const sources = Object.entries(tableRoles)
    .filter(([t, r]) => r.isSource && (!cteNames.has(t) || globalResolvedCteBases.has(t)))
    .map(([t]) => t);
  const targets = Object.entries(tableRoles)
    .filter(([t, r]) => r.isTarget && (!cteNames.has(t) || globalResolvedCteBases.has(t)))
    .map(([t]) => t);

  const filteredFlows = allFlows.filter(
    f => (!cteNames.has(f.sourceTable) || globalResolvedCteBases.has(f.sourceTable)) &&
         (!cteNames.has(f.targetTable) || globalResolvedCteBases.has(f.targetTable))
  );

  return { sources, targets, flows: filteredFlows };
};
