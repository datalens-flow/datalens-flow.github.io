import { SQL_KEYWORDS } from './types';
import { extractTableName } from './parserUtils';

export interface CteInfo {
  cteNames: Set<string>;
  cteToRealSources: Record<string, string[]>;
  cteOrder: string[];
}

export const extractCTEs = (cleanSql: string): CteInfo => {
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
  return { cteNames, cteToRealSources, cteOrder };
};

export const resolveCteSources = (
  cteName: string,
  cteToRealSources: Record<string, string[]>,
  cteOrder: string[],
  visited = new Set<string>()
): string[] => {
  if (visited.has(cteName)) return [];
  visited.add(cteName);
  const directSources = cteToRealSources[cteName] || [];
  const resolved: string[] = [];
  const currentCteIdx = cteOrder.indexOf(cteName);

  directSources.forEach(src => {
    const srcIdx = cteOrder.indexOf(src);
    if (srcIdx !== -1 && srcIdx < currentCteIdx) {
      resolved.push(...resolveCteSources(src, cteToRealSources, cteOrder, visited));
    } else {
      resolved.push(src);
    }
  });
  return [...new Set(resolved)];
};
