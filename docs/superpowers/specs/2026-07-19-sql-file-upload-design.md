# Design Spec: SQL DDL File Upload

Implement a clean file picker mechanism inside the SQL Editor panel allowing database designers to import external `.sql` schema files (e.g. `createtable.sql`) into the web application client-side.

## User Experience Flow
1. Next to the "💡 Sample DDL" button in the sidebar header, a new secondary style button **"📁 Import SQL"** is added.
2. Clicking **"📁 Import SQL"** triggers a native file selector filtering for `.sql` files.
3. Once selected, the file contents are read locally using the browser's `FileReader` API (zero network interaction, fully serverless).
4. The active CodeMirror editor's content is replaced with the SQL script text, and the Zustand state for the SQL content is updated.
5. The user can then inspect or customize the SQL before clicking **"Parse DDL"** to render the interactive ERD.

## Architecture & Modifications

### Components

#### 1. [SqlEditor](file:///Users/chawin/Desktop/project/DataLens/frontend/src/components/SqlEditor/SqlEditor.tsx)
- Declare a hidden `<input type="file" ref={fileInputRef} accept=".sql" style={{ display: 'none' }} onChange={handleFileChange} />` element.
- Define a `fileInputRef` using React `useRef`.
- Define a `handleImportClick` handler that calls `fileInputRef.current?.click()`.
- Define a `handleFileChange` event handler:
  ```typescript
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setSql(content);
        if (viewRef.current) {
          viewRef.current.dispatch({
            changes: { from: 0, to: viewRef.current.state.doc.length, insert: content }
          });
        }
      }
    };
    reader.readAsText(file);
    // Reset file input value so selection of same file fires change event again
    e.target.value = '';
  };
  ```
- Render a `<button>` with text `"📁 Import SQL"` that invokes `handleImportClick`.

---

## Verification Plan
1. Click the "Sample DDL" button to verify it still functions correctly.
2. Prepare a local `test_schema.sql` file containing DDL instructions.
3. Click "Import SQL" and select `test_schema.sql`.
4. Verify that the editor content matches the file contents exactly.
5. Click "Parse DDL" to ensure the parser converts the imported SQL into table cards successfully.
