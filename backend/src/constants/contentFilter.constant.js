/**
 * Hằng số cho bộ lọc nội dung đánh giá (feedback).
 * Danh sách từ khóa chỉ là bộ khởi đầu — thêm/bớt trực tiếp ở đây, không cần sửa logic.
 *
 * Quy ước 2 danh sách từ cấm:
 *  - PROFANITY_ACCENTED: từ MƠ HỒ khi bỏ dấu (vd "lồn" ~ "lớn", "đéo" ~ "đeo", "ngủ" ~ "ngu").
 *    Chỉ được so khớp trên văn bản CÒN dấu, và chỉ khi người dùng thật sự gõ có dấu.
 *  - PROFANITY_PLAIN: từ KHÔNG gây nhầm khi bỏ dấu, dùng để bắt người dùng viết không dấu.
 * Lý do tách: tránh chặn nhầm các đánh giá hợp lệ như "size lớn", "các bạn", "ngủ ngon", "đeo êm".
 */

export const FEEDBACK_CONTENT_LIMITS = Object.freeze({
  TITLE_MIN_LETTERS: 2,
  TITLE_MAX_LENGTH: 150, // khớp VARCHAR(150) + feedback.validator
  CONTENT_MIN_LETTERS: 4,
  CONTENT_MAX_LENGTH: 2000, // khớp giới hạn phản hồi (ReviewReply)
});

export const MODERATION_REASON = Object.freeze({
  EMPTY: 'EMPTY',
  TOO_LONG: 'TOO_LONG',
  NO_LETTERS: 'NO_LETTERS',
  TOO_SHORT: 'TOO_SHORT',
  PROFANITY: 'PROFANITY',
  CONTACT_INFO: 'CONTACT_INFO',
  SYMBOL_SPAM: 'SYMBOL_SPAM',
  REPEATED: 'REPEATED',
  GIBBERISH: 'GIBBERISH',
});

/** Tỷ lệ ký tự "lạ" (#, *, _, <, >, |...) tối đa trong nội dung. */
export const MAX_SYMBOL_NOISE_RATIO = 0.3;

/** Từ cấm — so khớp trên văn bản CÓ dấu (xem ghi chú đầu file). */
export const PROFANITY_ACCENTED = [
  'đụ', 'đéo', 'lồn', 'cặc', 'cứt', 'buồi', 'đĩ',
  'đồ chó', 'thằng chó', 'óc chó', 'chó chết',
  'súc vật', 'súc sinh', 'khốn nạn', 'khốn kiếp', 'mất dạy', 'vô học',
  'thằng ngu', 'đồ ngu', 'con ngu', 'bọn ngu', 'lũ ngu', 'ngu xuẩn', 'ngu si', 'ngu như',
  'đồ đần', 'thằng đần', 'đồ điên', 'thằng điên',
  'mẹ mày', 'má mày', 'mẹ kiếp', 'cút đi', 'cút xéo', 'đi chết',
];

/** Từ cấm — so khớp trên văn bản đã bỏ dấu (an toàn, ít nhầm với từ thường). */
export const PROFANITY_PLAIN = [
  'dit', 'dit me', 'dit con me', 'ditme', 'dm', 'dcm', 'dkm', 'vcl', 'vkl', 'vl', 'clgt',
  'loz', 'lonz', 'du me', 'du ma', 'khon nan', 'khon kiep', 'suc vat', 'suc sinh', 'mat day',
  // Tiếng Anh
  'fuck', 'fucker', 'fucked', 'fucking', 'fuk', 'fck', 'motherfucker', 'shit', 'shitty', 'bullshit',
  'bitch', 'bitches', 'bastard', 'asshole', 'dumbass', 'cunt', 'dick', 'slut', 'whore', 'moron',
  'retard', 'stfu', 'wtf',
];

/** Từ viết tắt hợp lệ trông giống chuỗi ngẫu nhiên (không nguyên âm). */
export const GIBBERISH_ALLOWLIST = ['tphcm', 'tphn', 'xxxl', 'xxxxl'];

/** Chuỗi phím gõ bừa (kèm bản đảo ngược) — chỉ liệt kê chuỗi ít xuất hiện trong từ thật. */
export const KEYBOARD_MASH = [
  'asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl', 'qwer', 'zxcv', 'xcvb', 'cvbn', 'vbnm',
  'qwert', 'werty', 'ertyu', 'rtyui', 'tyuio', 'yuiop',
  'fdsa', 'gfds', 'hgfd', 'jhgf', 'kjhg', 'lkjh', 'rewq', 'vcxz', 'bvcx', 'nbvc', 'mnbv',
];
