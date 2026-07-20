import { LineageFlow, LineageResult, SQL_KEYWORDS } from './types';
import { extractTableName, resolveColumn } from './parserUtils';

export const parseLineage = (sql: string): LineageResult => {
  const allFlows: LineageFlow[] = [];
  const tableRoles: Record<string, { isSource: boolean; isTarget: boolean }> = {};

  // Remove comments
  const cleanSql = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');

  // --- Extract CTEs (WITH ... AS (...)) ---
  const cteNames = new Set<string>();
  const cteToRealSources: Record<string, string[]> = {};
  const cteOrder: string[] = [];

  const cleanSqlLower = cleanSql.toLowerCase();
  let searchPos = 0;
  while (true) {
    const withIdx = cleanSqlLower.indexOf('with', searchPos);
    if (withIdx === -1) break;

    const isWordBoundary = (withIdx === 0 || !/[a-zA-Z0-9_]/.test(cleanSql[withIdx - 1])) &&
                           (withIdx + 4 >= cleanSql.length || !/[a-zA-Z0-9_]/.test(cleanSql[withIdx + 4]));

    if (!isWordBoundary) {
      searchPos = withIdx + 4;
      continue;
    }

    let depth = 0;
    let mainActionIdx = -1;
    for (let i = withIdx + 4; i < cleanSql.length; i++) {
      if (cleanSql[i] === '(') depth++;
      if (cleanSql[i] === ')') depth--;
      if (depth === 0) {
        const sub = cleanSqlLower.substring(i).trim();
        if (/^(?:select|insert|update|delete|merge)\b/i.test(sub)) {
          mainActionIdx = i;
          break;
        }
      }
    }

    const cteBlock = cleanSql.substring(withIdx + 4, mainActionIdx !== -1 ? mainActionIdx : cleanSql.length);
    
    let currentPos = 0;
    while (currentPos < cteBlock.length) {
      const nextAsMatch = cteBlock.substring(currentPos).match(/\b(\w+)\s+as\s*\(/i);
      if (!nextAsMatch || nextAsMatch.index === undefined) break;

      const cteName = nextAsMatch[1].toLowerCase();
      const matchStartInBlock = currentPos + nextAsMatch.index;
      const bodyStart = matchStartInBlock + nextAsMatch[0].length;

      let depthInner = 1;
      let bodyEnd = bodyStart;
      for (let i = bodyStart; i < cteBlock.length && depthInner > 0; i++) {
        if (cteBlock[i] === '(') depthInner++;
        if (cteBlock[i] === ')') depthInner--;
        bodyEnd = i;
      }

      if (!SQL_KEYWORDS.has(cteName)) {
        cteNames.add(cteName);
        cteOrder.push(cteName);
        
        const cteBody = cteBlock.substring(bodyStart, bodyEnd);
        const fromMatches = [...cteBody.matchAll(/\b(?:from|join)\s+([\w.]+)/gi)];
        const realSources: string[] = [];
        fromMatches.forEach(m => {
          const tbl = extractTableName(m[1]);
          if (!SQL_KEYWORDS.has(tbl)) {
            realSources.push(tbl);
          }
        });
        cteToRealSources[cteName] = realSources;
      }

      currentPos = bodyEnd + 1;
      const commaSearch = cteBlock.substring(currentPos).match(/\s*,\s*/);
      if (commaSearch && commaSearch.index === 0) {
        currentPos += commaSearch[0].length;
      }
    }

    searchPos = mainActionIdx !== -1 ? mainActionIdx : cleanSql.length;
  }

  const resolveCteSources = (cteName: string, visited = new Set<string>()): string[] => {
    if (visited.has(cteName)) return [];
    visited.add(cteName);
    const directSources = cteToRealSources[cteName] || [];
    const resolved: string[] = [];
    const currentCteIdx = cteOrder.indexOf(cteName);

    directSources.forEach(src => {
      const srcIdx = cteOrder.indexOf(src);
      if (srcIdx !== -1 && srcIdx < currentCteIdx) {
        resolved.push(...resolveCteSources(src, visited));
      } else {
        resolved.push(src);
      }
    });
    return [...new Set(resolved)];
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
      const subQueries = cleanStmt.split(/\b(?:union\s+all|union|intersect|except)\b/i);
      
      subQueries.forEach(subQuery => {
        const subAliasMap: Record<string, string> = { ...aliasMap };
        const subAliasMatches = [...subQuery.matchAll(/(?:from|join|using)\s+([\w.]+)(?:\s+(?:as\s+)?(\w+))?/gi)];
        subAliasMatches.forEach(m => {
          const tableName = extractTableName(m[1]);
          if (SQL_KEYWORDS.has(tableName)) return;
          const alias = m[2] && !SQL_KEYWORDS.has(m[2].toLowerCase()) ? m[2].toLowerCase() : tableName;
          subAliasMap[alias] = tableName;
          subAliasMap[tableName] = tableName;
        });

        Object.entries(subAliasMap).forEach(([alias, tableName]) => {
          if (cteNames.has(tableName)) {
            const realSources = resolveCteSources(tableName);
            if (realSources.length > 0) {
              subAliasMap[alias] = realSources[0];
            } else {
              delete subAliasMap[alias];
            }
          }
        });

        const subSourceTables = [...new Set(Object.values(subAliasMap))]
          .filter(t => t !== targetTable && !cteNames.has(t));

        const activeSources = subSourceTables.length > 0 ? subSourceTables : sourceTables;

        const resolveSubColumn = (expr: string): { table: string; col: string } | null => {
          const res = resolveColumn(expr, subAliasMap, activeSources, cleanStmt);
          if (!res) return null;
          if (res.table === 'unknown' || !activeSources.includes(res.table)) {
            const dotParts = expr.trim().split('.');
            if (dotParts.length === 2) {
              const alias = dotParts[0].toLowerCase();
              const table = subAliasMap[alias] || activeSources[0] || 'unknown';
              return { table, col: dotParts[1] };
            }
            return { table: activeSources[0] || 'unknown', col: res.col };
          }
          return res;
        };

        let selectText = '';
        const selectIdx = subQuery.toLowerCase().indexOf('select');
        if (selectIdx !== -1) {
          let depth = 0;
          let fromIdx = -1;
          for (let i = selectIdx + 6; i < subQuery.length; i++) {
            if (subQuery[i] === '(') depth++;
            if (subQuery[i] === ')') depth--;
            if (depth === 0) {
              const sub = subQuery.substring(i).trim();
              if (/^from\b/i.test(sub)) {
                const fromOffset = subQuery.substring(i).toLowerCase().indexOf('from');
                fromIdx = i + fromOffset;
                break;
              }
            }
          }
          if (fromIdx !== -1) {
            selectText = subQuery.substring(selectIdx + 6, fromIdx).trim();
          }
        }

        if (selectText) {
          if (isCtas || selectText === '*') {
            activeSources.forEach(srcTable => {
              allFlows.push({ sourceTable: srcTable, sourceCol: '*', targetTable, targetCol: '*' });
            });
            return;
          }

          const selectExprs: string[] = [];
          let currentExpr = '';
          let parenDepth = 0;
          
          for (let i = 0; i < selectText.length; i++) {
            const char = selectText[i];
            if (char === '(') parenDepth++;
            if (char === ')') parenDepth--;
            
            if (char === ',' && parenDepth === 0) {
              selectExprs.push(currentExpr.trim().replace(/\s+/g, ' '));
              currentExpr = '';
            } else {
              currentExpr += char;
            }
          }
          if (currentExpr.trim()) {
            selectExprs.push(currentExpr.trim().replace(/\s+/g, ' '));
          }

          let subTargetCols = [...targetCols];
          if (subTargetCols.length === 0) {
            subTargetCols = selectExprs.map(expr => {
              const aliasMatch = expr.match(/\b(?:as\s+)?(\w+)\s*$/i);
              if (aliasMatch && !SQL_KEYWORDS.has(aliasMatch[1].toLowerCase())) {
                return aliasMatch[1].toLowerCase();
              }
              const parts = expr.split(/\s+/)[0].split('.');
              return parts[parts.length - 1].toLowerCase();
            });
          }

          selectExprs.forEach((expr, idx) => {
            const targetCol = subTargetCols[idx];
            if (!targetCol) return;

            const resolved = resolveSubColumn(expr);
            if (!resolved) return;

            allFlows.push({
              sourceTable: resolved.table,
              sourceCol: resolved.col,
              targetTable,
              targetCol,
            });
          });
        } else if (activeSources.length > 0) {
          activeSources.forEach(srcTable => {
            allFlows.push({ sourceTable: srcTable, sourceCol: '*', targetTable, targetCol: '*' });
          });
        }
      });
    }

    if (isUpdate) {
      const setMatch = cleanStmt.match(/\bset\s+([\s\S]+?)(?:\bfrom\b|\bwhere\b|$)/i);
      if (setMatch) {
        const assignments = setMatch[1].split(',').map(a => a.trim());

        assignments.forEach(assignment => {
          const eqIdx = assignment.indexOf('=');
          if (eqIdx === -1) return;

          const leftSide = assignment.substring(0, eqIdx).trim();
          const rightSide = assignment.substring(eqIdx + 1).trim();

          const targetCol = leftSide.split('.').pop()?.toLowerCase() || '';

          const resolved = resolveColumn(rightSide, aliasMap, sourceTables, cleanStmt);
          if (!resolved) return;

          allFlows.push({
            sourceTable: resolved.table,
            sourceCol: resolved.col,
            targetTable,
            targetCol,
          });
        });
      }
    }

    if (isMerge) {
      sourceTables.forEach(srcTable => {
        allFlows.push({ sourceTable: srcTable, sourceCol: '*', targetTable, targetCol: '*' });
      });
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
