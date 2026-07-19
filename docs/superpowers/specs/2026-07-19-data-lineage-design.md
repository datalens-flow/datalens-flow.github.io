# Design Spec: Data Lineage Analyzer

Introduce a dedicated "Data Lineage" analyzer tab to trace how data flows from source database tables into target tables by parsing SQL Stored Procedures or ETL query scripts (`procedure.sql`).

## User Experience Flow
1. A third tab **"🌿 Data Lineage"** is added next to "📖 Data Dictionary" in the visualizer panel.
2. Selecting **"🌿 Data Lineage"** reveals a clean workspace split into two views:
   - **Left Panel / Control Header**: A file uploader asking for `procedure.sql`, a text editor/viewer displaying the uploaded procedure SQL code, and a "Run Lineage Analysis" button.
   - **Main Panel**: An interactive canvas utilizing React Flow, displaying:
     - **Source Tables** (positioned on the left).
     - **Target Tables** (positioned on the right).
     - Directed arrows showing the flow of data.
     - Hovering or clicking on a connection highlights the columns mapped from the source query.

---

## Technical Architecture & Parsing Strategy

### 1. Lineage Parser (`lineageParser.ts` [NEW])
Create a new parser [lineageParser.ts](file:///Users/chawin/Desktop/project/DataLens/frontend/src/utils/lineageParser.ts) supporting:
- Scanning the input SQL script for `INSERT INTO [table]`, `UPDATE [table]`, `MERGE INTO [table]` as target tables.
- Finding matching source tables in subqueries, CTEs (`WITH` clauses), `FROM`, and `JOIN` statements.
- Mapping columns using lightweight AST/regex logic, capturing patterns like:
  - `INSERT INTO target (c1, c2) SELECT s1, s2 FROM source` -> maps `source.s1 -> target.c1`, `source.s2 -> target.c2`.
- Outputs a schema structure:
  ```typescript
  interface LineageResult {
    sources: string[];
    targets: string[];
    flows: {
      sourceTable: string;
      sourceCol: string;
      targetTable: string;
      targetCol: string;
    }[];
  }
  ```

### 2. Lineage Component (`DataLineage.tsx` [NEW])
Create [DataLineage.tsx](file:///Users/chawin/Desktop/project/DataLens/frontend/src/components/DataLineage/DataLineage.tsx):
- Hosts local state for the uploaded procedure SQL.
- Integrates CodeMirror for viewing/editing the procedure code.
- Builds React Flow nodes from the `LineageResult`:
  - Lays out source nodes at `x = 100`, targets at `x = 600`, distributed vertically.
  - Draws custom edges between nodes with pathing showing columns mapped.

---

## Verification Plan
1. Prepare a mock `procedure.sql` containing:
   ```sql
   INSERT INTO sales_summary (customer_name, revenue)
   SELECT u.name, o.amount
   FROM users u
   JOIN orders o ON u.id = o.user_id;
   ```
2. Upload this file in the Data Lineage tab.
3. Verify that the React Flow canvas renders:
   - Source nodes: `users`, `orders` (with their corresponding columns).
   - Target node: `sales_summary` (with fields mapped).
   - Connection flows from `users.name` and `orders.amount` into `sales_summary`.
