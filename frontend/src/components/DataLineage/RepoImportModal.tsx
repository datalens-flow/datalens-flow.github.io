import React, { useRef, useState } from 'react';
import { parseRepositoryLineage, RepositoryFileInput } from '../../utils/lineage/repositoryParser';
import { useSchemaStore } from '../../store/useSchemaStore';
import { useToastStore } from '../../store/useToastStore';

interface RepoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RepoImportModal: React.FC<RepoImportModalProps> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [importedFiles, setImportedFiles] = useState<RepositoryFileInput[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { setProcedureSql, setActiveLineageProcedureIndex } = useSchemaStore();

  if (!isOpen) return null;

  const handleFilesRead = (files: RepositoryFileInput[]) => {
    setImportedFiles(prev => {
      const existingNames = new Set(prev.map(p => p.filename));
      const newFiles = files.filter(f => !existingNames.has(f.filename));
      return [...prev, ...newFiles];
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    try {
      const fileInputs: RepositoryFileInput[] = await Promise.all(
        Array.from(files).map(file => new Promise<RepositoryFileInput>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve({
            filename: file.name,
            content: (event.target?.result as string) || ''
          });
          reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
          reader.readAsText(file);
        }))
      );
      handleFilesRead(fileInputs);
    } catch (err: any) {
      useToastStore.getState().addToast({ type: 'error', message: err.message || 'Error reading files' });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleLoadRepository = () => {
    if (importedFiles.length === 0) return;
    setIsProcessing(true);

    try {
      const repoResult = parseRepositoryLineage(importedFiles);

      // Combine extracted SQL scripts into a master procedure SQL
      const combinedSql = repoResult.scripts.map(s => (
        `-- ==========================================\n-- FILE: ${s.filename} (${s.type.toUpperCase()})\n-- ==========================================\n\n${s.sql}`
      )).join('\n\n');

      setProcedureSql(combinedSql);
      setActiveLineageProcedureIndex(0); // Show combined lineage view
      useToastStore.getState().addToast({
        type: 'success',
        message: `Successfully analyzed ${repoResult.scripts.length} scripts with ${repoResult.fileDependencies.length} cross-script dependencies!`
      });
      onClose();
    } catch (err: any) {
      useToastStore.getState().addToast({ type: 'error', message: 'Failed to process repository lineage: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)'
    }}>
      <div style={{
        width: '90%', maxWidth: '750px', maxHeight: '85vh',
        backgroundColor: 'var(--bg-secondary, #1e293b)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '12px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--color-border, #334155)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'var(--bg-tertiary, #0f172a)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📁</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--color-text-primary, #f8fafc)' }}>
                Import Repository / Multi-File SQL Project
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #94a3b8)' }}>
                Supports SQL files, dbt models (ref/source), and Airflow Python DAGs
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted, #94a3b8)', cursor: 'pointer', fontSize: '18px' }}
          >
            ✖
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Hidden File Inputs */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".sql,.py,.txt,.ddl" 
            multiple 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />
          <input 
            type="file" 
            ref={folderInputRef} 
            // @ts-ignore
            webkitdirectory="" 
            directory="" 
            multiple 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button 
              className="btn btn-secondary"
              style={{ padding: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => fileInputRef.current?.click()}
            >
              📄 Select Multiple Files
            </button>
            <button 
              className="btn btn-secondary"
              style={{ padding: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => folderInputRef.current?.click()}
            >
              📁 Select Repository Folder
            </button>
          </div>

          {/* Imported Files List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '12px', color: 'var(--color-text-muted, #94a3b8)' }}>
                Imported Files ({importedFiles.length}):
              </strong>
              {importedFiles.length > 0 && (
                <button 
                  onClick={() => setImportedFiles([])}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
                >
                  Clear All
                </button>
              )}
            </div>

            <div style={{
              maxHeight: '220px', overflowY: 'auto',
              backgroundColor: 'var(--bg-primary, #090b11)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '8px', padding: '8px'
            }}>
              {importedFiles.map((f, idx) => {
                const isPy = f.filename.toLowerCase().endsWith('.py');
                const isDbt = f.content.includes('ref(') || f.content.includes('source(');
                const badge = isPy ? 'Python DAG' : (isDbt ? 'dbt Model' : 'SQL Script');
                const badgeColor = isPy ? '#38bdf8' : (isDbt ? '#f59e0b' : '#34d399');

                return (
                  <div key={idx} style={{
                    padding: '8px 12px', borderBottom: idx === importedFiles.length - 1 ? 'none' : '1px solid var(--color-border, #334155)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '12px', color: '#f8fafc', fontFamily: 'monospace' }}>📄 {f.filename}</span>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)', color: badgeColor }}>
                      {badge}
                    </span>
                  </div>
                );
              })}
              {importedFiles.length === 0 && (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted, #94a3b8)', fontSize: '12px' }}>
                  No files selected yet. Click one of the buttons above to load SQL files or a folder.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--color-border, #334155)',
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
          backgroundColor: 'var(--bg-tertiary, #0f172a)'
        }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            disabled={importedFiles.length === 0 || isProcessing}
            onClick={handleLoadRepository}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isProcessing ? 'Processing Repository...' : '⚡ Generate Repository Lineage'}
          </button>
        </div>
      </div>
    </div>
  );
};
