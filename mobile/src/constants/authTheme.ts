/**
 * Bảng màu RIÊNG cho nhóm màn hình (auth) — login/register luôn hiển thị
 * theo Dark Mode cố định (đúng bản thiết kế Login-Register_UI.png), không
 * phụ thuộc vào theme sáng/tối của hệ thống như constants/theme.ts.
 */
export const AuthColors = {
  background: '#0B0B0D',
  surface: '#1C1C1F',
  surfaceBorder: '#2C2C30',
  textPrimary: '#FFFFFF',
  textSecondary: '#9A9AA2',
  placeholder: '#6B6B72',
  accent: '#3ECF8E',
  accentText: '#08130D',
  danger: '#FF6B6B',
} as const;
