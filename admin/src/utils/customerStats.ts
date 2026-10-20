/** Dùng chung cho Dashboard Manager và trang Báo cáo khách hàng. */

export interface AgeBucket { label: string; min: number; max: number; color: string }

export const AGE_BUCKETS: AgeBucket[] = [
  { label: '18 - 25', min: 18, max: 25, color: '#F97316' },
  { label: '26 - 35', min: 26, max: 35, color: '#2563EB' },
  { label: '36 - 45', min: 36, max: 45, color: '#DC2626' },
  { label: '46+', min: 46, max: 999, color: '#059669' },
];

export const REPORT_COLORS = ['#7C3AED', '#F59E0B', '#059669', '#2563EB', '#DC2626', '#14B8A6'];

export const getAge = (dob?: string | null): number | null => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

/**
 * Tên sở thích của khách. API trả về object { categoryId, categoryName }
 * (hoặc { tag } / chuỗi ở các nơi khác) — luôn trả về CHUỖI để render và so sánh an toàn.
 */
export const preferenceTagOf = (p: any): string => {
  if (typeof p === 'string') return p;
  const name = p?.categoryName ?? p?.tag ?? p?.category?.categoryName;
  return typeof name === 'string' ? name : '';
};
