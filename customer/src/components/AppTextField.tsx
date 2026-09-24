import { AppColors, Radius } from '@/constants/appTheme';
import { useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

type Props = {
  label?: string;
  error?: string | null;
  hint?: string;
  multiline?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
    value?: string;
    onChangeText?: (value: string) => void;
  };

export function AppTextField({ label, error, hint, multiline, style, value, onChangeText, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const common = {
    value,
    onChange: (e: any) => onChangeText?.(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      minHeight: multiline ? 110 : 50,
      width: '100%',
      padding: '12px 16px',
      borderRadius: Radius.md,
      border: `1px solid ${error ? AppColors.danger : focused ? AppColors.accent : AppColors.border}`,
      background: AppColors.surface,
      color: AppColors.textPrimary,
      fontSize: 15,
      resize: 'vertical' as const,
      ...style,
    },
    placeholderTextColor: undefined,
    ...rest,
  };
  delete (common as any).placeholderTextColor;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label ? <label style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: 600 }}>{label}</label> : null}
      {multiline ? <textarea {...(common as any)} rows={4} /> : <input {...(common as any)} />}
      {error ? <span style={{ color: AppColors.danger, fontSize: 12 }}>{error}</span> : hint ? (
        <span style={{ color: AppColors.textSecondary, fontSize: 12 }}>{hint}</span>
      ) : null}
    </div>
  );
}
