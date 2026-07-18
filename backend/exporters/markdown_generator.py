from backend.models import ExportRequest

def generate_markdown_doc(req: ExportRequest) -> str:
    lines = []
    lines.append("# Data Dictionary")
    lines.append(f"*Generated automatically on Dialect: **{req.schema_data.dialect.upper()}***\n")
    
    for table in req.schema_data.tables:
        lines.append(f"## Table: `{table.name}`")
        lines.append("| Column | Type | Nullable | PK | FK | Default | Description |")
        lines.append("| --- | --- | --- | --- | --- | --- | --- |")
        table_desc = req.descriptions.get(table.id, {})
        
        for col in table.columns:
            pk_str = "✅" if col.is_pk else ""
            fk_str = f"🔗 `{col.fk_ref_table}.{col.fk_ref_column}`" if col.is_fk else ""
            nullable_str = "Yes" if col.nullable else "No"
            default_str = f"`{col.default}`" if col.default else ""
            desc = table_desc.get(col.name, col.comment or "")
            lines.append(f"| `{col.name}` | `{col.type}` | {nullable_str} | {pk_str} | {fk_str} | {default_str} | {desc} |")
        lines.append("")
        
    return "\n".join(lines)
