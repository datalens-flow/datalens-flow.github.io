from backend.models import MigrationRequest, SchemaResponse, RenameEvents, TableSchema, ColumnSchema, RelationshipSchema
from backend.exporters.migration_generator import generate_migration_script

def test_migration_generation():
    # Baseline original schema
    original = SchemaResponse(
        tables=[
            TableSchema(
                id="users",
                name="users",
                columns=[
                    ColumnSchema(name="id", type="INT", nullable=False, is_pk=True, is_fk=False),
                    ColumnSchema(name="username", type="VARCHAR(50)", nullable=True, is_pk=False, is_fk=False)
                ]
            ),
            TableSchema(
                id="posts",
                name="posts",
                columns=[
                    ColumnSchema(name="id", type="INT", nullable=False, is_pk=True, is_fk=False),
                    ColumnSchema(name="title", type="TEXT", nullable=True, is_pk=False, is_fk=False)
                ]
            )
        ],
        relationships=[],
        dialect="postgres",
        warnings=[],
        parsed_at="2026-07-18T12:00:00Z"
    )

    # Current edited schema:
    # 1. Rename table 'users' -> 'customers'
    # 2. Add column 'email' to 'customers' (renamed from users)
    # 3. Rename column 'title' -> 'heading' in table 'posts'
    # 4. Modify type of 'heading' (was title) to VARCHAR(255)
    # 5. Drop table 'posts' is not dropped, but keep it.
    current = SchemaResponse(
        tables=[
            TableSchema(
                id="customers",
                name="customers",
                columns=[
                    ColumnSchema(name="id", type="INT", nullable=False, is_pk=True, is_fk=False),
                    ColumnSchema(name="username", type="VARCHAR(50)", nullable=True, is_pk=False, is_fk=False),
                    ColumnSchema(name="email", type="VARCHAR(100)", nullable=True, is_pk=False, is_fk=False)
                ]
            ),
            TableSchema(
                id="posts",
                name="posts",
                columns=[
                    ColumnSchema(name="id", type="INT", nullable=False, is_pk=True, is_fk=False),
                    ColumnSchema(name="heading", type="VARCHAR(255)", nullable=True, is_pk=False, is_fk=False)
                ]
            )
        ],
        relationships=[],
        dialect="postgres",
        warnings=[],
        parsed_at="2026-07-18T12:05:00Z"
    )

    rename_events = RenameEvents(
        tables={"users": "customers"},
        columns={
            "users": {},
            "posts": {"title": "heading"}
        }
    )

    req = MigrationRequest(
        original_schema=original,
        current_schema=current,
        rename_events=rename_events
    )

    script = generate_migration_script(req)
    
    assert "ALTER TABLE users RENAME TO customers;" in script
    assert "ALTER TABLE posts RENAME COLUMN title TO heading;" in script
    assert "ALTER TABLE customers ADD COLUMN email VARCHAR(100);" in script
    assert "ALTER TABLE posts ALTER COLUMN heading TYPE VARCHAR(255);" in script
