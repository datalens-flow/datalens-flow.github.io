import React, { useState, useEffect } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';

interface AnnotationModalProps {
  isOpen: boolean;
  targetKey: string | null; // e.g. "stg_customer" or "stg_customer.gender"
  onClose: () => void;
}

const PREDEFINED_TAGS = ['PII', 'Financial', 'Audit', 'Deprecated', 'Staging', 'Dimension', 'Fact'];

export const AnnotationModal: React.FC<AnnotationModalProps> = ({ isOpen, targetKey, onClose }) => {
  const { catalogAnnotations, setCatalogAnnotation } = useSchemaStore();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [customTag, setCustomTag] = useState<string>('');

  useEffect(() => {
    if (targetKey) {
      const existing = catalogAnnotations[targetKey.toLowerCase()];
      if (existing) {
        setSelectedTags(existing.tags || []);
        setDescription(existing.description || '');
      } else {
        setSelectedTags([]);
        setDescription('');
      }
    }
  }, [targetKey, catalogAnnotations]);

  if (!isOpen || !targetKey) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleSave = () => {
    setCatalogAnnotation(targetKey, {
      tags: selectedTags,
      description: description.trim()
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '90%', maxWidth: '520px',
        backgroundColor: 'var(--bg-secondary, #1e293b)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '12px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--color-border, #334155)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'var(--bg-tertiary, #0f172a)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-primary, #f8fafc)' }}>
              Data Catalog & Annotations
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>TARGET ASSET</span>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px' }}>
              {targetKey}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
              Select Data Tags:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {PREDEFINED_TAGS.map(t => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  style={{
                    padding: '4px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: 'bold',
                    border: '1px solid var(--color-border, #334155)', cursor: 'pointer',
                    backgroundColor: selectedTags.includes(t) ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                    color: selectedTags.includes(t) ? '#090b11' : '#94a3b8'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="Add custom tag..."
                value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                style={{
                  flex: 1, padding: '6px 10px', borderRadius: '6px', fontSize: '11px',
                  border: '1px solid var(--color-border, #334155)', backgroundColor: 'var(--bg-primary, #090b11)', color: '#f8fafc'
                }}
              />
              <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px' }} onClick={handleAddCustomTag}>
                + Tag
              </button>
            </div>
          </div>

          {/* Thai Business Description */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
              Business Glossary & Description (คำอธิบายทางธุรกิจ):
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="พิมพ์คำอธิบายรายละเอียด เช่น รหัสประจำตัวลูกค้าสำหรับใช้ในระบบการเงิน..."
              style={{
                width: '100%', height: '80px', padding: '10px', borderRadius: '6px', fontSize: '12px',
                border: '1px solid var(--color-border, #334155)', backgroundColor: 'var(--bg-primary, #090b11)', color: '#f8fafc', resize: 'none'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border, #334155)', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: 'var(--bg-tertiary, #0f172a)' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            Save Annotation
          </button>
        </div>
      </div>
    </div>
  );
};
