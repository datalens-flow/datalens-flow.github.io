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
  const isCollapsed: boolean = data.isCollapsed || false;
  
  const MAX_COLS_VISIBLE = 5;
  const visibleCols = isCollapsed ? columns.slice(0, MAX_COLS_VISIBLE) : columns;
  const hiddenCount = columns.length - visibleCols.length;

  return (
    <div style={{ position: 'relative', width: '250px' }}>
      <div className="lineage-node" style={{ opacity: data.isTemp ? 0.9 : 1 }}>
        <div className={`lineage-node-header ${role}`} style={{ position: 'relative', backgroundColor: data.isTemp ? 'var(--bg-tertiary)' : undefined, color: data.isTemp ? 'var(--color-text-primary)' : undefined }}>
          {isCollapsed && role !== 'source' && (
             <Handle
               type="target"
               position={Position.Left}
               id="col-header"
               style={{ background: 'var(--color-emerald)', width: '10px', height: '10px', left: '-17px' }}
             />
          )}
          {data.isTemp && <span style={{ fontSize: '9px', background: 'var(--color-indigo)', color: '#fff', padding: '2px 4px', borderRadius: '4px', marginRight: '6px' }}>TEMP</span>}
          {role === 'source' ? '◀ Source' : role === 'target' ? 'Target ▶' : '◀ ▶'}&nbsp;&nbsp;{data.tableName}
          {isCollapsed && role !== 'target' && (
             <Handle
               type="source"
               position={Position.Right}
               id="col-header"
               style={{ background: 'var(--color-indigo)', width: '10px', height: '10px', right: '-17px' }}
             />
          )}
        </div>
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
      </div>
    </div>
  );
};
