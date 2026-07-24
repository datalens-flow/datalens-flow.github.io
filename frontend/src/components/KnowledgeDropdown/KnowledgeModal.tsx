import React, { useState } from 'react';
import { KNOWLEDGE_GROUPS, KNOWLEDGE_TOPICS } from './knowledgeData';
import { RenderKnowledgeIcon } from './KnowledgeIcons';
import './KnowledgeModal.css';

interface KnowledgeModalProps {
  initialTopicId?: string | null;
  onClose: () => void;
}

export const KnowledgeModal: React.FC<KnowledgeModalProps> = ({ initialTopicId, onClose }) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    initialTopicId || KNOWLEDGE_TOPICS[0].id
  );
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  const currentTopic = KNOWLEDGE_TOPICS.find(t => t.id === selectedTopicId) || KNOWLEDGE_TOPICS[0];

  const filteredTopics = selectedGroupFilter === 'all'
    ? KNOWLEDGE_TOPICS
    : KNOWLEDGE_TOPICS.filter(t => t.groupId === selectedGroupFilter);

  return (
    <div className="knowledge-modal-overlay" onClick={onClose}>
      <div className="knowledge-modal-container glass-panel" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="knowledge-modal-header">
          <div className="modal-title-group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <h2>Data Ecosystem & Governance Knowledge Hub</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="knowledge-modal-body">
          
          {/* Left Sidebar: Categories & Topic List */}
          <div className="knowledge-sidebar">
            <div className="group-filter-tabs">
              <button 
                className={`filter-tab ${selectedGroupFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedGroupFilter('all')}
              >
                ทั้งหมด ({KNOWLEDGE_TOPICS.length})
              </button>
              {KNOWLEDGE_GROUPS.map(g => (
                <button 
                  key={g.id}
                  className={`filter-tab ${selectedGroupFilter === g.id ? 'active' : ''}`}
                  onClick={() => setSelectedGroupFilter(g.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RenderKnowledgeIcon iconKey={g.iconKey} size={13} color="currentColor" />
                  <span>{g.title.split('(')[0]}</span>
                </button>
              ))}
            </div>

            <div className="topic-list">
              {filteredTopics.map(t => (
                <div 
                  key={t.id}
                  className={`topic-card ${selectedTopicId === t.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTopicId(t.id)}
                >
                  <span className="topic-card-icon">
                    <RenderKnowledgeIcon iconKey={t.iconKey} size={18} color="var(--color-indigo)" />
                  </span>
                  <div className="topic-card-info">
                    <span className="topic-card-title">{t.title}</span>
                    <span className="topic-card-tag">{t.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Main Content Panel */}
          <div className="knowledge-content-panel">
            <div className="content-header">
              <span className="content-group-badge">{currentTopic.groupTitle}</span>
              <h1 className="content-title">
                <RenderKnowledgeIcon iconKey={currentTopic.iconKey} size={22} color="#38bdf8" />
                <span>{currentTopic.title}</span>
              </h1>
            </div>

            {/* Deep Dive Section */}
            <div className="knowledge-section">
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RenderKnowledgeIcon iconKey="lightbulb" size={16} color="#facc15" />
                <span>การเจาะลึก (Deep Dive Concept)</span>
              </h3>
              <p className="section-text">{currentTopic.deepDive}</p>
            </div>

            {/* Real World Scenario Example */}
            <div className="knowledge-section example-box">
              <h3 className="section-title text-emerald" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RenderKnowledgeIcon iconKey="pin" size={16} color="#10b981" />
                <span>ตัวอย่างการทำงานจริงในองค์กร (Enterprise Scenario)</span>
              </h3>
              <p className="section-text">{currentTopic.example}</p>
            </div>

            {/* Enterprise Use Case Box */}
            {currentTopic.useCase && (
              <div className="knowledge-section use-case-box">
                <h3 className="section-title text-cyan" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RenderKnowledgeIcon iconKey="rocket" size={16} color="#38bdf8" />
                  <span>กรณีการใช้งานในธุรกิจ (Enterprise Use Case)</span>
                </h3>
                <p className="section-text" style={{ whiteSpace: 'pre-line' }}>{currentTopic.useCase}</p>
              </div>
            )}

            {/* Extra Details (6 Quality Dimensions List OR Architecture Comparison Table) */}
            {currentTopic.extraDetails && currentTopic.extraDetails.type === 'list' && currentTopic.extraDetails.items && (
              <div className="knowledge-section">
                <h3 className="section-title text-indigo" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RenderKnowledgeIcon iconKey="data-quality" size={16} color="#818cf8" />
                  <span>6 มิติหลักวัดคุณภาพข้อมูล (Data Quality Dimensions)</span>
                </h3>
                <div className="dimensions-grid">
                  {currentTopic.extraDetails.items.map((item, i) => (
                    <div key={i} className="dimension-card">
                      <div className="dimension-title">{item.title}</div>
                      <div className="dimension-desc">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentTopic.extraDetails && currentTopic.extraDetails.type === 'comparison' && currentTopic.extraDetails.table && (
              <div className="knowledge-section">
                <h3 className="section-title text-cyan" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RenderKnowledgeIcon iconKey="mesh-vs-fabric" size={16} color="#22d3ee" />
                  <span>ตารางเปรียบเทียบเชิงลึก (Comparison Matrix)</span>
                </h3>
                <table className="knowledge-comparison-table">
                  <thead>
                    <tr>
                      {currentTopic.extraDetails.table.headers.map((h, i) => (
                        <th key={i}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentTopic.extraDetails.table.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className={cIdx === 0 ? 'header-cell' : ''}>
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

      </div>
    </div>
  );
};
