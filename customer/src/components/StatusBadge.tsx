import { AppColors, Radius } from '@/constants/appTheme';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

const TONE_COLOR: Record<BadgeTone, string> = {
  success: AppColors.success,
  warning: AppColors.warning,
  danger: AppColors.danger,
  neutral: AppColors.textSecondary,
};

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const color = TONE_COLOR[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: Radius.pill, border: `1px solid ${color}` }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
      <span style={{ color, fontSize: 12, fontWeight: 700 }}>{label}</span>
    </span>
  );
}
