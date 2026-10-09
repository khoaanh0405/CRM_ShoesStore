import { AppColors, Radius } from '@/constants/appTheme';
import { X } from 'lucide-react';

type Props = { label: string; selected?: boolean; onClick?: () => void; onRemove?: () => void; };

export function Chip({ label, selected = false, onClick, onRemove }: Props) {
  const fg = selected ? AppColors.accentText : AppColors.textPrimary;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: Radius.pill,
        border: `1px solid ${AppColors.border}`,
        background: selected ? AppColors.accent : AppColors.surface,
        borderColor: selected ? AppColors.accent : AppColors.border,
        color: fg,
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
      <span>{label}</span>
      {onRemove ? (
        <span onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ display: 'inline-flex' }}>
          <X size={14} color={fg} />
        </span>
      ) : null}
    </button>
  );
}
