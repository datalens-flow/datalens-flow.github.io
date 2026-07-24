import React, { useState, useMemo } from 'react';
import { KNOWLEDGE_GROUPS, KNOWLEDGE_TOPICS, KnowledgeTopic } from '../KnowledgeDropdown/knowledgeData';
import { RenderKnowledgeIcon } from '../KnowledgeDropdown/KnowledgeIcons';
import './KnowledgeView.css';

export const KnowledgeView: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(KNOWLEDGE_TOPICS[0].id);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const getImageUrl = (url?: string | null) => {
    if (!url) return '';
    const baseUrl = (import.meta as any).env?.BASE_URL || '/';
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${baseUrl}${cleanUrl}`;
  };

  const filteredTopics = useMemo(() => {
    return KNOWLEDGE_TOPICS.filter(t => {
      const matchesGroup = selectedGroupFilter === 'all' || t.groupId === selectedGroupFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        t.title.toLowerCase().includes(q) || 
        t.tag.toLowerCase().includes(q) || 
        t.deepDive.toLowerCase().includes(q) ||
        t.useCase.toLowerCase().includes(q);

      return matchesGroup && matchesSearch;
    });
  }, [selectedGroupFilter, searchQuery]);

  const currentTopic: KnowledgeTopic = useMemo(() => {
    return KNOWLEDGE_TOPICS.find(t => t.id === selectedTopicId) || filteredTopics[0] || KNOWLEDGE_TOPICS[0];
  }, [selectedTopicId, filteredTopics]);

  return (
    <div className="knowledge-view-container">
      {/* Header & Search Engine */}
      <div className="knowledge-view-header">
        <div className="knowledge-view-title-group">
          <RenderKnowledgeIcon iconKey="data-catalog" size={22} color="#38bdf8" />
          <h2>Enterprise Data Ecosystem & Governance Knowledge Hub</h2>
        </div>

        {/* Global Knowledge Search Bar */}
        <div className="knowledge-search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            className="knowledge-search-input"
            placeholder="ค้นหาตามบทเรียน, คำสำคัญ (เช่น Kafka, CDC, DAMA, PCI DSS, RAG)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="knowledge-view-body">
        {/* Left Sidebar: Categories & Topic List */}
        <div className="knowledge-view-sidebar">
          <div className="group-filter-list">
            <button
              className={`group-btn ${selectedGroupFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedGroupFilter('all')}
            >
              ทั้งหมด ({KNOWLEDGE_TOPICS.length})
            </button>
            {KNOWLEDGE_GROUPS.map(g => (
              <button
                key={g.id}
                className={`group-btn ${selectedGroupFilter === g.id ? 'active' : ''}`}
                onClick={() => setSelectedGroupFilter(g.id)}
              >
                {g.title.split('(')[0]}
              </button>
            ))}
          </div>

          <div className="topic-scroll-list">
            {filteredTopics.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                ไม่พบหัวข้อที่ค้นหา "{searchQuery}"
              </div>
            ) : (
              filteredTopics.map(t => (
                <div
                  key={t.id}
                  className={`topic-item-card ${currentTopic.id === t.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTopicId(t.id)}
                >
                  <span style={{ marginTop: '2px' }}>
                    <RenderKnowledgeIcon iconKey={t.iconKey} size={18} color="var(--color-indigo)" />
                  </span>
                  <div className="topic-item-info">
                    <span className="topic-item-title">{t.title}</span>
                    <span className="topic-item-tag">{t.tag}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Main Reading Canvas */}
        <div className="knowledge-view-content">
          <div className="content-header-banner">
            <span className="content-group-title">{currentTopic.groupTitle}</span>
            <h1 className="content-main-title">
              <RenderKnowledgeIcon iconKey={currentTopic.iconKey} size={26} color="#38bdf8" />
              <span>{currentTopic.title}</span>
            </h1>
          </div>

          {/* Main Uncropped Architecture Diagram Banner */}
          {currentTopic.imageUrl && (
            <div 
              className="diagram-banner-box"
              onClick={() => setPreviewImage(currentTopic.imageUrl || null)}
              style={{ cursor: 'zoom-in', position: 'relative' }}
            >
              <img src={getImageUrl(currentTopic.imageUrl)} alt={currentTopic.title} />
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(4px)',
                color: '#38bdf8',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                🔍 คลิกเพื่อดูขยายเต็มจอ
              </div>
            </div>
          )}

          {/* Deep Dive Concept Section */}
          <div className="knowledge-section-box">
            <h3 className="section-heading" style={{ color: '#facc15' }}>
              <RenderKnowledgeIcon iconKey="lightbulb" size={18} color="#facc15" />
              <span>การเจาะลึก (Deep Dive Concept)</span>
            </h3>
            <p className="section-body-text">{currentTopic.deepDive}</p>
            {currentTopic.deepDiveImageUrl && (
              <div 
                onClick={() => setPreviewImage(currentTopic.deepDiveImageUrl || null)}
                style={{ borderRadius: '8px', border: '1px solid var(--color-border)', overflow: 'hidden', cursor: 'zoom-in', marginTop: '10px' }}
              >
                <img src={getImageUrl(currentTopic.deepDiveImageUrl)} alt="Deep Dive Diagram" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            )}
          </div>

          {/* Real-World Scenario Section */}
          <div className="knowledge-section-box example-box-theme">
            <h3 className="section-heading" style={{ color: '#10b981' }}>
              <RenderKnowledgeIcon iconKey="pin" size={18} color="#10b981" />
              <span>ตัวอย่างการทำงานจริงในองค์กร (Enterprise Scenario)</span>
            </h3>
            <p className="section-body-text">{currentTopic.example}</p>
            {currentTopic.exampleImageUrl && (
              <div 
                onClick={() => setPreviewImage(currentTopic.exampleImageUrl || null)}
                style={{ borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', overflow: 'hidden', cursor: 'zoom-in', marginTop: '10px' }}
              >
                <img src={getImageUrl(currentTopic.exampleImageUrl)} alt="Scenario Diagram" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            )}
          </div>

          {/* Enterprise Use Case Section */}
          {currentTopic.useCase && (
            <div className="knowledge-section-box usecase-box-theme">
              <h3 className="section-heading" style={{ color: '#38bdf8' }}>
                <RenderKnowledgeIcon iconKey="rocket" size={18} color="#38bdf8" />
                <span>กรณีการใช้งานในธุรกิจ (Enterprise Use Case)</span>
              </h3>
              <p className="section-body-text">{currentTopic.useCase}</p>
              {currentTopic.useCaseImageUrl && (
                <div 
                  onClick={() => setPreviewImage(currentTopic.useCaseImageUrl || null)}
                  style={{ borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)', overflow: 'hidden', cursor: 'zoom-in', marginTop: '10px' }}
                >
                  <img src={getImageUrl(currentTopic.useCaseImageUrl)} alt="Use Case Diagram" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              )}
            </div>
          )}

          {/* Extra Details (6 Quality Dimensions List OR Comparison Table) */}
          {currentTopic.extraDetails && currentTopic.extraDetails.type === 'list' && currentTopic.extraDetails.items && (
            <div className="knowledge-section-box">
              <h3 className="section-heading" style={{ color: '#818cf8' }}>
                <RenderKnowledgeIcon iconKey="data-quality" size={18} color="#818cf8" />
                <span>6 มิติหลักวัดคุณภาพข้อมูล (Data Quality Dimensions)</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '8px' }}>
                {currentTopic.extraDetails.items.map((item, i) => (
                  <div key={i} style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#818cf8', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentTopic.extraDetails && currentTopic.extraDetails.type === 'comparison' && currentTopic.extraDetails.table && (
            <div className="knowledge-section-box">
              <h3 className="section-heading" style={{ color: '#22d3ee' }}>
                <RenderKnowledgeIcon iconKey="mesh-vs-fabric" size={18} color="#22d3ee" />
                <span>ตารางเปรียบเทียบเชิงลึก (Comparison Matrix)</span>
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                    {currentTopic.extraDetails.table.headers.map((h, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: 'left', border: '1px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentTopic.extraDetails.table.rows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '10px 14px', border: '1px solid var(--color-border)', color: cIdx === 0 ? '#38bdf8' : 'var(--color-text-primary)' }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(5, 8, 16, 0.94)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh' }}>
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: 0,
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✕ ปิด (Close)
            </button>
            <img
              src={getImageUrl(previewImage)}
              alt="Expanded Architecture Diagram"
              style={{
                maxWidth: '95vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
