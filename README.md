# 🔍 DataLens: Interactive Database Modeler & Migration Engine

DataLens is a premium, high-performance web tool designed for developers and data architects. It parses SQL DDL/DML scripts (PostgreSQL, MySQL, SQLite, Oracle, BigQuery, Snowflake, etc.), automatically generates interactive, editable Entity-Relationship Diagrams (ERD), translates schemas across multiple dialects in real-time, builds automatic Data Dictionaries, and calculates schema diffs to produce `ALTER` database migrations.

Built with a responsive, glassmorphic UI, DataLens supports custom themes (Neon Dark, Cyberpunk, Light Slate) and layout orientations.

---

## 🚀 Key Features

### 1. SQL Parser & DML Inference (Python Backend)
- **DDL parsing**: Resolves `CREATE TABLE`, column properties, primary keys, and `FOREIGN KEY` relationships.
- **DML INSERT inference**: Infers table structures dynamically from `INSERT` datasets if full DDL definitions are missing.
- **Dialect support**: Handles PostgreSQL, MySQL, MS SQL, SQLite, Oracle, BigQuery, and Snowflake dialect grammars.

### 2. Multi-Dialect SQL Transpiler
- Translates schemas across database dialects in real-time. Pick an input dialect (e.g. Postgres) and export/view code generated in another output dialect (e.g. Oracle or MySQL) using AST translation via `sqlglot`.

### 3. Interactive ERD Canvas
- **Visual Modeler**: Add/remove tables and columns, rename fields, change data types, and draw relationships by connecting handles.
- **Bi-directional Sync**: Any modification on the canvas updates the DDL code in the editor in real-time.
- **Search & Auto-Focus**: Type search queries in the toolbar to dim the canvas and automatically center and zoom on matching tables/columns.
- **Implicit Relationship Heuristics**: Automatically scans and maps candidate relations (e.g. matching `user_id` or `company_id` columns to target primary key tables) with animated dashed connections.

### 4. Interactive Constraints & Comments
- Toggle column constraints (Primary Key, Nullable) directly from table cards.
- Add column descriptions/comments inline using comment bubble toggles, syncing annotations back to the DDL.

### 5. Multi-Format Exporters
- **Draw.io integration**: Copy diagram XML directly to your clipboard to paste (Cmd+V/Ctrl+V) cards into your Draw.io canvas.
- **Data Dictionary**: Export structured schemas in **Excel (.xlsx)** or **Markdown (.md)** data dictionary formats.
- **Migration Engine**: Compares the baseline parsed schema with your current canvas to generate clean `ALTER TABLE` DDL migration scripts.

---

## 🛠️ Tech Stack

### Backend
- **Core**: Python 3.12, FastAPI
- **Parser & AST Compiler**: `sqlglot`
- **Exporters**: `openpyxl` (Excel), Custom Markdown and XML generators
- **Testing**: `pytest`

### Frontend
- **Framework**: React 18 (TypeScript), Vite
- **Diagram Canvas**: `@xyflow/react` (React Flow)
- **Automatic Layouts**: `@dagrejs/dagre`
- **State Management**: Zustand
- **Syntax Highlighting Editor**: CodeMirror 6

---

## 📦 Installation & Setup

### 1. Backend Server Setup
1. Navigate to the root project directory:
   ```bash
   cd DataLens
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Run the FastAPI dev server:
   ```bash
   uvicorn backend.main:app --reload
   ```
   *The backend will be hosted on `http://127.0.0.1:8000`.*

### 2. Frontend App Setup
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

## 🧪 Running Tests

Ensure your virtual environment is active, then run pytest from the root folder:
```bash
PYTHONPATH=. venv/bin/pytest backend/tests/ -v
```
All parser suites, DML insert tests, migration generators, and integration flows will verify successfully.
