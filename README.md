# 🔍 DataLens Flow: 100% Serverless Database Modeler, Transpiler & Lineage Engine

DataLens Flow is a premium, high-performance web suite designed for developers, data engineers, and data architects. It parses SQL DDL/DML scripts (PostgreSQL, Microsoft SQL Server, MySQL, SQLite, Oracle, BigQuery, Snowflake), automatically generates interactive, editable Entity-Relationship Diagrams (ERD), translates schemas across multiple dialects in real-time, visualizes end-to-end Data Lineage, builds automatic Data Dictionaries, calculates schema diffs to produce `ALTER` database migrations, and features a complete DAMA-DMBOK Data Governance Knowledge Hub.

The entire application runs **100% client-side in the browser** (no-backend architecture), making it 100% serverless, zero-cost to host, and lightning-fast with zero network latency.

---

## 🚀 Key Features

### 1. ⚡ Schema-Aware SQL Auto-Complete & Intellisense
- **CodeMirror 6 Intellisense**: Auto-suggests symbols as you type in the editor.
- **Dynamic Context Suggestions**:
  - 🏷️ **Tables**: Suggests all tables loaded from active ERD schemas or procedure definitions.
  - 📌 **Columns**: Suggests column names scoped to active tables.
  - ⚡ **SQL Functions**: Suggests cross-dialect keywords (`COALESCE`, `CURRENT_TIMESTAMP`, `GROUP BY`, `CASE WHEN`).

### 2. 🛡️ Real-Time SQL Anti-Pattern & Performance Analyzer
- **Safety & Risk Scanner**: Real-time inspection panel detecting dangerous SQL anti-patterns and performance bottlenecks:
  - 🛑 **Critical Risk**: `DELETE / UPDATE` statements missing a `WHERE` clause (prevents accidental data loss).
  - ⚠️ **Performance Warning**: `SELECT *` in analytical queries (recommends explicit columns to minimize BigQuery/Snowflake scan costs).
  - ⚠️ **Cartesian Product**: Implicit comma joins (`FROM tableA, tableB`) missing join conditions.
  - 💡 **Best Practice**: `ORDER BY` without row limiters (`LIMIT` / `TOP`).

### 3. 📚 Enterprise Data Governance & DAMA-DMBOK Knowledge Hub
- **Header Bar Dropdown**: `📚 Knowledge Base` dropdown menu placed right next to the Mode Selector.
- **Comprehensive DAMA-DMBOK Framework**:
  - 🌐 **Data Ecosystem**: Harmony across Standards, Security, Management & Modern Tech.
  - 👥 **People & Roles**: Chief Data Officer (CDO), Data Owner, Data Steward, Data Custodian.
  - ⚙️ **Process & Framework**: Data Maturity Assessment (5 levels), Data Governance Board, Issue Resolution.
  - 🛠️ **Technology Stack Matrix**: Catalog (Purview/Collibra), Integration (dbt/Talend), Modern Storage (Snowflake/BigQuery), MDM System.
  - 🛡️ **Risk & Quality Control**: Data Lineage Tracking & Automated Quality Checks (<5% null alert rules).
- **Dedicated Enterprise Use Cases**: Real-world business scenarios for all 12 topics (Banking Fraud Protection, Healthcare Prescription Validation, Telecom PDPA Privacy, Logistics Real-Time Fleet Tracking).

### 4. 🔄 Real-Time SQL Transpiler & Type Converter
- **Cross-Dialect Translation**: Translates schemas and queries across 7 database dialects (Oracle, T-SQL, Postgres, MySQL, BigQuery, Snowflake, SQLite).
- **2-Column Side-by-Side Visual Diff**: Toggle `🔍 Show Diff` to view original BEFORE code and transpiled AFTER code side-by-side with color-coded diff highlights (green/red).
- **Preserved Statement Spacing SQL Formatter**: `✨ Format` button auto-prettifies keywords while preserving blank line breaks between statements.
- **Top-Right Panel Copy & Collapsible Rules Log**: `📋 Copy` button located inside target editor header panel, and `Dialect Transformation Rules Applied` log panel is collapsible with animated toggle chevron.

### 5. 🌳 Data Lineage Analysis (ETL Flow Visualizer)
- **Stored Procedure Parsing**: Paste `STORED PROCEDURE`, `CTAS`, `CREATE VIEW`, `MERGE INTO`, or `UPDATE ... FROM` scripts to automatically visualize table/column data flows.
- **Interactive Focus & Opacity Dimming**: Clicking any table node dims unrelated flow connections to 0.2 opacity for clear focus.
- **Diagram Exporters**: Export lineage flows to **Mermaid.js (`flowchart LR`)**, **PlantUML (`.puml`)**, PNG, and SVG.

### 6. 📊 Interactive ERD Canvas
- **Visual Modeler**: Add/remove tables and columns, rename fields, change data types, and draw relationships by connecting handles.
- **Implicit Relationship Heuristics**: Automatically scans and maps candidate relations (e.g. matching `user_id` or `company_id` columns to target primary key tables).
- **Multi-Format ERD Exporters**: Export ERD diagrams to **Mermaid.js (`erDiagram`)**, Draw.io XML, SQL DDL, JSON, Excel (.xlsx), Markdown (.md), and PDF.

### 7. 📚 Data Dictionary & Project Manager
- **Column Count Badges**: Displays `(N columns)` badge on each table header.
- **Thai Glossary & Catalog**: Inline Thai description editing for data dictionary items.
- **Multi-Project Manager**: Local project dropdown switching with JSON export/import capability.

---

## 🛠️ Tech Stack

### Frontend & Core Engine
- **Framework**: React 18 (TypeScript), Vite
- **Diagram Canvas**: `@xyflow/react` (React Flow)
- **Automatic Layouts**: `@dagrejs/dagre`
- **State Management**: Zustand
- **Code Editor**: CodeMirror 6 (with SQL Autocomplete, Syntax Highlighting & Line Numbers)
- **Diagram Exporters**: Mermaid.js, PlantUML, Draw.io XML, SheetJS (`xlsx`), jsPDF, html-to-image

---

## 📦 Installation & Setup

Since the app has no backend dependencies, you only need to run the frontend client:

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

## 🚀 Build for Production

To bundle the application into a 100% static client-side bundle for deployment (e.g., GitHub Pages, Netlify, Vercel):
```bash
cd frontend
npm run build
```
The compiled output will be placed in the `frontend/dist/` directory, ready to be deployed as static files.
