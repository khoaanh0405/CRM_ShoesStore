/**
 * Định nghĩa các nhóm tuổi dùng cho báo cáo khách hàng (mục 4.1.5). Tách
 * thành constant để customer.service.js#report() không hard-code các mốc
 * tuổi trong logic, dễ chỉnh nếu yêu cầu đồ án đổi cách chia nhóm.
 */
export const AGE_BUCKETS = [
  { label: 'Dưới 18', min: 0, max: 17 },
  { label: '18-24', min: 18, max: 24 },
  { label: '25-34', min: 25, max: 34 },
  { label: '35-44', min: 35, max: 44 },
  { label: '45-54', min: 45, max: 54 },
  { label: '55+', min: 55, max: Infinity },
];
