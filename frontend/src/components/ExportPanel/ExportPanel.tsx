import React, { useState } from 'react';
import { toPng, toSvg } from 'html-to-image';
import { useSchemaStore } from '../../store/useSchemaStore';
import { 
  exportDrawio, 
  exportXlsx, 
  exportMarkdown, 
  exportSql,
  exportMigration
} from '../../api/client';
import { useReactFlow, getNodesBounds } from '@xyflow/react';
import './ExportPanel.css';

export const ExportPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { schema, originalSchema, renameEvents, descriptions, theme } = useSchemaStore();
  const { getNodes } = useReactFlow();
  const [prefix, setPrefix] = useState('datalens-flow');

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
    triggerDownload(blob, `${prefix}-schema.json`);
    setIsOpen(false);
  };

  const handleExportPng = async () => {
    const nodes = getNodes();
    if (nodes.length === 0) return;
    setExporting(true);
    try {
      const bounds = getNodesBounds(nodes);
      const padding = 40;
      const width = bounds.width + padding * 2;
      const height = bounds.height + padding * 2;

      const erdElement = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!erdElement) return;

      const bgColor = theme === 'light' ? '#f5f7fb' : '#090b11';

      const dataUrl = await toPng(erdElement, {
        backgroundColor: bgColor,
        width: width,
        height: height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)`,
        }
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${prefix}-erd.png`;
      a.click();
    } catch (err) {
      console.error('Failed to export PNG', err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportSvg = async () => {
    const nodes = getNodes();
    if (nodes.length === 0) return;
    setExporting(true);
    try {
      const bounds = getNodesBounds(nodes);
      const padding = 40;
      const width = bounds.width + padding * 2;
      const height = bounds.height + padding * 2;

      const erdElement = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!erdElement) return;

      const bgColor = theme === 'light' ? '#f5f7fb' : '#090b11';

      const dataUrl = await toSvg(erdElement, {
        backgroundColor: bgColor,
        width: width,
        height: height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)`,
        }
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${prefix}-erd.svg`;
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
      triggerDownload(blob, `${prefix}-erd.drawio.xml`);
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
      triggerDownload(blob, `${prefix}-datadict.xlsx`);
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
      triggerDownload(blob, `${prefix}-datadict.md`);
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
      triggerDownload(blob, `${prefix}-schema.sql`);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportMigration = async () => {
    if (!schema || !originalSchema) {
      alert("No baseline schema. Please load or parse an SQL DDL script first.");
      return;
    }
    setExporting(true);
    try {
      const blob = await exportMigration(originalSchema, schema, renameEvents);
      triggerDownload(blob, `${prefix}-migration.sql`);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const handleCopyDrawio = async () => {
    if (!schema) return;
    setExporting(true);
    try {
      const blob = await exportDrawio(schema);
      const xmlText = await blob.text();
      await navigator.clipboard.writeText(xmlText);
      alert('Draw.io XML copied to clipboard! You can paste it directly inside Draw.io.');
    } catch (err) {
      console.error(err);
      alert('Failed to copy to clipboard.');
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

          <div className="dropdown-section-title">Diagram (ERD)</div>
          <button onClick={handleExportPng} className="dropdown-item">🖼️ Export PNG Image</button>
          <button onClick={handleExportSvg} className="dropdown-item">📐 Export SVG Vector</button>
          <button onClick={handleExportDrawio} className="dropdown-item">🔗 Export Draw.io XML</button>
          <button onClick={handleCopyDrawio} className="dropdown-item">📋 Copy Draw.io XML</button>
          
          <div className="dropdown-divider"></div>
          
          <div className="dropdown-section-title">Data Dictionary</div>
          <button onClick={handleExportXlsx} className="dropdown-item">📊 Export Excel (.xlsx)</button>
          <button onClick={handleExportMarkdown} className="dropdown-item">📝 Export Markdown (.md)</button>
          
          <div className="dropdown-divider"></div>
          
          <div className="dropdown-section-title">Structure</div>
          <button onClick={handleExportSql} className="dropdown-item">💻 Export SQL DDL</button>
          <button onClick={handleExportMigration} className="dropdown-item">📝 Export Migration ALTER SQL</button>
          <button onClick={handleExportJson} className="dropdown-item">📦 Export Raw JSON</button>
        </div>
      )}
    </div>
  );
};
export default ExportPanel;
