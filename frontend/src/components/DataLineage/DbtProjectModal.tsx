import React, { useState, useMemo } from 'react';
import { generateDbtProject, downloadDbtProjectZip } from '../../utils/dbtProjectGenerator';

interface DbtProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedureSql: string;
}

export const DbtProjectModal: React.FC<DbtProjectModalProps> = ({
  isOpen, onClose, procedureSql
}) => {
  if (!isOpen) return null;

  const project = useMemo(() => {
    return generateDbtProject(procedureSql);
  }, [procedureSql]);

  const [selectedFilePath, setSelectedFilePath] = useState<string>(project.files[0]?.path || 'dbt_project.yml');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const selectedFile = useMemo(() => {
    return project.files.find(f => f.path === selectedFilePath) || project.files[0];
  }, [project, selectedFilePath]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadDbtProjectZip(project.files, `${project.projectName}.zip`);
    } catch (err) {
      console.error('Failed to download dbt zip package', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '900px', maxWidth: '95vw', height: '620px', maxHeight: '90vh',
        background: 'var(--bg-secondary)', border: '1px solid var(--color-border)',
        borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
          background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: 'rgba(249, 115, 22, 0.15)', color: '#f97316',
              padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700
            }}>
              ⚡ dbt Core Wizard
            </span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              1-Click dbt Project Generator & Exporter
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '18px' }}
          >
            ✕
          </button>
        </div>

        {/* Body Layout: Left File Explorer + Right Preview */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left File Tree Sidebar */}
          <div style={{
            width: '260px', borderRight: '1px solid var(--color-border)',
            background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '10px 14px', fontSize: '10px', fontWeight: 700,
              color: 'var(--color-text-secondary)', letterSpacing: '0.08em',
              textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)'
            }}>
              Project Files ({project.files.length})
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {project.files.map(f => {
                const isSelected = f.path === selectedFilePath;
                const isYaml = f.path.endsWith('.yml');
                const isSql = f.path.endsWith('.sql');
                const isMd = f.path.endsWith('.md');

                return (
                  <div
                    key={f.path}
                    onClick={() => setSelectedFilePath(f.path)}
                    style={{
                      padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '12px', fontFamily: 'var(--font-mono)',
                      background: isSelected ? 'var(--accent-glow)' : 'transparent',
                      color: isSelected ? 'var(--color-indigo)' : 'var(--color-text-primary)',
                      border: isSelected ? '1px solid var(--color-indigo)' : '1px solid transparent',
                      marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px',
                      transition: 'var(--transition-all)'
                    }}
                  >
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>
                      {isYaml ? '📄' : isSql ? '⚡' : isMd ? '📘' : '⚙️'}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.path}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Code Preview Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
            <div style={{
              padding: '10px 16px', background: 'var(--bg-tertiary)',
              borderBottom: '1px solid var(--color-border)', fontSize: '12px',
              fontFamily: 'var(--font-mono)', color: 'var(--color-indigo)',
              fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span>{selectedFile?.path}</span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                {selectedFile?.content.split('\n').length} lines
              </span>
            </div>
            <pre style={{
              flex: 1, margin: 0, padding: '16px', overflow: 'auto',
              fontFamily: 'var(--font-mono)', fontSize: '12px',
              lineHeight: 1.6, color: 'var(--color-text-primary)',
              background: 'var(--bg-primary)'
            }}>
              <code>{selectedFile?.content}</code>
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--color-border)',
          background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Includes <code style={{ color: '#f97316' }}>dbt_project.yml</code>, staging models, marts models, sources.yml & schema.yml
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                fontWeight: 700
              }}
            >
              {isDownloading ? 'Zipping...' : '⚡ Download dbt Project (.zip)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
