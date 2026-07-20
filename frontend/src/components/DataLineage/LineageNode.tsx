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
  return (
    <div style={{ position: 'relative', width: '200px' }}>
      <div className="lineage-node">
        <div className={`lineage-node-header ${role}`}>
          {role === 'source' ? '◀ Source' : role === 'target' ? 'Target ▶' : '◀ ▶'}&nbsp;&nbsp;{data.tableName}
        </div>
        <div className="lineage-node-body">
          {columns.map((col, i) => (
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
              <span className="lineage-col-flow">{col.name}</span>
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
        </div>
      </div>
    </div>
  );
};
