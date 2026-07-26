import React from 'react';

interface ImpactPanelProps {
  selectedNodeId: string | null;
  nodes: any[];
  edges: any[];
  onClose: () => void;
  onSelectNode: (id: string) => void;
}

export const ImpactPanel: React.FC<ImpactPanelProps> = ({
  selectedNodeId, nodes, edges, onClose, onSelectNode
}) => {
  if (!selectedNodeId) return null;

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  if (!selectedNode || selectedNode.type !== 'lineageNode') return null;

  // BFS to find ALL upstream nodes (tables feeding into this one)
  const findUpstream = (startId: string): string[] => {
    const visited = new Set<string>();
    const queue = [startId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      edges.forEach(e => {
        if (e.target === curr && !visited.has(e.source)) {
          visited.add(e.source);
          queue.push(e.source);
        }
      });
    }
    return Array.from(visited);
  };

  // BFS to find ALL downstream nodes (tables this one feeds into)
  const findDownstream = (startId: string): string[] => {
    const visited = new Set<string>();
    const queue = [startId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      edges.forEach(e => {
        if (e.source === curr && !visited.has(e.target)) {
          visited.add(e.target);
          queue.push(e.target);
        }
      });
    }
    return Array.from(visited);
  };

  const upstreamIds = findUpstream(selectedNodeId);
  const downstreamIds = findDownstream(selectedNodeId);

  // Direct neighbors only (1 hop)
  const directUpIds = edges.filter(e => e.target === selectedNodeId).map(e => e.source);
  const directDownIds = edges.filter(e => e.source === selectedNodeId).map(e => e.target);

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const dbtColor = (type: string) => {
    switch(type) {
      case 'source': return '#10b981';
      case 'staging': return '#06b6d4';
      case 'marts': return '#818cf8';
      case 'exposure': return '#f97316';
      default: return '#818cf8';
    }
  };

  const NodeRow: React.FC<{ id: string; direct?: boolean }> = ({ id, direct }) => {
    const n = nodeMap.get(id);
    const color = dbtColor(n?.data?.dbtType || 'marts');
    return (
      <div
        onClick={() => onSelectNode(id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '5px 10px', cursor: 'pointer', borderRadius: '6px',
          transition: 'background 0.12s',
          marginBottom: '2px',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-tertiary)'}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
      >
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: '11.5px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {id}
        </span>
        {direct && (
          <span style={{ fontSize: '9px', color: color, background: `${color}22`, padding: '1px 5px', borderRadius: '999px', flexShrink: 0 }}>direct</span>
        )}
      </div>
    );
  };

  const dbtType = selectedNode.data?.dbtType || 'marts';
  const mainColor = dbtColor(dbtType);

  return (
    <div style={{
      position: 'absolute',
      top: 0, right: 0, bottom: 0,
      width: '280px',
      zIndex: 20,
      background: 'var(--bg-secondary)',
      borderLeft: `3px solid ${mainColor}`,
      boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.2s ease',
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      {/* Header */}
      <div style={{
        padding: '14px 14px 10px',
        borderBottom: '1px solid var(--color-border)',
        background: `${mainColor}12`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: mainColor, letterSpacing: '0.08em', marginBottom: '4px', textTransform: 'uppercase' }}>
              {dbtType} · Impact Analysis
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedNodeId}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '16px', padding: '0 0 0 8px', lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {[
            { label: 'All Upstream', count: upstreamIds.length, color: '#10b981' },
            { label: 'Direct Up', count: directUpIds.length, color: '#06b6d4' },
            { label: 'All Downstream', count: downstreamIds.length, color: '#818cf8' },
            { label: 'Direct Down', count: directDownIds.length, color: '#f97316' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '6px', padding: '6px 4px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: '8.5px', color: 'var(--color-text-muted)', marginTop: '1px', lineHeight: 1.2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {/* Direct upstream */}
        {directUpIds.length > 0 && (
          <>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', padding: '4px 10px 4px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="19 12 5 12"/><polyline points="12 5 5 12 12 19"/>
              </svg>
              UPSTREAM ({directUpIds.length} direct, {upstreamIds.length} total)
            </div>
            {directUpIds.map(id => <NodeRow key={id} id={id} direct />)}
            {upstreamIds.filter(id => !directUpIds.includes(id)).map(id => <NodeRow key={id} id={id} />)}
          </>
        )}

        {directUpIds.length > 0 && directDownIds.length > 0 && (
          <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 10px' }} />
        )}

        {/* Direct downstream */}
        {directDownIds.length > 0 && (
          <>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', padding: '4px 10px 4px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="5 12 19 12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
              DOWNSTREAM ({directDownIds.length} direct, {downstreamIds.length} total)
            </div>
            {directDownIds.map(id => <NodeRow key={id} id={id} direct />)}
            {downstreamIds.filter(id => !directDownIds.includes(id)).map(id => <NodeRow key={id} id={id} />)}
          </>
        )}

        {directUpIds.length === 0 && directDownIds.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px 16px', fontSize: '12px' }}>
            No lineage connections found for this table.
          </div>
        )}
      </div>
    </div>
  );
};
