import { LineageFlow } from './types';
import { resolveColumn } from './parserUtils';

export const handleUpdate = (
  cleanStmt: string,
  targetTable: string,
  aliasMap: Record<string, string>,
  sourceTables: string[],
  allFlows: LineageFlow[],
  action: LineageFlow['action'] = 'update'
) => {
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
        action,
      });
    });
  }
};

export const handleMerge = (
  targetTable: string,
  sourceTables: string[],
  allFlows: LineageFlow[],
  action: LineageFlow['action'] = 'merge'
) => {
  sourceTables.forEach(srcTable => {
    allFlows.push({ sourceTable: srcTable, sourceCol: '*', targetTable, targetCol: '*', action });
  });
};

