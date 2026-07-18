from backend.models import SchemaResponse, TableSchema, ColumnSchema, RelationshipSchema, ExportRequest
from backend.exporters.drawio_generator import generate_drawio_xml
from backend.exporters.xlsx_generator import generate_xlsx_bytes
from backend.exporters.markdown_generator import generate_markdown_doc
from backend.exporters.sql_generator import generate_sql_ddl

def test_exporters():
    schema = SchemaResponse(
        tables=[
            TableSchema(
                id="users",
                name="users",
                columns=[
                    ColumnSchema(name="id", type="INT", nullable=False, is_pk=True, is_fk=False),
                    ColumnSchema(name="name", type="VARCHAR(255)", nullable=True, is_pk=False, is_fk=False)
                ]
            )
        ],
        relationships=[],
        dialect="postgres",
        warnings=[],
        parsed_at="2026-07-18T12:00:00Z"
    )
    
    # 1. Draw.io XML
    xml = generate_drawio_xml(schema)
    assert "<mxfile" in xml
    assert "users" in xml
    
    # 2. SQL DDL
    sql = generate_sql_ddl(schema)
    assert "CREATE TABLE users" in sql
    assert "id INT" in sql
    
    req = ExportRequest(
        schema_data=schema,
        descriptions={"users": {"name": "The user's full name"}}
    )
    
    # 3. Excel xlsx
    xlsx = generate_xlsx_bytes(req)
    assert len(xlsx) > 0
    
    # 4. Markdown md
    md = generate_markdown_doc(req)
    assert "# Data Dictionary" in md
    assert "The user's full name" in md
