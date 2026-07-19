# Data Lineage and SQL File Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement SQL DDL file uploading in the SQL editor, and add a "🌿 Data Lineage" tab that parses uploaded stored procedures (`procedure.sql`) to visualize source-to-target data flows using React Flow.

**Architecture:** Use client-side FileReader to read SQL scripts, a regex-based DDL and procedure parser to extract schemas and lineage mappings, and React Flow viewport to render direct data flows.

**Tech Stack:** React, TypeScript, React Flow, CodeMirror 6.

## Global Constraints
- Client-side execution only (zero backend dependencies, fully compatible with Netlify/GitHub Pages).
- Styling must adapt dynamically to light/dark themes using CSS variables.
- Code style must use TypeScript with strict types.

---

### Task 1: SQL File Upload in SQL Editor

**Files:**
- Modify: `frontend/src/components/SqlEditor/SqlEditor.tsx`

**Interfaces:**
- Consumes: `useSchemaStore`
- Produces: Hidden file input and an Import DDL button in the SQL editor header.

- [ ] **Step 1: Write file upload code in SqlEditor.tsx**

Modify `frontend/src/components/SqlEditor/SqlEditor.tsx`:
Add a file ref and file change handler to read SQL content and load it into the editor view.

```diff
@@ -7,2 +7,3 @@
 import { useSchemaStore } from '../../store/useSchemaStore';
+import { useRef } from 'react';
 import { parseSql } from '../../api/client';
@@ -23,2 +24,3 @@
   const viewRef = useRef<EditorView | null>(null);
+  const fileInputRef = useRef<HTMLInputElement>(null);
   const { 
@@ -73,6 +75,22 @@
 
+  const handleImportClick = () => {
+    fileInputRef.current?.click();
+  };
+
+  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
+    const file = e.target.files?.[0];
+    if (!file) return;
+    const reader = new FileReader();
+    reader.onload = (event) => {
+      const content = event.target?.result as string;
+      if (content) {
+        setSql(content);
+        if (viewRef.current) {
+          viewRef.current.dispatch({
+            changes: { from: 0, to: viewRef.current.state.doc.length, insert: content }
+          });
+        }
+      }
+    };
+    reader.readAsText(file);
+    e.target.value = '';
+  };
+
   const handleParse = async () => {
@@ -98,6 +116,14 @@
           <span className="sql-editor-title">SQL Script Input</span>
           <div style={{ display: 'flex', gap: '6px' }}>
+            <input 
+              type="file" 
+              ref={fileInputRef} 
+              accept=".sql" 
+              style={{ display: 'none' }} 
+              onChange={handleFileChange} 
+            />
             <button 
-              onClick={handleLoadSample}
+              onClick={handleImportClick}
               className="btn btn-secondary"
               style={{ padding: '4px 10px', fontSize: '11px' }}
             >
-              💡 Sample DDL
+              📁 Import SQL
+            </button>
+            <button 
+              onClick={handleLoadSample}
+              className="btn btn-secondary"
+              style={{ padding: '4px 10px', fontSize: '11px' }}
+            >
+              💡 Sample
             </button>
```

- [ ] **Step 2: Run build to verify code compiles**

Run: `npm run build` inside `frontend/`
Expected: Success

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/SqlEditor/SqlEditor.tsx
git commit -m "feat: implement local sql file upload in DDL editor"
```

---

### Task 2: Data Lineage Parser Utility

**Files:**
- Create: `frontend/src/utils/lineageParser.ts`

**Interfaces:**
- Consumes: SQL script text string.
- Produces: `LineageResult` detailing source tables, target tables, and column flows.

- [ ] **Step 1: Write lineageParser.ts**

Create `frontend/src/utils/lineageParser.ts`:
```typescript
export interface LineageFlow {
  sourceTable: string;
  sourceCol: string;
  targetTable: string;
  targetCol: string;
}

export interface LineageResult {
  sources: string[];
  targets: string[];
  flows: LineageFlow[];
}

