export const FEEDBACK_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const;

export const FEEDBACK_RATING = { MIN: 1, MAX: 5 } as const;

export const QUESTION_TYPES = {
  TEXT: 'TEXT',
  SINGLE_CHOICE: 'SINGLE_CHOICE',
} as const;

export const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'] as const;

export const PREFERENCE_SUGGESTIONS = [
  'Giày Sneaker',
  'Giày Chạy Bộ',
  'Giày Bóng Rổ',
  'Giày Thể Thao',
  'Giày Cao Gót',
  'Giày Sandal',
  'Giày Da',
] as const;
