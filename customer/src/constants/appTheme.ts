import { AuthColors } from './authTheme';

// Nền trang xám nhạt, thẻ (surface) trắng, nhấn đen — theo tông ảnh mẫu.
export const AppColors = {
  background: '#F0F0F2',
  surface: '#FFFFFF',
  border: AuthColors.surfaceBorder,
  accent: AuthColors.accent,
  accentHover: AuthColors.accentHover,
  accentSoft: '#EDEDEF',
  accentText: AuthColors.accentText,
  textPrimary: AuthColors.textPrimary,
  textSecondary: AuthColors.textSecondary,
  danger: '#D64545',
  success: '#2E9E6B',
  warning: '#D99A2B',
  overlay: 'rgba(24, 24, 27, 0.55)',
} as const;

export const Radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;
export const Gap = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const SCREEN_PADDING = 20;