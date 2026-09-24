import { AppColors, SCREEN_PADDING } from '@/constants/appTheme';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = { title: string; subtitle?: string; onBack?: () => void; right?: ReactNode; };

export function ScreenHeader({ title, subtitle, onBack, right }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: `12px ${SCREEN_PADDING}px` }}>
      {onBack ? (
        <button onClick={onBack} aria-label="Quay lại" style={{
          width: 38, height: 38, borderRadius: 19, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: AppColors.surface, border: `1px solid ${AppColors.border}`,
        }}>
          <ChevronLeft size={20} color={AppColors.textPrimary} />
        </button>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: AppColors.textPrimary, fontSize: 24, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle ? <div style={{ color: AppColors.textSecondary, fontSize: 13 }}>{subtitle}</div> : null}
      </div>
      {right}
    </div>
  );
}
