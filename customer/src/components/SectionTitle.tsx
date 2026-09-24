import { AppColors, SCREEN_PADDING } from '@/constants/appTheme';

type Props = { title: string; subtitle?: string; actionLabel?: string; onAction?: () => void; };

export function SectionTitle({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, padding: `0 ${SCREEN_PADDING}px` }}>
      <div>
        <div style={{ color: AppColors.textPrimary, fontSize: 18, fontWeight: 800 }}>{title}</div>
        {subtitle ? <div style={{ color: AppColors.textSecondary, fontSize: 12 }}>{subtitle}</div> : null}
      </div>
      {actionLabel && onAction ? (
        <button onClick={onAction} style={{ background: 'none', border: 'none', color: AppColors.accent, fontSize: 13, fontWeight: 700 }}>{actionLabel}</button>
      ) : null}
    </div>
  );
}
