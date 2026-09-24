import { AppColors, Radius } from '@/constants/appTheme';
import type { CSSProperties, ReactNode } from 'react';

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: AppColors.surface, border: `1px solid ${AppColors.border}`, borderRadius: Radius.lg, padding: 16, ...style }}>
      {children}
    </div>
  );
}
