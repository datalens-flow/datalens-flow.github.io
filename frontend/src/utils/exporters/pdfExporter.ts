import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { splitProcedures } from '../lineage/procedureSplitter';
import { parseLineage } from '../lineageParser';

export interface PdfExportOptions {
  imageDataUrl?: string;
  procedureSql: string;
  catalogAnnotations: Record<string, { tags: string[]; description: string }>;
  prefix?: string;
}

export const generateLineagePdfReport = (options: PdfExportOptions): Blob => {
  const { imageDataUrl, procedureSql, catalogAnnotations } = options;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Banner
  doc.setFillColor(15, 23, 42); // dark navy #0f172a
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DataLens Flow - Enterprise Data Lineage Documentation', 30, 35);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const nowStr = new Date().toLocaleString();
  doc.text(`Generated: ${nowStr}`, pageWidth - 30, 35, { align: 'right' });

  // Page 1: Diagram Snapshot
  if (imageDataUrl) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Visual Data Lineage Architecture Diagram', 30, 80);

    const imgWidth = pageWidth - 60;
    const imgHeight = pageHeight - 120;
    doc.addImage(imageDataUrl, 'PNG', 30, 95, imgWidth, imgHeight, undefined, 'FAST');
  }

  // Parse Procedures and Flows
  const procs = splitProcedures(procedureSql);
  const matrixRows: string[][] = [];

  procs.forEach(proc => {
    const result = parseLineage(proc.sql);
    result.flows.forEach(f => {
      matrixRows.push([
        proc.name,
        f.queryStep || 'Query #1',
        `${f.sourceTable}.${f.sourceCol === '*' ? 'ALL (*)' : f.sourceCol}`,
        (f.action || 'insert').toUpperCase(),
        `${f.targetTable}.${f.targetCol === '*' ? 'ALL (*)' : f.targetCol}`
      ]);
    });
  });

  // Page 2: Data Mapping Matrix Table
  doc.addPage('a4', 'landscape');
  
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, 'F');
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Data Mapping & Lineage Matrix Table', 30, 28);

  autoTable(doc, {
    startY: 60,
    head: [['Procedure Name', 'Query / Step', 'Source Asset (Table.Column)', 'Action', 'Target Asset (Table.Column)']],
    body: matrixRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [248, 250, 252], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: 30, right: 30 }
  });

  // Page 3: Data Catalog Annotations & Glossary
  const catalogRows: string[][] = [];
  Object.entries(catalogAnnotations).forEach(([assetKey, ann]) => {
    catalogRows.push([
      assetKey,
      ann.tags ? ann.tags.join(', ') : '-',
      ann.description || '-'
    ]);
  });

  if (catalogRows.length > 0) {
    doc.addPage('a4', 'landscape');
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(248, 250, 252);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Data Catalog & Business Glossary Annotations', 30, 28);

    autoTable(doc, {
      startY: 60,
      head: [['Asset Identifier (Table / Column)', 'Data Tags', 'Business Description (คำอธิบายทางธุรกิจ)']],
      body: catalogRows,
      theme: 'grid',
      headStyles: { fillColor: [38, 189, 248], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 30, right: 30 }
    });
  }

  return doc.output('blob');
};
