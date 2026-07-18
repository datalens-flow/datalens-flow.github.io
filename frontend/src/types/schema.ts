export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  is_pk: boolean;
  is_fk: boolean;
  fk_ref_table?: string | null;
  fk_ref_column?: string | null;
  default?: string | null;
  comment: string;
}

export interface TableSchema {
  id: string;
  name: string;
  schema_name?: string | null;
  columns: ColumnSchema[];
}

export interface RelationshipSchema {
  id: string;
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  type: string;
}

export interface SchemaResponse {
  tables: TableSchema[];
  relationships: RelationshipSchema[];
  dialect: string;
  warnings: string[];
  parsed_at: string;
}

export interface ExportRequest {
  schema_data: SchemaResponse;
  descriptions: Record<string, Record<string, string>>;
}
