from pydantic import BaseModel
from typing import List, Optional, Dict

class ParseRequest(BaseModel):
    sql: str
    dialect: str

class ColumnSchema(BaseModel):
    name: str
    type: str
    nullable: bool
    is_pk: bool
    is_fk: bool
    fk_ref_table: Optional[str] = None
    fk_ref_column: Optional[str] = None
    default: Optional[str] = None
    comment: str = ""

class TableSchema(BaseModel):
    id: str
    name: str
    schema_name: Optional[str] = None
    columns: List[ColumnSchema]

class RelationshipSchema(BaseModel):
    id: str
    from_table: str
    from_column: str
    to_table: str
    to_column: str
    type: str  # 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'

class SchemaResponse(BaseModel):
    tables: List[TableSchema]
    relationships: List[RelationshipSchema]
    dialect: str
    warnings: List[str]
    parsed_at: str

class ExportRequest(BaseModel):
    schema_data: SchemaResponse
    descriptions: Dict[str, Dict[str, str]]  # table_id -> column_name -> description

class RenameEvents(BaseModel):
    tables: Dict[str, str] = {}  # oldTableId -> currentTableName
    columns: Dict[str, Dict[str, str]] = {}  # tableId -> oldColName -> currentColName

class MigrationRequest(BaseModel):
    original_schema: SchemaResponse
    current_schema: SchemaResponse
    rename_events: RenameEvents

