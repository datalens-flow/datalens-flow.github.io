/**
 * Comprehensive lineage parser test suite
 * Covers all SQL patterns that can appear in ETL stored procedures
 */
import { parseLineage } from './lineageParser';

import { testCases } from './lineageTestCases';

// ===== Run Tests =====
let passed = 0;
let failed = 0;
const failures: string[] = [];

testCases.forEach((tc) => {
  const result = parseLineage(tc.sql);
  const errors: string[] = [];

  // Check sources
  const sortedExpSrc = [...tc.expectedSources].sort();
  const sortedActSrc = [...result.sources].sort();
  if (JSON.stringify(sortedExpSrc) !== JSON.stringify(sortedActSrc)) {
    errors.push(`  Sources: expected [${sortedExpSrc}] got [${sortedActSrc}]`);
  }

  // Check targets
  const sortedExpTgt = [...tc.expectedTargets].sort();
  const sortedActTgt = [...result.targets].sort();
  if (JSON.stringify(sortedExpTgt) !== JSON.stringify(sortedActTgt)) {
    errors.push(`  Targets: expected [${sortedExpTgt}] got [${sortedActTgt}]`);
  }

  // Check flows (each expected flow must exist in actual)
  tc.expectedFlows.forEach((ef) => {
    const found = result.flows.some(
      f => f.sourceTable === ef.src && f.sourceCol === ef.srcCol &&
           f.targetTable === ef.tgt && f.targetCol === ef.tgtCol
    );
    if (!found) {
      errors.push(`  Missing flow: ${ef.src}.${ef.srcCol} → ${ef.tgt}.${ef.tgtCol}`);
    }
  });

  // Check no unexpected "*" flows when specific columns are expected
  if (tc.expectedFlows.length > 0 && !tc.expectedFlows.some(f => f.srcCol === '*')) {
    const wildcardFlows = result.flows.filter(f => f.sourceCol === '*' || f.targetCol === '*');
    if (wildcardFlows.length > 0) {
      errors.push(`  Unexpected wildcard flows: ${wildcardFlows.map(f => `${f.sourceTable}.*→${f.targetTable}.*`).join(', ')}`);
    }
  }

  if (errors.length === 0) {
    console.log(`✅ PASS: ${tc.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${tc.name}`);
    errors.forEach(e => console.log(e));
    // Also show actual flows for debugging
    if (result.flows.length > 0) {
      console.log(`  Actual flows:`);
      result.flows.forEach(f => console.log(`    ${f.sourceTable}.${f.sourceCol} → ${f.targetTable}.${f.targetCol}`));
    }
    failed++;
    failures.push(tc.name);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${testCases.length} total`);
if (failures.length > 0) {
  console.log(`\nFailed tests:`);
  failures.forEach(f => console.log(`  - ${f}`));
}
console.log(`${'='.repeat(60)}`);
