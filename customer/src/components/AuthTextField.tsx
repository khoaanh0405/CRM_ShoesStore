import { AuthColors } from '@/constants/authTheme';
import { useState, type InputHTMLAttributes } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  error?: string | null;
  secureToggle?: boolean;
  rightAction?: { label: string; onClick: () => void };
  value?: string;
  onChangeText?: (v: string) => void;
}

export function AuthTextField({ label, error, secureToggle, rightAction, type, value, onChangeText, ...rest }: Props) {
  const [hidden, setHidden] = useState(type === 'password');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: AuthColors.textSecondary, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>{label}</span>
        {rightAction ? (
          <button onClick={rightAction.onClick} style={{ background: 'none', border: 'none', color: AuthColors.accent, fontSize: 12, fontWeight: 700 }}>{rightAction.label}</button>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', background: AuthColors.surface, borderRadius: 14, border: `1px solid ${error ? AuthColors.danger : AuthColors.surfaceBorder}`, padding: '0 16px' }}>
        <input
          {...rest}
          type={secureToggle ? (hidden ? 'password' : 'text') : type}
          value={value}
          onChange={(e) => onChangeText?.(e.target.value)}
          placeholder={rest.placeholder}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: AuthColors.textPrimary, fontSize: 15, padding: '14px 0' }}
        />
        {secureToggle ? (
          <button type="button" onClick={() => setHidden((v) => !v)} style={{ background: 'none', border: 'none', fontSize: 16, paddingLeft: 8 }}>
            {hidden ? '👁️' : '🙈'}
          </button>
        ) : null}
      </div>
      {error ? <span style={{ color: AuthColors.danger, fontSize: 12 }}>{error}</span> : null}
    </div>
  );
}
