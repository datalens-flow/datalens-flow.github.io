import React from 'react';

export const CardinalityMarkers: React.FC = () => {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <marker
          id="one-cardinality"
          markerWidth="12"
          markerHeight="12"
          refX="0"
          refY="6"
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path d="M 3,2 L 3,10 M 7,2 L 7,10" stroke="var(--color-edge)" strokeWidth="2" fill="none" />
        </marker>

        <marker
          id="many-cardinality"
          markerWidth="16"
          markerHeight="16"
          refX="16"
          refY="8"
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path d="M 16,8 L 4,2 M 16,8 L 4,14 M 4,8 L 16,8" stroke="var(--color-edge)" strokeWidth="2" fill="none" />
          <path d="M 0,3 L 0,13" stroke="var(--color-edge)" strokeWidth="2" fill="none" />
        </marker>
      </defs>
    </svg>
  );
};
export default CardinalityMarkers;
