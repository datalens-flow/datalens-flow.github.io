export interface ParsedProcedure {
  name: string;
  sql: string;
}

export function splitProcedures(sql: string): ParsedProcedure[] {
  // Regex to match CREATE [OR REPLACE] PROCEDURE|FUNCTION name
  const procRegex = /create\s+(?:or\s+replace\s+)?(?:procedure|function)\s+([a-zA-Z0-9_.]+)/gi;
  
  const procedures: ParsedProcedure[] = [];
  
  // Find all procedure declarations
  const matches = [...sql.matchAll(procRegex)];

  if (matches.length === 0) {
    return [{ name: 'Global Script', sql: sql.trim() }];
  }

  // If there's text before the first procedure, keep it as 'Global Script' if it has non-whitespace
  const firstMatchIndex = matches[0].index!;
  if (firstMatchIndex > 0) {
    const preamble = sql.substring(0, firstMatchIndex).trim();
    if (preamble) {
      procedures.push({ name: 'Global Script', sql: preamble });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];
    
    // Name can be schema.proc_name, extract just the proc_name for readability
    let fullProcName = match[1];
    const parts = fullProcName.split('.');
    const cleanName = parts.length > 1 ? parts[1] : parts[0];

    const startIdx = match.index!;
    const endIdx = nextMatch ? nextMatch.index! : sql.length;
    
    const blockSql = sql.substring(startIdx, endIdx).trim();
    procedures.push({ name: cleanName.toUpperCase(), sql: blockSql });
  }

  return procedures;
}
