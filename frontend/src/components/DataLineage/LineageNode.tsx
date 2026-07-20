import React from 'react';
import { Handle, Position } from '@xyflow/react';

// Column data for LineageNode
export interface ColInfo {
  name: string;
  hasLeft: boolean;   // incoming handle (target)
  hasRight: boolean;  // outgoing handle (source)
}

// Custom Lineage Node with per-column handles (supports dual-role: both source + target)
export const LineageNode: React.FC<{ data: any }> = ({ data }) => {
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

  const theme = getTypeColor(nodeType);

  return (
    <div style={{ position: 'relative', width: '250px' }}>
      <div className="lineage-node" style={{ opacity: nodeType === 'temp' ? 0.9 : 1 }}>
        <div className={`lineage-node-header`} style={{ position: 'relative', backgroundColor: theme.bg, color: theme.text, display: 'flex', alignItems: 'center' }}>
          {(isCollapsed || data.viewMode === 'overview') && role !== 'source' && (
             <Handle
               type="target"
               position={Position.Left}
               id="col-header"
               style={{ background: 'var(--color-emerald)', width: '10px', height: '10px', left: '-17px' }}
             />
          )}
          <span style={{ fontSize: '10px', fontWeight: 'bold', background: theme.text, color: '#fff', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', flexShrink: 0, display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span>{getBadgeIcon(nodeType)}</span>
            <span>{nodeType.toUpperCase()}</span>
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--color-text-primary)' }} title={data.tableName}>
            {data.tableName}
          </span>
          {(isCollapsed || data.viewMode === 'overview') && role !== 'target' && (
             <Handle
               type="source"
               position={Position.Right}
               id="col-header"
               style={{ background: 'var(--color-indigo)', width: '10px', height: '10px', right: '-17px' }}
             />
          )}
        </div>
        {data.viewMode !== 'overview' && (
          <div className="lineage-node-body">
          {visibleCols.map((col, i) => (
            <div key={i} className="lineage-col-row">
              {/* Left handle (incoming) */}
              {col.hasLeft && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`col-${col.name}`}
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
                  id={`col-${col.name}`}
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
