import React, { useState } from 'react';
import { toPng, toSvg } from 'html-to-image';
import { useSchemaStore } from '../../store/useSchemaStore';
import { 
  exportDrawio, 
  exportXlsx, 
  exportMarkdown, 
  exportSql 
} from '../../api/client';
import './ExportPanel.css';

export const ExportPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { schema, descriptions } = useSchemaStore();

  const toggleDropdown = () => setIsOpen(!isOpen);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const handleExportJson = () => {
    if (!schema) return;
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    triggerDownload(blob, 'datalens-schema.json');
    setIsOpen(false);
  };

  const handleExportPng = async () => {
    const erdElement = document.querySelector('.react-flow') as HTMLElement;
    if (!erdElement) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(erdElement, {
        backgroundColor: '#0b0f19',
        style: {
          transform: 'scale(1)',
        }
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'datalens-erd.png';
      a.click();
    } catch (err) {
      console.error('Failed to export PNG', err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportSvg = async () => {
    const erdElement = document.querySelector('.react-flow') as HTMLElement;
    if (!erdElement) return;
    setExporting(true);
    try {
      const dataUrl = await toSvg(erdElement, {
        backgroundColor: '#0b0f19'
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'datalens-erd.svg';
      a.click();
    } catch (err) {
      console.error('Failed to export SVG', err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportDrawio = async () => {
    if (!schema) return;
    setExporting(true);
    try {
      const blob = await exportDrawio(schema);
      triggerDownload(blob, 'datalens-erd.drawio.xml');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportXlsx = async () => {
    if (!schema) return;
    setExporting(true);
    try {
      const blob = await exportXlsx(schema, descriptions);
      triggerDownload(blob, 'datalens-datadict.xlsx');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!schema) return;
    setExporting(true);
    try {
      const blob = await exportMarkdown(schema, descriptions);
      triggerDownload(blob, 'datalens-datadict.md');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportSql = async () => {
    if (!schema) return;
    setExporting(true);
    try {
      const blob = await exportSql(schema);
      triggerDownload(blob, 'datalens-schema.sql');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="export-panel-container">
      <button 
        onClick={toggleDropdown} 
        disabled={!schema || exporting}
        className="btn btn-secondary dropdown-trigger"
      >
        {exporting ? 'Exporting...' : '💾 Export Options ▼'}
      </button>

      {isOpen && schema && (
        <div className="export-dropdown glass-panel">
          <div className="dropdown-section-title">Diagram (ERD)</div>
          <button onClick={handleExportPng} className="dropdown-item">🖼️ Export PNG Image</button>
          <button onClick={handleExportSvg} className="dropdown-item">📐 Export SVG Vector</button>
          <button onClick={handleExportDrawio} className="dropdown-item">🔗 Export Draw.io XML</button>
          
          <div className="dropdown-divider"></div>
          
          <div className="dropdown-section-title">Data Dictionary</div>
          <button onClick={handleExportXlsx} className="dropdown-item">📊 Export Excel (.xlsx)</button>
          <button onClick={handleExportMarkdown} className="dropdown-item">📝 Export Markdown (.md)</button>
          
          <div className="dropdown-divider"></div>
          
          <div className="dropdown-section-title">Structure</div>
          <button onClick={handleExportSql} className="dropdown-item">💻 Export SQL DDL</button>
          <button onClick={handleExportJson} className="dropdown-item">📦 Export Raw JSON</button>
        </div>
      )}
    </div>
  );
};
export default ExportPanel;
