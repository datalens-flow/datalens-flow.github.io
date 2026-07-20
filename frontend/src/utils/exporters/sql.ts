import { SchemaResponse } from '../../types/schema';

// 4. Dialect-aware SQL DDL Formatter
export function generateSqlDdlLocal(schema: SchemaResponse, targetDialect: string = 'postgres'): string {
  const dialect = targetDialect.toLowerCase();
  const statements: string[] = [];

  // Helper to map generic SQL types to dialect-specific types
  const mapType = (type: string): string => {
    let t = type.toUpperCase().trim();
    if (dialect === 'oracle') {
      if (t.startsWith('VARCHAR')) return t.replace('VARCHAR', 'VARCHAR2');
      if (t === 'INT' || t === 'INTEGER') return 'NUMBER(10)';
      if (t === 'BOOLEAN') return 'NUMBER(1)';
    } else if (dialect === 'mysql') {
      if (t === 'BOOLEAN') return 'TINYINT(1)';
    } else if (dialect === 'sqlite') {
      if (t.startsWith('VARCHAR') || t === 'TEXT') return 'TEXT';
      if (t.startsWith('DECIMAL') || t === 'FLOAT' || t === 'DOUBLE') return 'REAL';
    }
    return t;
  };

  for (const table of schema.tables) {
    const colDefs: string[] = [];

    for (const col of table.columns) {
      const typeStr = mapType(col.type);
      let colStr = `${col.name} ${typeStr}`;

      if (col.is_pk) {
        colStr += ' PRIMARY KEY';
      }
      if (!col.nullable) {
        colStr += ' NOT NULL';
      }
      if (col.default) {
        // Enclose text defaults in single quotes
        const val = col.default.replace(/['"]/g, '');
        if (/^\\d+(\\.\\d+)?$/.test(val) || val.toUpperCase() === 'NULL' || val.toUpperCase() === 'CURRENT_TIMESTAMP') {
          colStr += ` DEFAULT ${val}`;
        } else {
          colStr += ` DEFAULT '${val}'`;
        }
      }

      colDefs.push(colStr);
    }

    // Outline Foreign Keys
    for (const col of table.columns) {
      if (col.is_fk && col.fk_ref_table && col.fk_ref_column) {
        colDefs.push(`FOREIGN KEY (${col.name}) REFERENCES ${col.fk_ref_table}(${col.fk_ref_column})`);
      }
    }

    statements.push(`CREATE TABLE ${table.name} (\\n  ${colDefs.join(',\\n  ')}\\n);`);
  }

  return statements.join('\\n\\n');
}
