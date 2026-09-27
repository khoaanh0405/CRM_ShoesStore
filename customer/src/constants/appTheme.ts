import { AuthColors } from './authTheme';

export const AppColors = {
  background: AuthColors.background,
  surface: AuthColors.surface,
  border: AuthColors.surfaceBorder,
  accent: AuthColors.accent,
  accentHover: AuthColors.accentHover,
  accentSoft: AuthColors.accentSoft,
  accentText: AuthColors.accentText,
  textPrimary: AuthColors.textPrimary,
  textSecondary: AuthColors.textSecondary,
  danger: '#E5484D',
  success: '#3FB27F',
  warning: '#E8A33D',
  overlay: 'rgba(35, 29, 59, 0.55)',
} as const;

export const Radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;
export const Gap = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const SCREEN_PADDING = 20;