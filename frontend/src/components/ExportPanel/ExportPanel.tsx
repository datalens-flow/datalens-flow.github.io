import React from 'react';
import './ExportPanel.css';
import { useExportPanel } from './useExportPanel';

interface ExportPanelProps {
  mode?: 'diagram' | 'lineage';
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ mode = 'diagram' }) => {
  const {
    isOpen, exporting, prefix, setPrefix, panelRef, toggleDropdown, schema,
    handleExportJson, handleExportPng, handleExportSvg, handleExportDrawio, handleExportXlsx,
    handleExportMarkdown, handleExportHtmlReport, handleExportPdfReport, handleExportSql, handleExportMigration, handleCopyDrawio
  } = useExportPanel(mode);

  return (
    <div className="export-panel-container" ref={panelRef}>
      <button 
        onClick={toggleDropdown} 
        disabled={exporting || (mode === 'diagram' && !schema)}
        className="btn btn-secondary dropdown-trigger"
      >
        {exporting ? 'Exporting...' : 'Export Options ▼'}
      </button>

      {isOpen && (mode === 'lineage' || schema) && (
        <div className="export-dropdown glass-panel" style={{ width: '220px' }}>
          {/* Filename Prefix configuration */}
          <div style={{ padding: '8px 12px 10px 12px', borderBottom: '1px solid var(--color-border)' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              File Prefix:
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. datalens-flow"
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                outline: 'none',
                fontFamily: 'var(--font-sans)'
              }}
            />
          </div>

          <div className="dropdown-section-title">{mode === 'lineage' ? 'Lineage Canvas' : 'Diagram (ERD)'}</div>
          <button onClick={handleExportPng} className="dropdown-item">Export PNG Image</button>
          <button onClick={handleExportSvg} className="dropdown-item">Export SVG Vector</button>
          
          {mode === 'lineage' && (
            <>
              <div className="dropdown-divider"></div>
              <div className="dropdown-section-title">Reports</div>
              <button onClick={handleExportPdfReport} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Export PDF Documentation (.pdf)
              </button>
              <button onClick={handleExportHtmlReport} className="dropdown-item">Export HTML Summary</button>
            </>
          )}

          {mode === 'diagram' && (
            <>
              <button onClick={handleExportDrawio} className="dropdown-item">Export Draw.io XML</button>
              <button onClick={handleCopyDrawio} className="dropdown-item">Copy Draw.io XML</button>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-section-title">Data Dictionary</div>
              <button onClick={handleExportXlsx} className="dropdown-item">Export Excel (.xlsx)</button>
              <button onClick={handleExportMarkdown} className="dropdown-item">Export Markdown (.md)</button>
              <button onClick={handleExportHtmlReport} className="dropdown-item">Export HTML Report</button>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-section-title">Structure</div>
              <button onClick={handleExportSql} className="dropdown-item">Export SQL DDL</button>
              <button onClick={handleExportMigration} className="dropdown-item">Export Migration ALTER SQL</button>
              <button onClick={handleExportJson} className="dropdown-item">Export Raw JSON</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
export default ExportPanel;
