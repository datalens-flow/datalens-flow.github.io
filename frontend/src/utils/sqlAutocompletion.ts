import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const createSqlAutocompletion = (schema?: any) => {
  const sqlKeywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN',
    'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET',
    'DELETE FROM', 'CREATE TABLE', 'WITH', 'COALESCE', 'CURRENT_TIMESTAMP', 'CASE', 'WHEN',
    'THEN', 'ELSE', 'END', 'AS', 'ON', 'AND', 'OR', 'NOT', 'IS', 'NULL', 'DISTINCT'
  ];

  return autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        const word = context.matchBefore(/\w*/);
        if (!word || (word.from === word.to && !context.explicit)) {
          return null;
        }

        const options: any[] = [];

        // 1. Add Tables from active Schema
        if (schema && schema.tables) {
          schema.tables.forEach((table: any) => {
            options.push({
              label: table.name,
              type: 'class',
              detail: '🏷️ Table',
              boost: 10
            });

            // 2. Add Columns from active Schema
            if (table.columns) {
              table.columns.forEach((col: any) => {
                options.push({
                  label: col.name,
                  type: 'property',
                  detail: `📌 Column (${table.name})`,
                  boost: 8
                });
              });
            }
          });
        }

        // 3. Add SQL Keywords
        sqlKeywords.forEach(kw => {
          options.push({
            label: kw,
            type: 'keyword',
            detail: '⚡ Keyword',
            boost: 5
          });
        });

        return {
          from: word.from,
          options,
          filter: true
        };
      }
    ]
  });
};
