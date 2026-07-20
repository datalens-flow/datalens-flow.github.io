import { LineageFlow, SQL_KEYWORDS } from './types';
import { extractTableName, resolveColumn } from './parserUtils';

export const handleInsert = (
  cleanStmt: string,
  targetTable: string,
  targetCols: string[],
  isCtas: boolean,
  aliasMap: Record<string, string>,
  sourceTables: string[],
  cteNames: Set<string>,
  resolveCteSourcesFunc: (name: string) => string[],
  allFlows: LineageFlow[],
  action: LineageFlow['action'] = 'insert'
) => {
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
        const realSources = resolveCteSourcesFunc(tableName);
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
          allFlows.push({ sourceTable: srcTable, sourceCol: '*', targetTable, targetCol: '*', action: isCtas ? 'ctas' : action });
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
          action: isCtas ? 'ctas' : action,
        });
      });
    } else if (activeSources.length > 0) {
      activeSources.forEach(srcTable => {
        allFlows.push({ sourceTable: srcTable, sourceCol: '*', targetTable, targetCol: '*', action: isCtas ? 'ctas' : action });
      });
    }
  });
};
