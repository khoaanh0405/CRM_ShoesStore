/**
 * Trạng thái xử lý Feedback (mục 4.1.4 "Tiếp nhận/xử lý phản hồi") và giới
 * hạn rating — khớp đúng CHECK (rating BETWEEN 1 AND 5) ở migration DB.
 */
export const FEEDBACK_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const FEEDBACK_STATUS_LIST = Object.values(FEEDBACK_STATUS);

export const FEEDBACK_RATING = {
  MIN: 1,
  MAX: 5,
};
