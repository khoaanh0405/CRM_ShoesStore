import { AppColors, SCREEN_PADDING } from '@/constants/appTheme';

type Props = { title: string; subtitle?: string; actionLabel?: string; onAction?: () => void; };

export function SectionTitle({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, padding: `0 ${SCREEN_PADDING}px` }}>
      <div>
        <div className="section-heading">{title}</div>
        {subtitle ? <div style={{ color: AppColors.textSecondary, fontSize: 12 }}>{subtitle}</div> : null}
      </div>
      {actionLabel && onAction ? (
        <button onClick={onAction} style={{ background: 'none', border: 'none', color: AppColors.textPrimary, fontSize: 14, fontWeight: 700, textDecoration: 'underline' }}>{actionLabel}</button>
      ) : null}
    </div>
  );
}
