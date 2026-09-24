import { AuthColors } from '@/constants/authTheme';
import { Loader2 } from 'lucide-react';

interface Props { label: string; onClick: () => void; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'ghost'; type?: 'button' | 'submit'; }

export function AuthButton({ label, onClick, loading, disabled, variant = 'primary', type = 'button' }: Props) {
  const isGhost = variant === 'ghost';
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        borderRadius: 999,
        padding: '16px 0',
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isGhost ? 'transparent' : AuthColors.accent,
        border: isGhost ? `1px solid ${AuthColors.surfaceBorder}` : 'none',
        color: isGhost ? AuthColors.textPrimary : AuthColors.accentText,
        fontSize: 16, fontWeight: 700,
        opacity: isDisabled ? 0.5 : 1,
      }}>
      {loading ? <Loader2 size={18} className="spin" /> : label}
    </button>
  );
}
