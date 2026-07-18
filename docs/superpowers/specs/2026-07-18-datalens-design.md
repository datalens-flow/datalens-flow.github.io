# DataLens: SQL-to-ERD Web Tool — Design Spec

**Date:** 2026-07-18  
**Status:** Approved  

---

## Overview

DataLens is a local-first, single-user web tool that converts SQL DDL/DML scripts (supporting 20+ dialects including MySQL, PostgreSQL, MS SQL Server, Oracle, Snowflake, BigQuery) into an interactive Entity-Relationship Diagram (ERD) using Crow's Foot Notation, and automatically generates an editable Data Dictionary. All processing runs locally — no cloud, no auth, no data leaves the machine.

---

## Goals

1. Parse SQL DDL/DML scripts and extract tables, columns, data types, PKs, and FKs
2. Render an interactive ERD (Crow's Foot Notation) with drag-and-drop layout
3. Generate a Data Dictionary grid with editable column descriptions
4. Export to: PNG/SVG, Draw.io XML, Excel (.xlsx), Markdown (.md), JSON, SQL DDL

---

## Constraints

- **Single-user, local-only**: No auth, no database, no persistence (except Export files)
- **Free/Open-source only**: All libraries must be MIT or Apache 2.0 licensed
- **Tech stack**: React (Vite + TypeScript) for Frontend, FastAPI (Python 3.12) for Backend
- **SQL dialects**: Must support MySQL, PostgreSQL, MSSQL, Oracle, Snowflake, BigQuery, SQLite, Hive, SparkSQL, Trino/Presto via sqlglot
- **ERD notation**: Crow's Foot (1:1, 1:N, M:N)
- **Layout**: Auto-layout (dagre) on parse; user can drag-and-drop nodes freely after

---

## Architecture

### System Overview

```
Browser (React + Vite + TypeScript)
  ├── SQL Editor Panel (CodeMirror 6)
  ├── ERD Canvas Tab (React Flow + dagre)
  ├── Data Dictionary Tab (AG Grid Community)
  └── Export Panel (PNG/SVG/XML/XLSX/MD/JSON/SQL)
          │ REST API (HTTP, localhost)
FastAPI Backend (Python 3.12, uvicorn)
  ├── POST /api/parse
  ├── POST /api/export/drawio
  ├── POST /api/export/xlsx
  ├── POST /api/export/md
  └── POST /api/export/sql
```

### Key Libraries

| Layer | Library | License | Purpose |
|-------|---------|---------|---------|
| Backend Parser | sqlglot | MIT | SQL parsing, 20+ dialects |
| Backend Export (Excel) | openpyxl | MIT | .xlsx generation |
| Frontend Canvas | @xyflow/react (React Flow v12) | MIT | ERD interactive canvas |
| Frontend Layout | @dagrejs/dagre | MIT | Auto-layout algorithm |
| Frontend Editor | @codemirror/lang-sql | MIT | SQL syntax highlighting |
| Frontend Grid | ag-grid-community | MIT | Data Dictionary editable table |
| Frontend Export PNG | html-to-image | MIT | Canvas to PNG/SVG |
| Frontend State | zustand | MIT | Global state management |
| Frontend Bundler | Vite 6 + TypeScript | MIT | Build tool |

---

## Data Model (JSON Schema)

The canonical schema passed between Backend and Frontend:

```json
{
  "tables": [
    {
      "id": "string",
      "name": "string",
      "schema": "string | null",
      "columns": [
        {
          "name": "string",
          "type": "string",
          "nullable": "boolean",
          "is_pk": "boolean",
          "is_fk": "boolean",
          "fk_ref_table": "string | null",
          "fk_ref_column": "string | null",
          "default": "string | null",
          "comment": "string"
        }
      ]
    }
  ],
  "relationships": [
    {
      "id": "string",
      "from_table": "string",
      "from_column": "string",
      "to_table": "string",
      "to_column": "string",
      "type": "one-to-one | one-to-many | many-to-one | many-to-many"
    }
  ],
  "dialect": "string",
  "warnings": ["string"],
  "parsed_at": "ISO 8601"
}
```

---

## UI Layout

```
+------------------------------------------------------------------+
| DataLens              [Dialect v]  [Parse SQL]  [Export v]       |
+----------+-------------------------------------------------------+
|  SQL     |  [ERD Diagram]  [Data Dictionary]                     |
|  Input   | +---------------------------------------------+       |
|  (Code   | | ERD Canvas (React Flow)                     |       |
|  Mirror) | |  - Crow's Foot nodes (drag, zoom, pan)      |       |
|          | |  - Double-click column name -> inline edit   |       |
|          | |  - FK edges with Crow's Foot markers        |       |
|          | +---------------------------------------------+       |
|          | OR: Data Dictionary Grid (AG Grid)                    |
|          | Table | Column | Type | Nullable | PK | FK | Desc     |
+----------+-------------------------------------------------------+
```

---

## Backend Structure

```
backend/
  main.py
  parser/
    sql_parser.py
    type_normalizer.py
  exporters/
    drawio_generator.py
    xlsx_generator.py
    markdown_generator.py
    sql_generator.py
  models.py
  requirements.txt
  tests/
    test_sql_parser.py
    test_drawio_generator.py
    test_xlsx_generator.py
    test_markdown_generator.py
```

## Frontend Structure

```
frontend/
  src/
    App.tsx
    store/useSchemaStore.ts
    components/
      SqlEditor/SqlEditor.tsx
      ERDCanvas/
        ERDCanvas.tsx
        TableNode.tsx
        CrowsFootEdge.tsx
      DataDictionary/DataDictionary.tsx
      ExportPanel/ExportPanel.tsx
    api/client.ts
    types/schema.ts
    utils/
      layout.ts
      exportHelpers.ts
  vite.config.ts
  package.json
```

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/parse | SQL text + dialect -> JSON schema |
| POST | /api/export/drawio | JSON -> Draw.io XML |
| POST | /api/export/xlsx | JSON + descriptions -> .xlsx |
| POST | /api/export/md | JSON + descriptions -> .md |
| POST | /api/export/sql | JSON -> DDL SQL |
| GET | /api/health | Health check |

---

## Error Handling

- **Parse errors**: HTTP 422 + toast notification in frontend
- **Export errors**: HTTP 500 + error toast
- **Large SQL (200+ tables)**: Loading spinner during parse
- **Unsupported syntax**: warnings[] shown as warning banner

---

## Out of Scope (v1)

- Authentication / user management
- Server-side persistence
- Real-time collaboration
- Auto-relationship inference (only explicit FK constraints)
- Import from live database connection
