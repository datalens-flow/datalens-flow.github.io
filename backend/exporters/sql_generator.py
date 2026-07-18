import sqlglot
from backend.models import SchemaResponse

def generate_sql_ddl(schema: SchemaResponse, target_dialect: str = "postgres") -> str:
    statements = []
    for table in schema.tables:
        col_defs = []
        for col in table.columns:
            col_str = f"{col.name} {col.type}"
            if col.is_pk:
                col_str += " PRIMARY KEY"
            if not col.nullable:
                col_str += " NOT NULL"
            if col.default:
                col_str += f" DEFAULT {col.default}"
            col_defs.append(col_str)
            
        for col in table.columns:
            if col.is_fk and col.fk_ref_table and col.fk_ref_column:
                col_defs.append(f"FOREIGN KEY ({col.name}) REFERENCES {col.fk_ref_table}({col.fk_ref_column})")
                
        stmt = f"CREATE TABLE {table.name} (\n  " + ",\n  ".join(col_defs) + "\n);"
        statements.append(stmt)
        
    raw_sql = "\n\n".join(statements)
    
    # Transpile using sqlglot if target dialect is different
    target_lower = target_dialect.lower()
    if target_lower != "postgres":
        try:
            # map dialect names if needed (e.g. mssql -> tsql)
            read_dialect = "postgres"
            write_dialect = target_lower
            if write_dialect == "mssql":
                write_dialect = "tsql"
                
            transpiled = sqlglot.transpile(raw_sql, read=read_dialect, write=write_dialect, pretty=True)
            return "\n\n".join(transpiled)
        except Exception as e:
            # Fallback to standard generated SQL if transpile fails
            print(f"Transpilation failed: {e}")
            return raw_sql
            
    return raw_sql
