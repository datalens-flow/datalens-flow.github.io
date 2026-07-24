import React, { useRef } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';
import { useToastStore } from '../../store/useToastStore';
import { exportSql } from '../../api/client';
import { DIALECTS, SAMPLE_SQL } from './constants';
import { mapType } from './utils';

interface SqlEditorHeaderProps {
  onUpdateEditor: (newSql: string) => void;
  onParse: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const SqlEditorHeader: React.FC<SqlEditorHeaderProps> = ({ 
  onUpdateEditor, 
  onParse,
  isFullscreen,
  onToggleFullscreen
}) => {
  const props = { isFullscreen, onToggleFullscreen };
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    setSql, 
    dialect, 
    setDialect, 
    schema,
    setSchema, 
    setLoading, 
    loading,
    outputDialect,
    setOutputDialect
  } = useSchemaStore();

  const handleLoadSample = () => {
    setSql(SAMPLE_SQL);
    onUpdateEditor(SAMPLE_SQL);
  };

  const handleFormat = async () => {
    const { formatSql } = await import('../../utils/sqlFormatter');
    const { sql: currentSql } = useSchemaStore.getState();
    if (!currentSql.trim()) return;
    const formatted = formatSql(currentSql);
    setSql(formatted);
    onUpdateEditor(formatted);
    useToastStore.getState().addToast({ type: 'success', message: 'SQL formatted successfully!' });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    try {
      const contents = await Promise.all(
        fileList.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string || '');
            reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
            reader.readAsText(file);
          });
        })
      );

      const combinedContent = contents.join('\n\n-- ==========================================\n-- IMPORTED: FILE\n-- ==========================================\n\n');
      
      if (combinedContent) {
        setSql(combinedContent);
        onUpdateEditor(combinedContent);
      }
    } catch (err: any) {
      useToastStore.getState().addToast({ type: 'error', message: err.message || 'Failed to read file' });
    }
    
    e.target.value = '';
  };

  const handleConvertTypes = async () => {
    if (!schema) {
      useToastStore.getState().addToast({ type: 'warning', message: 'Please parse your DDL schema first before converting types.' });
      return;
    }
    setLoading(true);
    try {
      const convertedTables = schema.tables.map((table: any) => ({
        ...table,
        columns: table.columns.map((col: any) => ({
          ...col,
          type: mapType(col.type, outputDialect)
        }))
      }));

      const convertedSchema = { ...schema, tables: convertedTables };
      const blob = await exportSql(convertedSchema, outputDialect);
      const sqlText = await blob.text();
      
      setSql(sqlText);
      setSchema(convertedSchema);
      setDialect(outputDialect);
      onUpdateEditor(sqlText);
      
      useToastStore.getState().addToast({ type: 'success', message: `Successfully converted types to ${outputDialect.toUpperCase()}` });
    } catch (err: any) {
      useToastStore.getState().addToast({ type: 'error', message: err.message || 'Failed to convert data types' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sql-editor-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="sql-editor-title">SQL Script Input</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".sql" 
            multiple
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />
          <button 
            onClick={handleImportClick}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px' }}
          >
            📁 Import SQL
          </button>
          <button 
            onClick={handleFormat}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px' }}
          >
            ✨ Format
          </button>
          <button 
            onClick={handleLoadSample}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px' }}
          >
            💡 Sample DDL
          </button>
          <button 
            onClick={onParse} 
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '4px 10px', fontSize: '11px' }}
          >
            {loading ? 'Parsing...' : 'Parse DDL'}
          </button>
          <button 
            onClick={props.onToggleFullscreen}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
            title={props.isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {props.isFullscreen ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      <div className="sql-editor-controls" style={{ flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Input:</span>
            <select 
              value={dialect} 
              onChange={(e) => setDialect(e.target.value)}
              className="dialect-select"
            >
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Output:</span>
            <select 
              value={outputDialect} 
              onChange={(e) => setOutputDialect(e.target.value)}
              className="dialect-select"
            >
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleConvertTypes}
          disabled={loading}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.08)', border: '1px dashed rgba(99, 102, 241, 0.25)', color: 'var(--color-indigo)' }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3 3-3 3M4 14l-3-3 3-3M2 11h11M14 5H3"/>
          </svg>
          Convert Data Types (ข้าม Dialect)
        </button>
      </div>
    </div>
  );
};
