import { parseLineage } from '../lineageParser';
import { LineageFlow } from './types';

export interface LineageDiffResult {
  addedFlows: LineageFlow[];
  removedFlows: LineageFlow[];
  unchangedFlows: LineageFlow[];
  summary: {
    addedCount: number;
    removedCount: number;
    unchangedCount: number;
    totalFlowsA: number;
    totalFlowsB: number;
  };
}

export const computeLineageDiff = (sqlA: string, sqlB: string): LineageDiffResult => {
  const resultA = parseLineage(sqlA);
  const resultB = parseLineage(sqlB);

  const getFlowKey = (f: LineageFlow) => `${f.sourceTable.toLowerCase()}.${f.sourceCol.toLowerCase()}->${f.targetTable.toLowerCase()}.${f.targetCol.toLowerCase()}`;

  const mapA = new Map<string, LineageFlow>();
  resultA.flows.forEach(f => mapA.set(getFlowKey(f), f));

  const mapB = new Map<string, LineageFlow>();
  resultB.flows.forEach(f => mapB.set(getFlowKey(f), f));

  const addedFlows: LineageFlow[] = [];
  const removedFlows: LineageFlow[] = [];
  const unchangedFlows: LineageFlow[] = [];

  // Check flows in B
  mapB.forEach((flowB, key) => {
    if (mapA.has(key)) {
      unchangedFlows.push(flowB);
    } else {
      addedFlows.push(flowB);
    }
  });

  // Check flows in A missing in B
  mapA.forEach((flowA, key) => {
    if (!mapB.has(key)) {
      removedFlows.push(flowA);
    }
  });

  return {
    addedFlows,
    removedFlows,
    unchangedFlows,
    summary: {
      addedCount: addedFlows.length,
      removedCount: removedFlows.length,
      unchangedCount: unchangedFlows.length,
      totalFlowsA: resultA.flows.length,
      totalFlowsB: resultB.flows.length
    }
  };
};
