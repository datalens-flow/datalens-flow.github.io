import datetime
from typing import List, Dict, Any, Optional, Tuple
from sqlglot import parse, exp
from backend.models import SchemaResponse, TableSchema, ColumnSchema, RelationshipSchema

def extract_reference(ref_expr: Optional[exp.Reference]) -> Tuple[Optional[str], List[str]]:
    if not ref_expr:
        return None, []
    if isinstance(ref_expr.this, exp.Schema):
        ref_table = ref_expr.this.this.name
        ref_cols = [c.name for c in ref_expr.this.expressions]
    else:
        ref_table = ref_expr.this.name
        ref_cols = []
    return ref_table, ref_cols

def parse_sql_script(sql_text: str, dialect: str) -> SchemaResponse:
    tables: List[TableSchema] = []
    relationships: List[RelationshipSchema] = []
    warnings: List[str] = []
    
    # Map from table_name (lowercase) to its schemas
    table_map: Dict[str, TableSchema] = {}
    
    try:
        expressions = parse(sql_text, read=dialect)
    except Exception as e:
        return SchemaResponse(
            tables=[],
            relationships=[],
            dialect=dialect,
            warnings=[f"Failed to parse SQL: {str(e)}"],
            parsed_at=datetime.datetime.now(datetime.UTC).isoformat()
        )

    for expression in expressions:
        if not expression:
            continue
        
        # 1. CREATE TABLE
        if isinstance(expression, exp.Create) and isinstance(expression.this, exp.Schema):
            schema_expr = expression.this
            table_name_expr = schema_expr.this
            table_name = table_name_expr.name
            table_id = table_name.lower()
            schema_name = table_name_expr.text("db") or None
            
            columns: List[ColumnSchema] = []
            pk_cols: List[str] = []
            table_fks: List[Dict[str, Any]] = []
            
            # First pass: table-level constraints in Schema expressions
            for constraint in schema_expr.expressions:
                # Table level PK
                if isinstance(constraint, exp.PrimaryKey):
                    for col in constraint.expressions:
                        pk_cols.append(col.name)
                
                # Table level FK
                elif isinstance(constraint, exp.ForeignKey):
                    ref_expr = constraint.args.get("reference")
                    ref_table, ref_cols = extract_reference(ref_expr)
                    if ref_table:
                        fk_cols = [c.name for c in constraint.expressions]
                        for c, rc in zip(fk_cols, ref_cols or ["id"]):
                            table_fks.append({
                                "col": c,
                                "ref_table": ref_table,
                                "ref_col": rc
                            })
            
            # Second pass: column definitions
            for column_def in schema_expr.find_all(exp.ColumnDef):
                col_name = column_def.name
                data_type = str(column_def.kind)
                
                is_pk = col_name in pk_cols
                is_fk = False
                fk_ref_table: Optional[str] = None
                fk_ref_column: Optional[str] = None
                nullable = True
                default_val: Optional[str] = None
                
                # Check column-level constraints
                for constraint in column_def.find_all(exp.ColumnConstraint):
                    kind = constraint.kind
                    if isinstance(kind, exp.NotNullColumnConstraint):
                        nullable = False
                    elif isinstance(kind, exp.PrimaryKeyColumnConstraint):
                        is_pk = True
                    elif isinstance(kind, exp.DefaultColumnConstraint):
                        default_val = str(kind.this)
                        
                # Check inline References
                ref_expr = column_def.find(exp.Reference)
                ref_table, ref_cols = extract_reference(ref_expr)
                if ref_table:
                    is_fk = True
                    fk_ref_table = ref_table
                    fk_ref_column = ref_cols[0] if ref_cols else "id"
                
                # Apply table-level FK if found
                for tfk in table_fks:
                    if tfk["col"] == col_name:
                        is_fk = True
                        fk_ref_table = tfk["ref_table"]
                        fk_ref_column = tfk["ref_col"]
                
                columns.append(ColumnSchema(
                    name=col_name,
                    type=data_type,
                    nullable=nullable,
                    is_pk=is_pk,
                    is_fk=is_fk,
                    fk_ref_table=fk_ref_table,
                    fk_ref_column=fk_ref_column,
                    default=default_val,
                    comment=""
                ))
            
            # Store table schema
            table_schema = TableSchema(
                id=table_id,
                name=table_name,
                schema_name=schema_name,
                columns=columns
            )
            table_map[table_id] = table_schema
            tables.append(table_schema)
            
            # Add relationships from column constraints and table-level FKs
            for col in columns:
                if col.is_fk and col.fk_ref_table:
                    relationships.append(RelationshipSchema(
                        id=f"rel_{table_id}_{col.name}",
                        from_table=table_id,
                        from_column=col.name,
                        to_table=col.fk_ref_table.lower(),
                        to_column=col.fk_ref_column.lower() if col.fk_ref_column else "id",
                        type="many-to-one"
                    ))
        
        # 2. ALTER TABLE ADD CONSTRAINT FOREIGN KEY
        elif isinstance(expression, exp.AlterTable):
            table_name = expression.this.name
            table_id = table_name.lower()
            
            for fk_expr in expression.find_all(exp.ForeignKey):
                ref_expr = fk_expr.args.get("reference")
                ref_table, ref_cols = extract_reference(ref_expr)
                if ref_table:
                    fk_cols = [c.name for c in fk_expr.expressions]
                    
                    if table_id in table_map:
                        t_schema = table_map[table_id]
                        for c, rc in zip(fk_cols, ref_cols or ["id"]):
                            # Update column is_fk
                            for col in t_schema.columns:
                                if col.name == c:
                                    col.is_fk = True
                                    col.fk_ref_table = ref_table
                                    col.fk_ref_column = rc
                            
                            # Add relationship
                            relationships.append(RelationshipSchema(
                                id=f"rel_{table_id}_{c}",
                                from_table=table_id,
                                from_column=c,
                                to_table=ref_table.lower(),
                                to_column=rc.lower(),
                                type="many-to-one"
                            ))
                            
        # 3. INSERT DML (Inference)
        elif isinstance(expression, exp.Insert):
            table_expr = expression.this
            if isinstance(table_expr, exp.Schema):
                table_name = table_expr.this.name
                cols = [c.name for c in table_expr.expressions]
            elif isinstance(table_expr, exp.Table):
                table_name = table_expr.name
                cols = []
            else:
                continue
                
            table_id = table_name.lower()
            if table_id not in table_map:
                # Create inferred table
                columns = []
                for c in cols:
                    columns.append(ColumnSchema(
                        name=c,
                        type="VARCHAR(255)", # default type for DML inference
                        nullable=True,
                        is_pk=False,
                        is_fk=False,
                        comment=""
                    ))
                t_schema = TableSchema(
                    id=table_id,
                    name=table_name,
                    columns=columns
                )
                table_map[table_id] = t_schema
                tables.append(t_schema)
            else:
                # Add missing columns inferred from INSERT
                t_schema = table_map[table_id]
                existing_cols = {c.name.lower() for c in t_schema.columns}
                for c in cols:
                    if c.lower() not in existing_cols:
                        t_schema.columns.append(ColumnSchema(
                            name=c,
                            type="VARCHAR(255)",
                            nullable=True,
                            is_pk=False,
                            is_fk=False,
                            comment=""
                        ))
                                
    return SchemaResponse(
        tables=tables,
        relationships=relationships,
        dialect=dialect,
        warnings=warnings,
        parsed_at=datetime.datetime.now(datetime.UTC).isoformat()
    )
