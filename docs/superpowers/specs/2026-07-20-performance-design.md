# DataLens Performance Improvement Design

## Overview
Based on your feedback, the application feels slow across three main areas:
1. Parsing long SQL scripts.
2. Loading and calculating the Data Lineage graph (especially during mode switching).
3. Zooming, panning, and interacting with the React Flow canvas.

## Approach & Recommendations

I recommend a 3-step performance overhaul combining **Web Workers (for heavy computation)** and **React Memoization (for smooth UI)**.

### 1. Web Worker for SQL Parsing & Dagre Layout (Solves #1 & #2)
**Problem:** Currently, `parseLineage` (Regex matching) and `buildLineageGraph` (Dagre layout) run on the Main Thread. When processing thousands of lines of SQL, this blocks the browser, causing the UI to freeze.
**Solution:** 
- Offload the parsing and layout calculation to a separate Web Worker.
- We will show a loading spinner while the worker calculates the graph in the background, keeping the UI fully responsive.
- This will drastically improve the perceived speed when switching from Detailed to Overview modes.

### 2. React Component Memoization (Solves #3)
**Problem:** `LineageNode.tsx` re-renders frequently when panning or zooming if React Flow's state updates trigger it, especially with many columns displayed.
**Solution:**
- Wrap `LineageNode` in `React.memo` and ensure props like `onToggleCollapse` are properly memoized (`useCallback` is already there, but we need deep comparison for node `data`).
- By stopping unnecessary re-renders of nodes and columns, zooming and panning will become significantly smoother (60 FPS).

### 3. Smart Default Collapsing (Solves #2 & #3)
**Problem:** When a huge script is pasted, rendering hundreds of nodes with all their columns expanded can choke the DOM.
**Solution:** 
- If the calculated nodes exceed a certain threshold (e.g., > 30 nodes), we automatically default them to "Collapsed" or switch to "Overview" mode first.
- This limits the initial DOM elements, allowing the graph to load instantly. The user can expand them as needed.
