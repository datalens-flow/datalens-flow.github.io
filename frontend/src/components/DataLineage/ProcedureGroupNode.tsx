import React from 'react';

export const ProcedureGroupNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: 'rgba(56, 189, 248, 0.03)',
        border: '1.5px dashed rgba(56, 189, 248, 0.35)',
        borderRadius: '12px',
        pointerEvents: 'none',
        boxSizing: 'border-box'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: '-14px',
          left: '16px',
          backgroundColor: 'var(--bg-tertiary, #1e293b)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '6px',
          padding: '3px 10px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'all',
          userSelect: 'none',
          zIndex: 10
        }}
      >
        <span style={{ fontSize: '12px' }}>📄</span>
        <span>PROCEDURE: {data.label}</span>
      </div>
    </div>
  );
};