export const parseLineage = (sql: string): LineageResult => {
  const sources: string[] = [];
  const targets: string[] = [];
  const flows: LineageFlow[] = [];

  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

  statements.forEach((stmt) => {
    // Detect Target Table
    const insertMatch = stmt.match(/insert\s+into\s+(\w+)\s*\(([^)]+)\)/i);
    if (!insertMatch) return;

    const targetTable = insertMatch[1].toLowerCase();
    const targetCols = insertMatch[2].split(',').map(c => c.trim().toLowerCase());

    if (!targets.includes(targetTable)) {
      targets.push(targetTable);
    }

    // Detect Source Tables
    const fromMatch = stmt.match(/from\s+(\w+)(?:\s+(\w+))?/i);
    if (!fromMatch) return;
    const sourceTable = fromMatch[1].toLowerCase();

    if (!sources.includes(sourceTable)) {
      sources.push(sourceTable);
    }

    // Capture simple SELECT columns
    const selectMatch = stmt.match(/select\s+(.+?)\s+from/i);
    if (selectMatch) {
      const selectCols = selectMatch[1].split(',').map(c => {
        const parts = c.trim().split(/\s+/);
        const col = parts[parts.length - 1]; // get alias or name
        return col.split('.').pop()?.toLowerCase() || '';
      });

      selectCols.forEach((sourceCol, idx) => {
        const targetCol = targetCols[idx];
        if (targetCol && sourceCol) {
          flows.push({
            sourceTable,
            sourceCol,
            targetTable,
            targetCol
          });
        }
      });
    }
  });

  return { sources, targets, flows };
};
export default parseLineage;
```

- [ ] **Step 2: Run build to verify code compiles**

Run: `npm run build` inside `frontend/`
Expected: Success

- [ ] **Step 3: Commit**

```bash
git add frontend/src/utils/lineageParser.ts
git commit -m "feat: add client-side lineage parser utility"
```

---

### Task 3: Data Lineage Workspace Component

**Files:**
- Create: `frontend/src/components/DataLineage/DataLineage.tsx`
- Create: `frontend/src/components/DataLineage/DataLineage.css`

**Interfaces:**
- Consumes: `parseLineage` utility
- Produces: React Flow visualizer for ETL lineage diagrams.

- [ ] **Step 1: Create DataLineage.tsx**

Create `frontend/src/components/DataLineage/DataLineage.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import { parseLineage } from '../../utils/lineageParser';
import '@xyflow/react/dist/style.css';
import './DataLineage.css';

