import { AppColors, Radius } from '@/constants/appTheme';

type Option<K extends string> = { key: K; label: string; count?: number };
type Props<K extends string> = { options: Option<K>[]; value: K; onChange: (key: K) => void; };

export function SegmentedControl<K extends string>({ options, value, onChange }: Props<K>) {
  return (
    <div style={{ display: 'flex', padding: 4, borderRadius: Radius.md, background: AppColors.surface, border: `1px solid ${AppColors.border}` }}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button key={option.key} onClick={() => onChange(option.key)} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
            background: active ? AppColors.accent : 'transparent',
            color: active ? AppColors.accentText : AppColors.textSecondary,
            fontSize: 13, fontWeight: 700,
          }}>
            {option.label}{option.count !== undefined ? ` (${option.count})` : ''}
          </button>
        );
      })}
    </div>
  );
}
