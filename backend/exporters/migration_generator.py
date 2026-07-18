from backend.models import MigrationRequest, TableSchema, ColumnSchema

def generate_migration_script(req: MigrationRequest) -> str:
    statements = []
    
    orig_tables = {t.id: t for t in req.original_schema.tables}
    curr_tables = {t.id: t for t in req.current_schema.tables}
    
    # 1. Handle Table Renames
    rename_table_map = {} # old_table_id -> new_table_name
    for old_id, new_name in req.rename_events.tables.items():
        if old_id in orig_tables:
            orig_name = orig_tables[old_id].name
            statements.append(f"ALTER TABLE {orig_name} RENAME TO {new_name};")
            rename_table_map[old_id] = new_name
            
    # 2. Handle Dropped Tables
    for orig_id, orig_table in orig_tables.items():
        if orig_id not in curr_tables and orig_id not in req.rename_events.tables:
            statements.append(f"DROP TABLE {orig_table.name};")
            
    # 3. Helper to build CREATE TABLE statement
    def format_create_table(table: TableSchema) -> str:
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
        return f"CREATE TABLE {table.name} (\n  " + ",\n  ".join(col_defs) + "\n);"

    # 4. Handle Added Tables
    for curr_id, curr_table in curr_tables.items():
        # It's added if it doesn't exist in original schema, and wasn't renamed from anything
        is_renamed_target = any(nname.lower() == curr_id for nname in rename_table_map.values())
        if curr_id not in orig_tables and not is_renamed_target:
            statements.append(format_create_table(curr_table))

    # 5. Handle Alterations for Existing/Renamed Tables
    for curr_id, curr_table in curr_tables.items():
        # Find corresponding original table
        orig_id = None
        if curr_id in orig_tables:
            orig_id = curr_id
        else:
            # Check if it was renamed to this id
            for oid, nname in rename_table_map.items():
                if nname.lower() == curr_id:
                    orig_id = oid
                    break
                    
        if orig_id and orig_id in orig_tables:
            orig_table = orig_tables[orig_id]
            table_name = curr_table.name
            
            # Map columns to trace renames
            col_rename_map = req.rename_events.columns.get(orig_id, {})
            
            # Helper to map current column to original column name
            def get_original_col_name(c_name: str) -> str:
                for o_name, current_name in col_rename_map.items():
                    if current_name == c_name:
                        return o_name
                return c_name
                
            orig_cols = {c.name: c for c in orig_table.columns}
            curr_cols = {c.name: c for c in curr_table.columns}
            
            # Column Renames
            for old_col, new_col in col_rename_map.items():
                if old_col in orig_cols and new_col in curr_cols:
                    statements.append(f"ALTER TABLE {table_name} RENAME COLUMN {old_col} TO {new_col};")
                    
            # Dropped Columns
            for orig_col_name, orig_col in orig_cols.items():
                # If original column name is not in rename map and not in current table columns:
                is_renamed = orig_col_name in col_rename_map
                renamed_target = col_rename_map.get(orig_col_name)
                
                if not is_renamed and orig_col_name not in curr_cols:
                    statements.append(f"ALTER TABLE {table_name} DROP COLUMN {orig_col_name};")
                elif is_renamed and renamed_target not in curr_cols:
                    statements.append(f"ALTER TABLE {table_name} DROP COLUMN {orig_col_name};")

            # Added Columns
            for curr_col_name, curr_col in curr_cols.items():
                # Check if it was renamed
                was_renamed = any(new_c == curr_col_name for new_c in col_rename_map.values())
                orig_col_name = get_original_col_name(curr_col_name)
                
                if orig_col_name not in orig_cols and not was_renamed:
                    statements.append(f"ALTER TABLE {table_name} ADD COLUMN {curr_col_name} {curr_col.type};")

            # Type Changes
            dialect = req.current_schema.dialect.lower()
            for curr_col_name, curr_col in curr_cols.items():
                orig_col_name = get_original_col_name(curr_col_name)
                if orig_col_name in orig_cols:
                    orig_col = orig_cols[orig_col_name]
                    if orig_col.type.strip().lower() != curr_col.type.strip().lower():
                        # Dialect specific alter column type syntax
                        if "mysql" in dialect:
                            statements.append(f"ALTER TABLE {table_name} MODIFY COLUMN {curr_col_name} {curr_col.type};")
                        elif "oracle" in dialect:
                            statements.append(f"ALTER TABLE {table_name} MODIFY ({curr_col_name} {curr_col.type});")
                        else: # PostgreSQL, MSSQL, Snowflake default
                            statements.append(f"ALTER TABLE {table_name} ALTER COLUMN {curr_col_name} TYPE {curr_col.type};")
                            
    # 6. Add Foreign Key constraints from relationships
    orig_rels = {r.id: r for r in req.original_schema.relationships}
    curr_rels = {r.id: r for r in req.current_schema.relationships}
    
    for r_id, rel in curr_rels.items():
        if r_id not in orig_rels and not r_id.startswith("inferred_"):
            # Check if this FK relationship is new
            statements.append(
                f"ALTER TABLE {rel.from_table} ADD CONSTRAINT fk_{rel.from_table}_{rel.from_column} "
                f"FOREIGN KEY ({rel.from_column}) REFERENCES {rel.to_table}({rel.to_column});"
            )
            
    if not statements:
        return "-- No schema changes detected."
        
    return "\n".join(statements)