export const DataLineage: React.FC = () => {
  const [procedureSql, setProcedureSql] = useState<string>(`-- Sample ETL Stored Procedure
INSERT INTO sales_summary (customer_name, revenue)
SELECT u.name, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id;`);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleAnalyze = () => {
    const result = parseLineage(procedureSql);
    const newNodes: any[] = [];
    const newEdges: any[] = [];

    // Layout source nodes on the left
    result.sources.forEach((src, idx) => {
      const relatedFlows = result.flows.filter(f => f.sourceTable === src);
      newNodes.push({
        id: src,
        type: 'default',
        position: { x: 100, y: 100 + idx * 180 },
        data: { 
          label: (
            <div className="lineage-node">
              <div className="lineage-node-header source">Source: {src.toUpperCase()}</div>
              <div className="lineage-node-body">
                {relatedFlows.map((f, i) => (
                  <div key={i} className="lineage-col-flow">{f.sourceCol}</div>
                ))}
              </div>
            </div>
          )
        },
        style: { width: 220, background: 'var(--bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '6px' }
      });
    });

    // Layout target nodes on the right
    result.targets.forEach((tgt, idx) => {
      const relatedFlows = result.flows.filter(f => f.targetTable === tgt);
      newNodes.push({
        id: tgt,
        type: 'default',
        position: { x: 500, y: 100 + idx * 180 },
        data: { 
          label: (
            <div className="lineage-node">
              <div className="lineage-node-header target">Target: {tgt.toUpperCase()}</div>
              <div className="lineage-node-body">
                {relatedFlows.map((f, i) => (
                  <div key={i} className="lineage-col-flow">{f.targetCol}</div>
                ))}
              </div>
            </div>
          )
        },
        style: { width: 220, background: 'var(--bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '6px' }
      });
    });

    // Connect edges
    result.flows.forEach((flow, idx) => {
      newEdges.push({
        id: `e-${flow.sourceTable}-${flow.targetTable}-${idx}`,
        source: flow.sourceTable,
        target: flow.targetTable,
        label: `${flow.sourceCol} ➜ ${flow.targetCol}`,
        style: { stroke: 'var(--color-indigo)', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-indigo)' }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setProcedureSql(text);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    handleAnalyze();
  }, []);

  return (
    <div className="lineage-container">
      <div className="lineage-sidebar">
        <div className="lineage-sidebar-header">
          <span className="lineage-title">Stored Procedure Input</span>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <label className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }}>
              📁 Upload file
              <input type="file" accept=".sql" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-primary" onClick={handleAnalyze} style={{ fontSize: '11px', padding: '6px 12px' }}>
              Run Analysis
            </button>
          </div>
        </div>
        <textarea
          className="lineage-textarea"
          value={procedureSql}
          onChange={(e) => setProcedureSql(e.target.value)}
        />
      </div>
      <div className="lineage-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background color="var(--color-grid)" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};
export default DataLineage;
```

- [ ] **Step 2: Create DataLineage.css**

Create `frontend/src/components/DataLineage/DataLineage.css`:
```css
.lineage-container {
  display: flex;
  width: 100%;
  height: 100%;
  background-color: var(--bg-primary);
}

.lineage-sidebar {
  width: 320px;
  height: 100%;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  background-color: var(--sidebar-bg);
}

.lineage-sidebar-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}

.lineage-title {
  font-weight: 700;
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: block;
}

.lineage-textarea {
  flex-grow: 1;
  border: none;
  background-color: var(--bg-secondary);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 16px;
  resize: none;
  outline: none;
}

.lineage-canvas {
  flex-grow: 1;
  height: 100%;
  position: relative;
}

.lineage-node {
  font-family: var(--font-sans);
}

.lineage-node-header {
  padding: 8px 12px;
  font-weight: 600;
  font-size: 11px;
  border-bottom: 1px solid var(--color-border);
  letter-spacing: 0.03em;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.lineage-node-header.source {
  background-color: rgba(99, 102, 241, 0.08);
  color: var(--color-indigo);
}

.lineage-node-header.target {
  background-color: rgba(16, 185, 129, 0.08);
  color: var(--color-emerald);
}

.lineage-node-body {
  padding: 6px 12px;
}

.lineage-col-flow {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 0;
}
```

- [ ] **Step 3: Run build to verify code compiles**

Run: `npm run build` inside `frontend/`
Expected: Success

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/DataLineage/DataLineage.tsx frontend/src/components/DataLineage/DataLineage.css
git commit -m "feat: implement DataLineage workspace view and canvas layout"
```

---

### Task 4: Integrate Data Lineage tab into Main App

**Files:**
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `DataLineage` component
- Produces: Integrated Data Lineage tab view selection on the main screen.

- [ ] **Step 1: Update App.tsx**

Modify `frontend/src/App.tsx` to add imports and render the third tab "🌿 Data Lineage":

```diff
@@ -3,2 +3,3 @@
 import { DataDictionary } from './components/DataDictionary/DataDictionary';
+import { DataLineage } from './components/DataLineage/DataLineage';
 import { ExportPanel } from './components/ExportPanel/ExportPanel';
@@ -53,6 +54,12 @@
             </button>
+            <button 
+              className={`tab-btn ${activeTab === 'lineage' ? 'active' : ''}`}
+              onClick={() => setActiveTab('lineage')}
+            >
+              🌿 Data Lineage
+            </button>
           </div>
 
           {/* Status Message or Warnings */}
@@ -79,4 +86,6 @@
             {activeTab === 'erd' ? (
               <ERDCanvas />
-            ) : (
+            ) : activeTab === 'dict' ? (
               <DataDictionary />
+            ) : (
+              <DataLineage />
             )}
```

- [ ] **Step 2: Add support for "lineage" in Tab state inside useSchemaStore.ts**

Modify `frontend/src/store/useSchemaStore.ts`:
Extend tab options:
```diff
@@ -20,3 +20,3 @@
 interface SchemaState {
-  activeTab: 'erd' | 'dict';
+  activeTab: 'erd' | 'dict' | 'lineage';
   setActiveTab: (tab: 'erd' | 'dict' | 'lineage') => void;
```
Ensure implementation of `setActiveTab` supports `lineage`.
Wait! Let's view `useSchemaStore.ts` lines 1 to 30 to see the exact definition of `activeTab`.
Let's make sure it is updated correctly.

- [ ] **Step 3: Run build to verify code compiles**

Run: `npm run build` inside `frontend/`
Expected: Success

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx frontend/src/store/useSchemaStore.ts
git commit -m "feat: integrate Data Lineage tab into main application workspace"
```
