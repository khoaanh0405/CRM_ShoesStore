import React from 'react';
import { Star } from 'lucide-react';

export const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={14} fill={s <= rating ? '#F59E0B' : 'none'} stroke={s <= rating ? '#F59E0B' : '#CBD5E1'} />
    ))}
    <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 600, color: '#F59E0B' }}>{rating}/5</span>
  </div>
);

const MAP = {
  Pending: { label: 'Chờ duyệt', bg: '#FEF3C7', color: '#D97706' },
  Approved: { label: 'Đã duyệt', bg: '#D1FAE5', color: '#059669' },
  Rejected: { label: 'Từ chối', bg: '#FEE2E2', color: '#DC2626' },
} as const;

export const FeedbackStatusBadge: React.FC<{ status: keyof typeof MAP }> = ({ status }) => {
  const m = MAP[status] ?? MAP.Pending;
  return (
    <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
};