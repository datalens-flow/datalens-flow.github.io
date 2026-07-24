import { SqlDialect } from './sqlTranspilerEngine';

export interface LinterIssue {
  severity: 'info' | 'warning' | 'error';
  line?: number;
  message: string;
  suggestion?: string;
}

export interface LinterResult {
  compatibilityScore: number; // 0 to 100
  issues: LinterIssue[];
}

export const lintSqlCompatibility = (
  sql: string,
  sourceDialect: SqlDialect,
  targetDialect: SqlDialect
): LinterResult => {
  if (!sql.trim() || sourceDialect === targetDialect) {
    return { compatibilityScore: 100, issues: [] };
  }

  const issues: LinterIssue[] = [];
  const lines = sql.split('\n');

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    // 1. Oracle Cursors or Procedural PL/SQL blocks
    if (sourceDialect === 'oracle' && /\bcursor\s+\w+\s+is\b/i.test(lineText)) {
      issues.push({
        severity: 'warning',
        line: lineNum,
        message: 'Oracle Explicit Cursor detected (CURSOR name IS).',
        suggestion: 'Procedural cursors cannot be auto-transpiled into standard SQL. Consider refactoring into set-based CTE queries.'
      });
    }

    // 2. T-SQL GOTO or PRINT statements
    if (sourceDialect === 'tsql' && /\bgoto\s+\w+/i.test(lineText)) {
      issues.push({
        severity: 'error',
        line: lineNum,
        message: 'T-SQL GOTO control statement detected.',
        suggestion: 'GOTO control flow is non-portable. Replace with structured IF/ELSE or procedure loops.'
      });
    }

    // 3. MySQL ENGINE=InnoDB or CHARSET options
    if (sourceDialect === 'mysql' && /\bengine\s*=\s*\w+/i.test(lineText)) {
      issues.push({
        severity: 'info',
        line: lineNum,
        message: 'MySQL storage engine clause (ENGINE=...) detected.',
        suggestion: 'Storage engine options will be ignored by non-MySQL targets.'
      });
    }

    // 4. Temporary Tables (#temp or CREATE TEMP TABLE)
    if (/\b(?:#\w+|create\s+(?:global\s+|local\s+)?temp(?:orary)?\s+table)\b/i.test(lineText)) {
      issues.push({
        severity: 'info',
        line: lineNum,
        message: 'Temporary Table usage detected.',
        suggestion: 'Ensure target database supports temporary table syntax or use WITH CTEs.'
      });
    }

    // 5. BigQuery Reserved Word or Hyphenated Table Names
    if (targetDialect === 'bigquery' && /`[^`]*-[^`]*`/i.test(lineText)) {
      issues.push({
        severity: 'warning',
        line: lineNum,
        message: 'BigQuery backticked table with hyphens detected.',
        suggestion: 'BigQuery project/dataset identifiers with hyphens must be backticked strictly.'
      });
    }
  });

  // Calculate compatibility score
  let errorCount = issues.filter(i => i.severity === 'error').length;
  let warnCount = issues.filter(i => i.severity === 'warning').length;
  let score = Math.max(0, 100 - errorCount * 25 - warnCount * 10);

  return {
    compatibilityScore: score,
    issues
  };
};
