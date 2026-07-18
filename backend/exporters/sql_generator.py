from backend.models import SchemaResponse

def generate_sql_ddl(schema: SchemaResponse) -> str:
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
            if col.is_fk:
                col_defs.append(f"FOREIGN KEY ({col.name}) REFERENCES {col.fk_ref_table}({col.fk_ref_column})")
                
        stmt = f"CREATE TABLE {table.name} (\n  " + ",\n  ".join(col_defs) + "\n);"
        statements.append(stmt)
        
    raw_sql = "\n\n".join(statements)
    return raw_sql
