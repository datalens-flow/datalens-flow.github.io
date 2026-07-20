import { SchemaResponse } from '../../types/schema';

// 2. Local Markdown Data Dictionary Generator
export function generateMarkdownDataDict(
  schema: SchemaResponse,
  descriptions: Record<string, Record<string, string>>
): string {
  const lines: string[] = [
    '# Data Dictionary',
    '',
    `Generated on: ${new Date().toLocaleDateString()}`,
    ''
  ];

  for (const table of schema.tables) {
    lines.push(`## Table: ${table.name}`);
    lines.push('');
    lines.push('| Column Name | Type | Key | Nullable | Default | Description |');
    lines.push('|---|---|---|---|---|---|');

    for (const col of table.columns) {
      const keys: string[] = [];
      if (col.is_pk) keys.push('PK');
      if (col.is_fk) keys.push('FK');
      const keyStr = keys.join(', ') || '-';

      const nullableStr = col.nullable ? 'YES' : 'NO';
      const defaultStr = col.default || '-';
      const commentStr = descriptions[table.id]?.[col.name] || col.comment || '';

      lines.push(`| **${col.name}** | \`${col.type}\` | ${keyStr} | ${nullableStr} | \`${defaultStr}\` | ${commentStr} |`);
    }
    lines.push('');
  }

  return lines.join('\\n');
}
