# 🔍 DataLens Flow: 100% Serverless Database Modeler, Transpiler & Lineage Engine

DataLens Flow is a premium, high-performance web suite designed for developers, data engineers, and data architects. It parses SQL DDL/DML scripts (PostgreSQL, Microsoft SQL Server, MySQL, SQLite, Oracle, BigQuery, Snowflake), automatically generates interactive, editable Entity-Relationship Diagrams (ERD), translates schemas across multiple dialects in real-time, visualizes end-to-end Data Lineage, builds automatic Data Dictionaries, calculates schema diffs to produce `ALTER` database migrations, and features an exhaustive, enterprise-grade DAMA-DMBOK Data Governance & Architecture Knowledge Hub.

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
The application integrates a comprehensive, interactive Knowledge Hub right in the top navigation bar (`📚 Knowledge Base`), detailing how the entire "Data Ecosystem" functions in enterprise environments across 5 core groups and 12 specialized topics:

#### 📐 Group 1: Standards & Structure (กลุ่มมาตรฐานและโครงสร้าง)
- **🌐 Data Ecosystem (ระบบนิเวศของข้อมูล)**: Overall architecture harmony connecting people, processes, and tech to transform raw data into business value. Includes real-time banking fraud prevention use cases.
- **🏗️ Data Architecture (สถาปัตยกรรมข้อมูล)**: Blueprint for data flow from operational databases (PostgreSQL) via CDC to cloud data lakes (AWS S3) and warehouses (Snowflake).
- **🎯 Data Quality (คุณภาพข้อมูล 6 มิติ)**: In-depth evaluation across 6 statistical & engineering dimensions:
  1. *Accuracy (ความถูกต้อง)*: Data reflects ground truth without errors.
  2. *Completeness (ความครบถ้วน)*: Mandatory fields are not missing.
  3. *Consistency (ความสม่ำเสมอ)*: Cross-system alignment without contradictions.
  4. *Timeliness (ความทันเวลา)*: Freshness required for real-time analytics.
  5. *Validity (ความสมเหตุสมผล)*: Adherence to format and domain boundaries.
  6. *Uniqueness (ความไม่ซ้ำซ้อน)*: Absence of duplicate records.
- **📖 Data Catalog & Data Dictionary**: Column-level technical definitions vs. enterprise-wide metadata search engines with data lineage mapping.
- **👤 Data Stewardship & Governance**: Policy formulation vs. operational execution by business data stewards.

#### 🛡️ Group 2: Security & Privacy (กลุ่มความปลอดภัยและสิทธิส่วนบุคคล)
- **🔒 Data Security**: Encryption (at rest/in transit), Data Masking (`****-****-****-1234`), and Role-Based Access Control (RBAC). Includes insurance PCI-DSS tokenization use cases.
- **⚖️ Data Privacy (PDPA / GDPR)**: Law compliance, purpose limitation, consent tracking, and automated Right-to-be-Forgotten workflows.

#### ⚙️ Group 3: Management & Integration (กลุ่มการจัดการและการนำไปใช้)
- **👑 Master Data Management (MDM)**: Resolution of conflicting records across legacy systems into a Single Source of Truth (Golden Record / `CUST-001`).
- **🔄 Data Integration & ETL / ELT**: Data extraction, transformation, and loading using Airflow, dbt, Talend, and BigQuery.
- **⏳ Data Lifecycle Management (DLM)**: Storage tiering from High-Performance SSD ➔ Cold Glacier Archiving ➔ Automated 10-Year Regulatory Purge.

#### 🚀 Group 4: Modern Concepts (กลุ่มเทคโนโลยีและแนวคิดยุคใหม่)
- **🏛️ Data Warehouse vs. Data Lake**: Comparative matrix for Structured (BI/Dashboards) vs. Unstructured (AI/ML) data storage.
- **🕸️ Data Mesh vs. Data Fabric**: Comparative matrix for Organizational Decentralization (Domain-driven Data as a Product) vs. Technological AI Smart Metadata Fabric Layer.

#### 🏛️ Group 5: DAMA-DMBOK Practical Framework (กรอบ DAMA-DMBOK ทางปฏิบัติ)
- **👥 People & Roles (4 Core Roles)**:
  - *Chief Data Officer (CDO)*: Executive alignment of data strategy with business goals.
  - *Data Owner*: High-level decision maker approving data access and assuming data risk.
  - *Data Steward*: Operational business expert managing Data Quality and Data Dictionaries.
  - *Data Custodian*: IT / Data Engineer managing server infrastructure, backups, and security rules.
- **⚙️ Process & Framework**: Data Maturity Assessment (5 maturity stages), Data Governance Board (Cross-functional policy committee), and Single Source of Truth Issue Resolution.
- **🛠️ Technology Stack Matrix**:
  - *Governance & Catalog*: Collibra, Microsoft Purview, Alation.
  - *Integration & ETL*: dbt, Talend, Informatica, Airflow.
  - *Modern Storage*: Snowflake, Google BigQuery, Amazon Redshift.
  - *MDM Systems*: Reltio, Informatica MDM, IBM MDM.
- **🛡️ Risk & Quality Control**: Data Lineage Tracking for root-cause analysis & Automated Quality Checks with alert thresholds (<5% null policy).

---

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
