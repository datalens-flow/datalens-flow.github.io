import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useSchemaStore } from '../../store/useSchemaStore';
import './DataDictionary.css';

interface RowData {
  tableId: string;
  tableName: string;
  columnName: string;
  type: string;
  nullable: string;
  isPk: string;
  isFk: string;
  fkRef: string;
  description: string;
}

export const DataDictionary: React.FC = () => {
  const { schema, descriptions, updateDescription } = useSchemaStore();

  const rowData = useMemo<RowData[]>(() => {
    if (!schema) return [];
    
    const rows: RowData[] = [];
    schema.tables.forEach((table) => {
      const tableDesc = descriptions[table.id] || {};
      table.columns.forEach((col) => {
        rows.push({
          tableId: table.id,
          tableName: table.name,
          columnName: col.name,
          type: col.type,
          nullable: col.nullable ? 'Yes' : 'No',
          isPk: col.is_pk ? '🔑 Yes' : '',
          isFk: col.is_fk ? '🔗 Yes' : '',
          fkRef: col.is_fk && col.fk_ref_table ? `${col.fk_ref_table}.${col.fk_ref_column}` : '',
          description: tableDesc[col.name] || col.comment || '',
        });
      });
    });
    return rows;
  }, [schema, descriptions]);

  const columnDefs = useMemo<ColDef<RowData>[]>(() => [
    { 
      field: 'tableName', 
      headerName: 'Table', 
      filter: true, 
      rowGroup: false, 
      enableRowGroup: true,
      width: 150 
    },
    { 
      field: 'columnName', 
      headerName: 'Column', 
      filter: true, 
      width: 150 
    },
    { 
      field: 'type', 
      headerName: 'Type', 
      width: 120 
    },
    { 
      field: 'nullable', 
      headerName: 'Nullable', 
      width: 100 
    },
    { 
      field: 'isPk', 
      headerName: 'Primary Key', 
      width: 120,
      cellStyle: { color: 'var(--color-amber)' } as any
    },
    { 
      field: 'isFk', 
      headerName: 'Foreign Key', 
      width: 120 
    },
    { 
      field: 'fkRef', 
      headerName: 'FK Reference', 
      width: 180,
      cellStyle: { color: '#a5b4fc', fontFamily: 'var(--font-mono)' } as any
    },
    {
      field: 'description',
      headerName: 'Description (Double click to edit)',
      editable: true,
      flex: 1,
      cellEditor: 'agTextCellEditor',
      cellStyle: { backgroundColor: 'rgba(99, 102, 241, 0.05)', cursor: 'pointer' } as any
    }
  ], []);

  const handleCellValueChanged = (event: CellValueChangedEvent<RowData>) => {
    const { data, newValue } = event;
    if (data) {
      updateDescription(data.tableId, data.columnName, newValue || '');
    }
  };

  return (
    <div className="data-dictionary-container ag-theme-alpine-dark">
      <AgGridReact<RowData>
        rowData={rowData}
        columnDefs={columnDefs}
        onCellValueChanged={handleCellValueChanged}
        domLayout="normal"
        animateRows={true}
        pagination={true}
        paginationPageSize={20}
        defaultColDef={{
          sortable: true,
          resizable: true,
          filter: true,
        }}
      />
    </div>
  );
};
export default DataDictionary;
