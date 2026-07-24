import { useState, useRef, useEffect } from 'react';
import { toPng, toSvg } from 'html-to-image';
import { useSchemaStore } from '../../store/useSchemaStore';
import { 
  exportDrawio, 
  exportXlsx, 
  exportMarkdown, 
  exportSql,
  exportMigration
} from '../../api/client';
import { generateHtmlReport } from '../../utils/exporters';
import { generateLineageReportHtml } from '../../utils/exporters/lineageHtml';
import { splitProcedures } from '../../utils/lineage/procedureSplitter';
import { useReactFlow, getNodesBounds } from '@xyflow/react';
import { generateLineagePdfReport } from '../../utils/exporters/pdfExporter';
import { useToastStore } from '../../store/useToastStore';

export const useExportPanel = (mode: 'diagram' | 'lineage') => {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { schema, originalSchema, renameEvents, descriptions, theme, tableColors, procedureSql, activeLineageProcedureIndex } = useSchemaStore();
  const { getNodes } = useReactFlow();
  const [prefix, setPrefix] = useState('datalens-flow');
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getActiveProcedureName = () => {
    if (mode === 'diagram') return 'erd';
    if (activeLineageProcedureIndex === 0) return 'lineage-combined';
    const parsed = splitProcedures(procedureSql || '');
    const idx = activeLineageProcedureIndex - 1;
    if (parsed[idx]) return `lineage-${parsed[idx].name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    return 'lineage';
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
        style: { width: `${width}px`, height: `${height}px`, transform: `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)` }
      });
      const blob = await (await fetch(dataUrl)).blob();
      triggerDownload(blob, `${prefix}-${getActiveProcedureName()}.png`);
    } catch (err) { console.error(err); } 
    finally { setExporting(false); setIsOpen(false); }
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
        style: { width: `${width}px`, height: `${height}px`, transform: `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)` }
      });
      const blob = await (await fetch(dataUrl)).blob();
      triggerDownload(blob, `${prefix}-${getActiveProcedureName()}.svg`);
    } catch (err) { console.error(err); } 
    finally { setExporting(false); setIsOpen(false); }
  };

  const handleExportDrawio = async () => {
    if (!schema) return;
    setExporting(true);
    try {
      const blob = await exportDrawio(schema);
      triggerDownload(blob, `${prefix}-erd.drawio.xml`);
    } catch (err) { console.error(err); } 
    finally { setExporting(false); setIsOpen(false); }
  };

  const handleExportXlsx = async () => {
    if (!schema) return;
    setExporting(true);
    try {
      const blob = await exportXlsx(schema, descriptions);
      triggerDownload(blob, `${prefix}-datadict.xlsx`);
    } catch (err) { console.error(err); } 
    finally { setExporting(false); setIsOpen(false); }
  };

  const handleExportMarkdown = async () => {
    if (!schema) return;
    setExporting(true);
    try {
      const blob = await exportMarkdown(schema, descriptions);
      triggerDownload(blob, `${prefix}-datadict.md`);
    } catch (err) { console.error(err); } 
    finally { setExporting(false); setIsOpen(false); }
  };

  const handleExportPdfReport = async () => {
    if (!procedureSql) return;
    setExporting(true);
    try {
      let imageDataUrl: string | undefined;
      const nodes = getNodes();
      if (nodes.length > 0) {
        const bounds = getNodesBounds(nodes);
        const padding = 40;
        const width = bounds.width + padding * 2;
        const height = bounds.height + padding * 2;
        const erdElement = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (erdElement) {
          const bgColor = theme === 'light' ? '#f5f7fb' : '#090b11';
          imageDataUrl = await toPng(erdElement, {
            backgroundColor: bgColor,
            width: width,
            height: height,
            style: { width: `${width}px`, height: `${height}px`, transform: `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)` }
          });
        }
      }

      const { catalogAnnotations } = useSchemaStore.getState();
      const pdfBlob = await generateLineagePdfReport({
        imageDataUrl,
        procedureSql,
        catalogAnnotations,
        prefix
      });

      triggerDownload(pdfBlob, `${prefix}-${getActiveProcedureName()}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportHtmlReport = () => {
    if (mode === 'diagram') {
      if (!schema) return;
      const htmlContent = generateHtmlReport(schema, descriptions, tableColors);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      triggerDownload(blob, `${prefix}-report.html`);
    } else {
      if (!procedureSql) return;
      const htmlContent = generateLineageReportHtml(procedureSql);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      triggerDownload(blob, `${prefix}-lineage-report.html`);
    }
    setIsOpen(false);
  };

  const handleExportSql = async () => {
    if (!schema) return;
    setExporting(true);
    try {
      const blob = await exportSql(schema);
      triggerDownload(blob, `${prefix}-schema.sql`);
    } catch (err) { console.error(err); } 
    finally { setExporting(false); setIsOpen(false); }
  };

  const handleExportMigration = async () => {
    if (!schema || !originalSchema) {
      useToastStore.getState().addToast({ type: 'warning', message: 'No baseline schema. Parse an SQL DDL script first.' });
      return;
    }
    setExporting(true);
    try {
      const blob = await exportMigration(originalSchema, schema, renameEvents);
      triggerDownload(blob, `${prefix}-migration.sql`);
    } catch (err) { console.error(err); } 
    finally { setExporting(false); setIsOpen(false); }
  };

  const handleCopyDrawio = async () => {
    if (!schema) return;
    setExporting(true);
    try {
      const blob = await exportDrawio(schema);
      const xmlText = await blob.text();
      await navigator.clipboard.writeText(xmlText);
      useToastStore.getState().addToast({ type: 'success', message: 'Draw.io XML copied to clipboard!' });
    } catch (err) {
      console.error(err);
      useToastStore.getState().addToast({ type: 'error', message: 'Failed to copy to clipboard' });
    } finally { setExporting(false); setIsOpen(false); }
  };
  const handleExportMermaid = async () => {
    setExporting(true);
    try {
      const { generateErdMermaid, generateLineageMermaid } = await import('../../utils/exporters/mermaidExporter');
      let content = '';
      let ext = 'md';
      if (mode === 'diagram') {
        if (!schema) return;
        content = generateErdMermaid(schema);
      } else {
        if (!procedureSql) return;
        content = generateLineageMermaid(procedureSql);
      }
      const blob = new Blob([content], { type: 'text/markdown' });
      triggerDownload(blob, `${prefix}-${getActiveProcedureName()}-mermaid.${ext}`);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportPlantUml = async () => {
    if (!procedureSql) return;
    setExporting(true);
    try {
      const { generateLineagePlantUml } = await import('../../utils/exporters/mermaidExporter');
      const content = generateLineagePlantUml(procedureSql);
      const blob = new Blob([content], { type: 'text/plain' });
      triggerDownload(blob, `${prefix}-${getActiveProcedureName()}.puml`);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  return {
    isOpen, exporting, prefix, setPrefix, panelRef, toggleDropdown, schema,
    handleExportJson, handleExportPng, handleExportSvg, handleExportDrawio, handleExportXlsx,
    handleExportMarkdown, handleExportHtmlReport, handleExportPdfReport, handleExportSql, handleExportMigration, handleCopyDrawio,
    handleExportMermaid, handleExportPlantUml
  };
};
