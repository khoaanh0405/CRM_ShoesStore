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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: AuthColors.textSecondary, fontSize: 13, fontWeight: 600 }}>{label}</span>
        {rightAction ? (
          <button
            type="button"
            onClick={rightAction.onClick}
            style={{ background: 'none', border: 'none', padding: 0, color: AuthColors.accent, fontSize: 13, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            {rightAction.label}
          </button>
        ) : null}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12,
        border: `1.5px solid ${error ? AuthColors.danger : AuthColors.surfaceBorder}`, padding: '0 14px',
        transition: 'border-color .15s',
      }}>
        <input
          {...rest}
          type={secureToggle ? (hidden ? 'password' : 'text') : type}
          value={value}
          onChange={(e) => onChangeText?.(e.target.value)}
          placeholder={rest.placeholder}
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: AuthColors.textPrimary, fontSize: 14.5, padding: '13px 0' }}
        />
        {secureToggle ? (
          <button type="button" onClick={() => setHidden((v) => !v)} style={{ background: 'none', border: 'none', fontSize: 15, paddingLeft: 8, opacity: 0.6 }}>
            {hidden ? '👁️' : '🙈'}
          </button>
        ) : null}
      </div>
      {error ? <span style={{ color: AuthColors.danger, fontSize: 12 }}>{error}</span> : null}
    </div>
  );
}
