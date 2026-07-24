import React, { useState, useEffect, useRef } from 'react';
import { KNOWLEDGE_GROUPS, KNOWLEDGE_TOPICS } from './knowledgeData';
import { KnowledgeModal } from './KnowledgeModal';
import { RenderKnowledgeIcon } from './KnowledgeIcons';

export const KnowledgeDropdown: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpenTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    setModalOpen(true);
    setDropdownOpen(false);
  };

  return (
    <>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          className={`toolbar-dropdown-trigger ${dropdownOpen ? 'active' : ''}`}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span style={{ fontWeight: 500 }}>Knowledge Base</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 3.5L5 6.5 7.5 3.5"/>
          </svg>
        </button>

        {dropdownOpen && (
          <div 
            className="toolbar-dropdown-panel glass-panel" 
            style={{ 
              left: 0, 
              top: 'calc(100% + 6px)', 
              width: '320px', 
              maxHeight: '440px', 
              overflowY: 'auto',
              padding: '6px'
            }}
          >
            {KNOWLEDGE_GROUPS.map(group => {
              const groupTopics = KNOWLEDGE_TOPICS.filter(t => t.groupId === group.id);
              return (
                <div key={group.id} style={{ marginBottom: '8px' }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#38bdf8',
                    padding: '4px 8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <RenderKnowledgeIcon iconKey={group.iconKey} size={13} color="#38bdf8" />
                    <span>{group.title}</span>
                  </div>
                  {groupTopics.map(topic => (
                    <button
                      key={topic.id}
                      className="toolbar-dropdown-item"
                      onClick={() => handleOpenTopic(topic.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        fontSize: '11px',
                        padding: '6px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RenderKnowledgeIcon iconKey={topic.iconKey} size={13} color="var(--color-indigo)" />
                        <span>{topic.title}</span>
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <KnowledgeModal
          initialTopicId={selectedTopicId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
