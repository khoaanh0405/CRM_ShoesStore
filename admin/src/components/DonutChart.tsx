import React from 'react';

interface Segment { value: number; color: string; label: string; }
interface Props {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}

const DonutChart: React.FC<Props> = ({ segments, size = 140, thickness = 18, centerLabel, centerSub }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = segments.map((seg) => {
    const start = (acc / total) * 360;
    acc += seg.value;
    const end = (acc / total) * 360;
    return `${seg.color} ${start}deg ${end}deg`;
  });
  const background = stops.length ? `conic-gradient(${stops.join(', ')})` : '#e5e7eb';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background }} />
      <div
        style={{
          position: 'absolute',
          inset: thickness,
          borderRadius: '50%',
          background: 'var(--color-surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {centerLabel && <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-main)' }}>{centerLabel}</div>}
        {centerSub && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{centerSub}</div>}
      </div>
    </div>
  );
};

export default DonutChart;