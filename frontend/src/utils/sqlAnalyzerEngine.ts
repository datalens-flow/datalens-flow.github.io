export interface SqlAnalyzerIssue {
  severity: 'critical' | 'warning' | 'tip';
  title: string;
  description: string;
  recommendation: string;
  line?: number;
}

export interface SqlAnalyzerReport {
  score: number; // 0 to 100
  issues: SqlAnalyzerIssue[];
}

export const analyzeSqlQuality = (sql: string): SqlAnalyzerReport => {
  if (!sql.trim()) {
    return { score: 100, issues: [] };
  }

  const issues: SqlAnalyzerIssue[] = [];

  // 1. Critical Safety Risk: DELETE or UPDATE without WHERE clause
  if (/\b(?:delete\s+from|update)\s+[\w.]+\s*(?:;|$)/gi.test(sql) && !/\bwhere\b/i.test(sql)) {
    issues.push({
      severity: 'critical',
      title: '🛑 Dangerous Unbounded DELETE/UPDATE Query',
      description: 'DELETE or UPDATE statement detected without a WHERE clause.',
      recommendation: 'Add a WHERE clause to target specific records and prevent accidental full table wipeout.'
    });
  }

  // 2. Performance Warning: SELECT * in analytical queries
  if (/\bselect\s+\*\s+from\b/gi.test(sql)) {
    issues.push({
      severity: 'warning',
      title: '⚠️ Full Column Scan (SELECT *)',
      description: 'SELECT * fetches all columns, which increases memory overhead and scan cost in BigQuery/Snowflake columnar storage.',
      recommendation: 'Explicitly specify only required column names (e.g. SELECT col1, col2 FROM ...).'
    });
  }

  // 3. Cartesian Product / Cross Join Warning
  if (/\bfrom\s+\w+\s*,\s*\w+/gi.test(sql) && !/\bwhere\b/i.test(sql)) {
    issues.push({
      severity: 'warning',
      title: '⚠️ Implicit Cartesian Product (Comma Join)',
      description: 'Multiple tables joined via comma syntax without a WHERE condition creates a massive N x M Cartesian product.',
      recommendation: 'Use explicit JOIN ... ON clauses to define clear relationship boundaries.'
    });
  }

  // 4. Best Practice: ORDER BY without LIMIT
  if (/\border\s+by\b/gi.test(sql) && !/\b(?:limit|top|fetch\s+first)\b/i.test(sql)) {
    issues.push({
      severity: 'tip',
      title: '💡 Unbounded Sorting (ORDER BY without LIMIT)',
      description: 'Sorting large datasets without limiting rows forces full table memory sorting.',
      recommendation: 'Consider adding a LIMIT N or TOP N clause to bound query execution memory.'
    });
  }

  // Calculate SQL Health Score
  const criticals = issues.filter(i => i.severity === 'critical').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const tips = issues.filter(i => i.severity === 'tip').length;

  const score = Math.max(0, 100 - criticals * 40 - warnings * 20 - tips * 5);

  return {
    score,
    issues
  };
};
