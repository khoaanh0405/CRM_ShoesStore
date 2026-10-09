/** Tên hiển thị tiếng Việt cho danh mục (giá trị gửi lên API vẫn là tên gốc). Khớp với PREFERENCE_SUGGESTIONS. */
const LABELS: Record<string, string> = {
  sneaker: 'Giày Sneaker',
  running: 'Giày Chạy Bộ',
  basketball: 'Giày Bóng Rổ',
  heels: 'Giày Cao Gót',
  sandal: 'Giày Sandal',
};

export const categoryLabel = (name: string): string => LABELS[name.trim().toLowerCase()] ?? name;
