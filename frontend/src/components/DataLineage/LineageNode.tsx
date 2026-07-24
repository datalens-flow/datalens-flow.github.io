import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ColInfo } from './types';

// Custom Lineage Node with per-column handles (supports dual-role: both source + target)
const LineageNodeComponent: React.FC<{ data: any; selected?: boolean }> = ({ data }) => {
  const columns: ColInfo[] = data.columns || [];
  const role: 'source' | 'target' | 'both' = data.role || 'source';
  const nodeType: 'source' | 'target' | 'both' | 'temp' | 'view' = data.nodeTypeOverride || role;
  const isCollapsed: boolean = data.isCollapsed || false;
  
  const MAX_COLS_VISIBLE = 5;
  const visibleCols = isCollapsed ? columns.slice(0, MAX_COLS_VISIBLE) : columns;
  const hiddenCount = columns.length - visibleCols.length;

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'source': return { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--color-emerald)' }; // emerald
      case 'target': return { bg: 'rgba(99, 102, 241, 0.1)', text: 'var(--color-indigo)' }; // indigo
      case 'both': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' }; // amber
      case 'temp': return { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899' }; // pink
      case 'view': return { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7' }; // purple
      default: return { bg: 'var(--bg-tertiary)', text: 'var(--color-text-primary)' };
    }
  };

  const getBadgeIcon = (type: string) => {
    switch(type) {
      case 'source': return '◀';
      case 'target': return '▶';
      case 'both': return '◀▶';
      case 'temp': return '📦';
      case 'view': return '👁️';
      default: return '';
    }
  };

  const [showColsInDbt, setShowColsInDbt] = React.useState(false);

  const getDbtColor = (type: string) => {
    switch(type) {
      case 'source': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981', label: 'SOURCE' };
      case 'staging': return { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: '#06b6d4', label: 'MODEL.STAGING' };
      case 'marts': return { bg: 'rgba(129, 140, 248, 0.15)', text: '#818cf8', border: '#818cf8', label: 'MODEL.MARTS' };
      case 'exposure': return { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: '#f97316', label: 'EXPOSURE' };
      case 'seed': return { bg: 'rgba(250, 204, 21, 0.15)', text: '#facc15', border: '#facc15', label: 'SEED' };
      default: return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: '#818cf8', label: 'MODEL' };
    }
  };

  const dbtMeta = getDbtColor(data.dbtType || 'marts');
  const dbtPathLabel = `${(data.dbtType || 'model')}.${data.dbtSchema || 'analytics'}.${data.tableName}`;

  const theme = getTypeColor(nodeType);

  return (
    <div style={{ position: 'relative', width: '260px' }}>
      <div 
        className="lineage-node" 
        style={{ 
          opacity: nodeType === 'temp' ? 0.9 : 1,
          border: `1px solid ${dbtMeta.border}`,
          borderRadius: '8px',
          boxShadow: `0 4px 12px ${dbtMeta.bg}`
        }}
      >
        {/* dbt Top Meta Pill */}
        <div style={{
          padding: '4px 10px',
          background: dbtMeta.bg,
          borderBottom: `1px solid ${dbtMeta.border}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          fontFamily: 'var(--font-mono, monospace)'
        }}>
          <span style={{ color: dbtMeta.text, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dbtMeta.text }} />
            <span>{dbtMeta.label}</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {data.dbtMaterialization && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--color-text-muted)',
                padding: '1px 5px',
                borderRadius: '3px',
                fontSize: '9px'
              }}>
                [{data.dbtMaterialization}]
              </span>
            )}
            {columns.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColsInDbt(prev => !prev);
                }}
                style={{
                  background: showColsInDbt ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--color-border)',
                  color: showColsInDbt ? '#38bdf8' : 'var(--color-text-muted)',
                  borderRadius: '3px',
                  padding: '1px 6px',
                  fontSize: '9px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
                title="Toggle Columns List"
              >
                {showColsInDbt ? '▲ Hide cols' : `▼ ${columns.length} cols`}
              </button>
            )}
          </div>
        </div>

        <div className={`lineage-node-header`} style={{ position: 'relative', backgroundColor: 'transparent', color: theme.text, display: 'flex', alignItems: 'center' }}>
          <Handle
            type="target"
            position={Position.Left}
            id="col-header"
            style={{ 
              background: dbtMeta.text, width: '10px', height: '10px', left: '-17px',
              opacity: (isCollapsed || data.viewMode === 'overview' || !data.hasIncoming) ? 0.3 : 1,
              pointerEvents: 'all'
            }}
          />
          <span style={{ fontSize: '10px', fontWeight: 'bold', background: dbtMeta.text, color: '#090d16', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', flexShrink: 0, display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span>{getBadgeIcon(nodeType)}</span>
            <span>{nodeType.toUpperCase()}</span>
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--color-text-primary)' }} title={dbtPathLabel}>
            {data.tableName}
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="col-header"
            style={{ 
              background: dbtMeta.text, width: '10px', height: '10px', right: '-17px',
              opacity: (isCollapsed || data.viewMode === 'overview' || !data.hasOutgoing) ? 0.3 : 1,
              pointerEvents: 'all'
            }}
          />
        </div>
        {data.viewMode !== 'overview' && (data.viewMode !== 'dbt' || showColsInDbt) && (
          <div className="lineage-node-body">
          {visibleCols.map((col, i) => (
            <div key={i} className="lineage-col-row">
              {/* Left handle (incoming) */}
              {col.hasLeft && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`col-${col.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
                  style={{
                    background: 'var(--color-emerald)',
                    border: '2px solid var(--bg-primary)',
                    width: '10px',
                    height: '10px',
                    left: '-17px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    position: 'absolute',
                  }}
                />
              )}
              <span className="lineage-col-flow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.name}</span>
              {/* Right handle (outgoing) */}
              {col.hasRight && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`col-${col.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
                  style={{
                    background: 'var(--color-indigo)',
                    border: '2px solid var(--bg-primary)',
                    width: '10px',
                    height: '10px',
                    right: '-17px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    position: 'absolute',
                  }}
                />
              )}
            </div>
          ))}
          {hiddenCount > 0 && (
            <div 
              className="lineage-col-row" 
              style={{ justifyContent: 'center', cursor: 'pointer', color: 'var(--color-indigo)', fontWeight: 600, fontSize: '11px', background: 'rgba(99, 102, 241, 0.05)' }}
              onClick={() => data.onToggleCollapse && data.onToggleCollapse(data.tableName)}
            >
              Show {hiddenCount} more...
            </div>
          )}
          {!isCollapsed && columns.length > MAX_COLS_VISIBLE && (
            <div 
              className="lineage-col-row" 
              style={{ justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '11px' }}
              onClick={() => data.onToggleCollapse && data.onToggleCollapse(data.tableName)}
            >
              ▲ Collapse
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export const LineageNode = React.memo(LineageNodeComponent, (prevProps, nextProps) => {
  if (prevProps.selected !== nextProps.selected) return false;
  
  const prev = prevProps.data;
  const next = nextProps.data;
  
  if (prev.procKey !== next.procKey) return false;
  if (prev.tableName !== next.tableName) return false;
  if (prev.isCollapsed !== next.isCollapsed) return false;
  if (prev.viewMode !== next.viewMode) return false;
  if (prev.nodeTypeOverride !== next.nodeTypeOverride) return false;
  if (prev.role !== next.role) return false;
  if (prev.isTemp !== next.isTemp) return false;
  if (prev.isView !== next.isView) return false;
  if (prev.hasIncoming !== next.hasIncoming) return false;
  if (prev.hasOutgoing !== next.hasOutgoing) return false;
  
  const prevCols = prev.columns || [];
  const nextCols = next.columns || [];
  if (prevCols.length !== nextCols.length) return false;
  for (let i = 0; i < prevCols.length; i++) {
    if (prevCols[i].name !== nextCols[i].name) return false;
    if (prevCols[i].hasLeft !== nextCols[i].hasLeft) return false;
    if (prevCols[i].hasRight !== nextCols[i].hasRight) return false;
  }
  
  return true;
});
