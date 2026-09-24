import { AppColors, Radius } from '@/constants/appTheme';
import type { CSSProperties, ReactNode } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  label: string;
  onClick: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: CSSProperties;
  type?: 'button' | 'submit';
};

const PALETTE: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: AppColors.accent, fg: AppColors.accentText, border: AppColors.accent },
  secondary: { bg: AppColors.surface, fg: AppColors.textPrimary, border: AppColors.border },
  danger: { bg: 'transparent', fg: AppColors.danger, border: AppColors.danger },
  ghost: { bg: 'transparent', fg: AppColors.accent, border: 'transparent' },
};

export function AppButton({ label, onClick, variant = 'primary', icon: Icon, loading = false, disabled = false, compact = false, style, type = 'button' }: Props) {
  const colors = PALETTE[variant];
  const inactive = disabled || loading;
  const base: CSSProperties = {
    minHeight: compact ? 38 : 52,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: compact ? '0 14px' : '0 20px',
    borderRadius: compact ? Radius.pill : Radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.fg,
    fontSize: compact ? 13 : 15,
    fontWeight: 700,
    opacity: inactive ? 0.6 : 1,
    width: style?.width ?? undefined,
    ...style,
  };
  return (
    <button type={type} onClick={onClick} disabled={inactive} style={base}>
      {loading ? <Loader2 size={16} className="spin" /> : (
        <>
          {Icon ? <Icon size={compact ? 16 : 18} /> : null}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
