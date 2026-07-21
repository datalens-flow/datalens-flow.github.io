import React, { useState, useMemo } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';
import { splitProcedures } from '../../utils/lineage/procedureSplitter';
import { parseLineage } from '../../utils/lineageParser';

export const MappingMatrixModal: React.FC = () => {
  const { 
    showMappingMatrixModal, 
    setShowMappingMatrixModal, 
    procedureSql, 
    ignoredLineageTables,
    activeLineageProcedureIndex,
    catalogAnnotations
  } = useSchemaStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterProcedure, setFilterProcedure] = useState<string>('all');
  const [filterQueryStep, setFilterQueryStep] = useState<string>('all');

  const matrixData = useMemo(() => {
    if (!procedureSql) return [];

    const ignoredSet = new Set(ignoredLineageTables.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0));
    const allProcs = splitProcedures(procedureSql);

    let activeProcs = allProcs;
    if (activeLineageProcedureIndex > 0 && allProcs[activeLineageProcedureIndex - 1]) {
      activeProcs = [allProcs[activeLineageProcedureIndex - 1]];
    }

    const rows: {
      sourceTable: string;
      sourceCol: string;
      action: string;
      targetTable: string;
      targetCol: string;
      procedureName: string;
      queryStep: string;
      tags: string;
      description: string;
    }[] = [];

    activeProcs.forEach(proc => {
      const result = parseLineage(proc.sql);
      const flows = result.flows.filter(f => 
        !ignoredSet.has(f.sourceTable.toLowerCase()) && 
        !ignoredSet.has(f.targetTable.toLowerCase())
      );

      flows.forEach(f => {
        const key = `${f.targetTable.toLowerCase()}.${f.targetCol.toLowerCase()}`;
        const ann = catalogAnnotations[key] || catalogAnnotations[f.targetTable.toLowerCase()];

        rows.push({
          sourceTable: f.sourceTable,
          sourceCol: f.sourceCol === '*' ? 'All Columns (*)' : f.sourceCol,
          action: (f.action || 'insert').toUpperCase(),
          targetTable: f.targetTable,
          targetCol: f.targetCol === '*' ? 'All Columns (*)' : f.targetCol,
          procedureName: proc.name,
          queryStep: f.queryStep || 'Query #1',
          tags: ann?.tags ? ann.tags.join(', ') : '',
          description: ann?.description || ''
        });
      });
    });

    return rows;
  }, [procedureSql, ignoredLineageTables, activeLineageProcedureIndex, catalogAnnotations]);

  const uniqueProcedures = useMemo(() => {
    return Array.from(new Set(matrixData.map(r => r.procedureName)));
  }, [matrixData]);

  const uniqueQuerySteps = useMemo(() => {
    return Array.from(new Set(matrixData.map(r => r.queryStep)));
  }, [matrixData]);

  const filteredRows = useMemo(() => {
    return matrixData.filter(row => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        row.sourceTable.toLowerCase().includes(q) ||
        row.sourceCol.toLowerCase().includes(q) ||
        row.targetTable.toLowerCase().includes(q) ||
        row.targetCol.toLowerCase().includes(q) ||
        row.procedureName.toLowerCase().includes(q) ||
        row.queryStep.toLowerCase().includes(q);

      const matchesAction = filterAction === 'all' || row.action.toLowerCase() === filterAction.toLowerCase();
      const matchesProc = filterProcedure === 'all' || row.procedureName === filterProcedure;
      const matchesStep = filterQueryStep === 'all' || row.queryStep === filterQueryStep;

      return matchesSearch && matchesAction && matchesProc && matchesStep;
    });
  }, [matrixData, searchQuery, filterAction, filterProcedure, filterQueryStep]);

  if (!showMappingMatrixModal) return null;

  const handleExportCsv = () => {
    const headers = ['Source Table', 'Source Column', 'Action', 'Target Table', 'Target Column', 'Procedure', 'Query / Step'];
    const csvLines = [headers.join(',')];

    filteredRows.forEach(r => {
      csvLines.push([
        `"${r.sourceTable}"`,
        `"${r.sourceCol}"`,
        `"${r.action}"`,
        `"${r.targetTable}"`,
        `"${r.targetCol}"`,
        `"${r.procedureName}"`,
        `"${r.queryStep}"`
      ].join(','));
    });

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'datalens-mapping-matrix.csv';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const excelData = filteredRows.map(r => ({
      'Source Table': r.sourceTable,
      'Source Column': r.sourceCol,
      'Action': r.action,
      'Target Table': r.targetTable,
      'Target Column': r.targetCol,
      'Procedure': r.procedureName,
      'Query / Step': r.queryStep
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Lineage Mapping');
    XLSX.writeFile(workbook, 'datalens-mapping-matrix.xlsx');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '94%', maxWidth: '1250px', height: '85vh',
        backgroundColor: 'var(--bg-secondary, #1e293b)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '12px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--color-border, #334155)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'var(--bg-tertiary, #0f172a)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📊</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--color-text-primary, #f8fafc)' }}>
                Data Lineage Mapping Matrix
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #94a3b8)' }}>
                Showing {filteredRows.length} of {matrixData.length} data flows
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleExportCsv}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📥 Export CSV
            </button>
            <button 
              onClick={handleExportExcel}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📊 Export Excel (.xlsx)
            </button>
            <button 
              onClick={() => setShowMappingMatrixModal(false)}
              style={{
                background: 'none', border: 'none', color: 'var(--color-text-muted, #94a3b8)',
                cursor: 'pointer', padding: '4px', fontSize: '18px', display: 'flex', alignItems: 'center'
              }}
            >
              ✖
            </button>
          </div>
        </div>

        {/* Search & Action & Procedure & Query Filters Bar */}
        <div style={{
          padding: '12px 24px', borderBottom: '1px solid var(--color-border, #334155)',
          display: 'flex', gap: '10px', backgroundColor: 'var(--bg-primary, #090b11)', flexWrap: 'wrap'
        }}>
          <input 
            type="text"
            placeholder="Search table, column, procedure, or step..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '6px',
              border: '1px solid var(--color-border, #334155)',
              backgroundColor: 'var(--bg-secondary, #1e293b)',
              color: 'var(--color-text-primary, #f8fafc)', fontSize: '12px'
            }}
          />

          {/* Procedure Filter */}
          <select
            value={filterProcedure}
            onChange={e => setFilterProcedure(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '6px',
              border: '1px solid var(--color-border, #334155)',
              backgroundColor: 'var(--bg-secondary, #1e293b)',
              color: 'var(--color-text-primary, #f8fafc)', fontSize: '12px',
              maxWidth: '220px'
            }}
          >
            <option value="all">All Procedures ({uniqueProcedures.length})</option>
            {uniqueProcedures.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Query / Step Filter */}
          <select
            value={filterQueryStep}
            onChange={e => setFilterQueryStep(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '6px',
              border: '1px solid var(--color-border, #334155)',
              backgroundColor: 'var(--bg-secondary, #1e293b)',
              color: 'var(--color-text-primary, #f8fafc)', fontSize: '12px',
              maxWidth: '220px'
            }}
          >
            <option value="all">All Queries / Steps ({uniqueQuerySteps.length})</option>
            {uniqueQuerySteps.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '6px',
              border: '1px solid var(--color-border, #334155)',
              backgroundColor: 'var(--bg-secondary, #1e293b)',
              color: 'var(--color-text-primary, #f8fafc)', fontSize: '12px'
            }}
          >
            <option value="all">All Actions</option>
            <option value="insert">INSERT</option>
            <option value="update">UPDATE</option>
            <option value="merge">MERGE</option>
            <option value="ctas">CTAS</option>
          </select>
        </div>

        {/* Table Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary, #0f172a)', color: 'var(--color-text-muted, #94a3b8)', borderBottom: '1px solid var(--color-border, #334155)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Source Table</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Source Column</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Action</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Target Table</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Target Column</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Procedure</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Query / Step</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
                <tr 
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--color-border, #334155)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                  }}
                >
                  <td style={{ padding: '10px 16px', fontWeight: '600', color: 'var(--color-emerald, #34d399)' }}>{row.sourceTable}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-primary, #f8fafc)', fontFamily: 'var(--font-mono, monospace)' }}>{row.sourceCol}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px',
                      backgroundColor: row.action === 'INSERT' ? 'rgba(56,189,248,0.15)' : 'rgba(245,158,11,0.15)',
                      color: row.action === 'INSERT' ? '#38bdf8' : '#f59e0b'
                    }}>
                      {row.action}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontWeight: '600', color: 'var(--color-indigo, #818cf8)' }}>{row.targetTable}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-primary, #f8fafc)', fontFamily: 'var(--font-mono, monospace)' }}>{row.targetCol}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-muted, #94a3b8)', fontSize: '11px' }}>{row.procedureName}</td>
                  <td style={{ padding: '10px 16px', color: '#38bdf8', fontSize: '11px', fontWeight: '500' }}>{row.queryStep}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted, #94a3b8)' }}>
                    No mapping records match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
