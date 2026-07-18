# 🔍 DataLens Flow: 100% Serverless Database Modeler & Migration Engine

DataLens Flow is a premium, high-performance web tool designed for developers and data architects. It parses SQL DDL/DML scripts (PostgreSQL, MySQL, SQLite, Oracle, BigQuery, Snowflake, etc.), automatically generates interactive, editable Entity-Relationship Diagrams (ERD), translates schemas across multiple dialects in real-time, builds automatic Data Dictionaries, and calculates schema diffs to produce `ALTER` database migrations.

The entire application runs **100% client-side in the browser** (no-backend architecture), making it 100% serverless, zero-cost to host, and lightning-fast with zero network latency.

---

## 🚀 Key Features

### 1. Local SQL Parser & DML Inference
- **DDL parsing**: Resolves `CREATE TABLE` statements, column definitions, primary keys, and `FOREIGN KEY` relationships entirely in TypeScript.
- **DML INSERT inference**: Infers table structures dynamically from `INSERT` datasets if full DDL definitions are missing.
- **Dialect support**: Handles PostgreSQL, MySQL, MS SQL, SQLite, Oracle, BigQuery, and Snowflake dialect grammars.

### 2. Real-Time SQL Transpiler
- Translates schemas across database dialects. Pick an input dialect and copy/view SQL code generated in another target dialect in real-time.

### 3. Interactive ERD Canvas
- **Visual Modeler**: Add/remove tables and columns, rename fields, change data types, and draw relationships by connecting handles.
- **Bi-directional Sync**: Any modification on the canvas updates the DDL code in the editor in real-time.
- **Search & Auto-Focus**: Type search queries in the header search bar to automatically center and zoom on matching tables/columns.
- **Implicit Relationship Heuristics**: Automatically scans and maps candidate relations (e.g. matching `user_id` or `company_id` columns to target primary key tables) with animated connection lines.

### 4. Interactive Constraints & Comments
- Toggle column constraints (Primary Key, Nullable) directly from table cards.
- Add column descriptions/comments inline using comment bubble toggles, syncing annotations back to the DDL.

### 5. Multi-Format Exporters
- **Diagram Screenshots**: Export high-resolution PNG or SVG images of your diagrams, automatically fitted and cropped to your node bounds with clean margins (no controls/overlays included).
- **Draw.io integration**: Copy diagram XML directly to your clipboard to paste (Cmd+V/Ctrl+V) cards into your Draw.io canvas.
- **Data Dictionary**: Export structured schemas in **Excel (.xlsx)** or **Markdown (.md)** data dictionary formats.
- **Migration Engine**: Compares the baseline parsed schema with your current canvas to generate clean `ALTER TABLE` DDL migration scripts.

---

## 🛠️ Tech Stack

### Frontend & Core Engine
- **Framework**: React 18 (TypeScript), Vite
- **Diagram Canvas**: `@xyflow/react` (React Flow)
- **Automatic Layouts**: `@dagrejs/dagre`
- **State Management**: Zustand
- **Syntax Highlighting Editor**: CodeMirror 6 (with SQL Autocomplete & Intellisense)
- **Client-side Excel Exporter**: SheetJS (`xlsx`)

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

To bundle the application into a 100% static client-side bundle for deployment (e.g., Netlify, GitHub Pages, Vercel):
```bash
cd frontend
npm run build
```
The compiled output will be placed in the `frontend/dist/` directory, ready to be deployed as static files.
