import React from 'react';

interface Props {
  lastUpdated: Date | null;
}

/** Chấm xanh "Trực tiếp" + giờ cập nhật gần nhất, để manager biết trang đang tự cập nhật. */
const LiveBadge: React.FC<Props> = ({ lastUpdated }) => (
  <span
    title="Dữ liệu tự động cập nhật mỗi 5 giây"
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
      borderRadius: 999, background: '#D1FAE5', color: '#059669', fontSize: 12.5, fontWeight: 600,
    }}
  >
    <span
      style={{
        width: 8, height: 8, borderRadius: '50%', background: '#10B981',
        animation: 'livePulse 1.6s ease-in-out infinite',
      }}
    />
    Trực tiếp
    {lastUpdated && (
      <span style={{ fontWeight: 500, opacity: 0.8 }}>
        · {lastUpdated.toLocaleTimeString('vi-VN')}
      </span>
    )}
    <style>{`@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}`}</style>
  </span>
);

export default LiveBadge;
