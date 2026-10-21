/**
 * Kiểm duyệt nội dung đánh giá TỰ ĐỘNG ở Backend (thay cho bước Manager duyệt thủ công).
 *
 * Nguyên tắc:
 *  - Chỉ chặn khi nội dung THẬT SỰ có vấn đề (chửi tục, spam, vô nghĩa, rỗng, quá dài...).
 *    Đánh giá tiêu cực nhưng góp ý hợp lệ ("giày bong đế sau 1 tuần, rất thất vọng") luôn được qua.
 *  - Chuẩn hóa trước khi dò (bỏ dấu, gom ký tự lặp, bỏ ký tự chèn, giải leet-speak) để hạn chế né lọc.
 *  - Thuần hàm, không đụng DB, không ghi log nội dung người dùng. Vi phạm -> ném ValidationError (400)
 *    kèm lý do bằng tiếng Việt để Frontend hiển thị nguyên văn cho khách hàng.
 */
import { ValidationError } from '../errors/AppError.js';
import {
  FEEDBACK_CONTENT_LIMITS,
  MODERATION_REASON as R,
  MAX_SYMBOL_NOISE_RATIO,
  PROFANITY_ACCENTED,
  PROFANITY_PLAIN,
  GIBBERISH_ALLOWLIST,
  KEYBOARD_MASH,
} from '../constants/contentFilter.constant.js';
import { sanitizeText, stripDiacritics, collapseRepeats, buildSearchVariants } from '../utils/text.util.js';

const FIELD_SPECS = {
  title: {
    label: 'Tiêu đề',
    minLetters: FEEDBACK_CONTENT_LIMITS.TITLE_MIN_LETTERS,
    maxLength: FEEDBACK_CONTENT_LIMITS.TITLE_MAX_LENGTH,
  },
  content: {
    label: 'Nội dung',
    minLetters: FEEDBACK_CONTENT_LIMITS.CONTENT_MIN_LETTERS,
    maxLength: FEEDBACK_CONTENT_LIMITS.CONTENT_MAX_LENGTH,
  },
};

/** Thông báo hiển thị cho khách hàng theo từng lý do vi phạm. */
const REASON_MESSAGES = {
  [R.EMPTY]: (s) => `${s.label} đánh giá không được để trống hoặc chỉ chứa khoảng trắng.`,
  [R.TOO_LONG]: (s) => `${s.label} đánh giá quá dài (tối đa ${s.maxLength} ký tự). Vui lòng rút gọn trước khi gửi.`,
  [R.NO_LETTERS]: (s) => `${s.label} đánh giá phải có chữ, không được chỉ gồm số, ký tự đặc biệt hoặc biểu tượng.`,
  [R.TOO_SHORT]: (s) => `${s.label} đánh giá quá ngắn. Vui lòng nhập ít nhất ${s.minLetters} chữ cái.`,
  [R.PROFANITY]: (s) => `${s.label} đánh giá chứa từ ngữ không phù hợp. Vui lòng chỉnh sửa trước khi gửi.`,
  [R.CONTACT_INFO]: (s) => `${s.label} đánh giá không được chứa đường dẫn, email hoặc số điện thoại. Vui lòng xóa các thông tin này trước khi gửi.`,
  [R.SYMBOL_SPAM]: (s) => `${s.label} đánh giá chứa quá nhiều ký tự đặc biệt. Vui lòng chỉnh sửa lại cho dễ đọc.`,
  [R.REPEATED]: (s) => `${s.label} đánh giá có ký tự hoặc từ bị lặp lại bất thường. Vui lòng chỉnh sửa trước khi gửi.`,
  [R.GIBBERISH]: (s) => `${s.label} đánh giá có vẻ là chuỗi ký tự ngẫu nhiên hoặc vô nghĩa. Vui lòng nhập nội dung đánh giá thật của bạn.`,
};

/* ------------------------------ Từ cấm ------------------------------ */

const uniq = (arr) => [...new Set(arr)];
// Chuẩn hóa danh sách từ cấm theo ĐÚNG cách chuẩn hóa văn bản đầu vào (bỏ dấu + gom lặp) để so khớp công bằng.
const PLAIN_TERMS = uniq(PROFANITY_PLAIN.map((t) => collapseRepeats(stripDiacritics(t.toLowerCase()))));
const ACCENTED_TERMS = uniq(PROFANITY_ACCENTED.map((t) => collapseRepeats(t.toLowerCase())));

const containsTerm = (variants, terms) => variants.some((v) => terms.some((t) => v.includes(` ${t} `)));

function hasProfanity({ plainVariants, accentedVariants }) {
  return containsTerm(plainVariants, PLAIN_TERMS) || containsTerm(accentedVariants, ACCENTED_TERMS);
}

/* ------------------------- Spam / thông tin liên hệ ------------------------- */

const CONTACT_PATTERNS = [
  /(?:https?:\/\/|www\.)\S+/i, // đường dẫn
  /\b[a-z0-9-]+\.(?:com|net|org|vn|info|xyz|shop|store|biz|me|io|co|ly)\b/i, // tên miền trần
  /[\w.+-]+@[\w-]+\.[\w.-]+/, // email
  /(?<!\d)(?:\+?84|0)(?:[\s.\-]?\d){9}(?!\d)/, // số điện thoại VN
];

const hasContactInfo = (text) => {
  const t = text.normalize('NFKC');
  return CONTACT_PATTERNS.some((re) => re.test(t));
};

const ALLOWED_PUNCT = new Set([...'.,!?;:()-"\'…~’“”‘%+/&']);

/** Tỷ lệ ký tự "lạ" (không phải chữ/số/emoji/dấu câu thông dụng) trên tổng ký tự không khoảng trắng. */
function symbolNoiseRatio(text) {
  let total = 0;
  let noise = 0;
  for (const ch of text) {
    if (/\s/.test(ch)) continue;
    total += 1;
    if (/[\p{L}\p{N}]/u.test(ch) || /\p{Extended_Pictographic}/u.test(ch)) continue;
    if (ch === '\uFE0F' || ch === '\u200D' || ALLOWED_PUNCT.has(ch)) continue;
    noise += 1;
  }
  return total === 0 ? 0 : noise / total;
}

function hasAbnormalRepetition(text, tokens) {
  if (/(\S)\1{9,}/u.test(text)) return true; // 1 ký tự lặp >= 10 lần liên tiếp (cho phép "tuyệt vờiiiii" vừa phải)

  let run = 1;
  for (let i = 1; i < tokens.length; i += 1) {
    run = tokens[i] === tokens[i - 1] ? run + 1 : 1;
    if (run >= 5) return true; // "tốt tốt tốt tốt tốt"
  }
  if (tokens.length >= 8 && new Set(tokens).size / tokens.length <= 0.3) return true;
  return false;
}

/* ------------------------- Chuỗi ngẫu nhiên / vô nghĩa ------------------------- */

const VN_CLUSTERS = /ngh|ng|nh|ch|gh|gi|kh|ph|qu|th|tr/g; // phụ âm ghép tiếng Việt -> coi là 1 phụ âm
const VOWELS = 'aeiouy';
const LAUGH = /^(?:h[aeiou]|k[aeiou])+[hk]?$/; // hahaha, hihihi, kakaka
const ALLOWLIST = new Set(GIBBERISH_ALLOWLIST);

/** word: chỉ gồm a-z (đã bỏ dấu, hạ chữ thường). */
function isGibberishWord(word) {
  if (ALLOWLIST.has(word)) return false;
  const w = collapseRepeats(word);
  if (w.length < 4 || LAUGH.test(w)) return false;
  if (KEYBOARD_MASH.some((seq) => w.includes(seq))) return true; // asdfgh, qwerty...
  if (word.length < 5) return false;
  if (word.length >= 15) return true; // 1 "từ" dài bất thường
  if (/^(.{2,4})\1{2,}$/.test(word)) return true; // abcabcabc

  const squeezed = w.replace(VN_CLUSTERS, 'c');
  let run = 0;
  let maxRun = 0;
  let vowels = 0;
  for (const ch of squeezed) {
    if (VOWELS.includes(ch)) { vowels += 1; run = 0; } else { run += 1; if (run > maxRun) maxRun = run; }
  }
  if (vowels === 0) return true;
  if (maxRun >= 4) return true; // jbkfbibivkbdv -> "jbkfb" (5 phụ âm liền nhau)
  return squeezed.length >= 6 && vowels / squeezed.length < 0.2;
}

function hasGibberish(tokens) {
  const wordTokens = tokens.filter((t) => /\p{L}/u.test(t));
  const flagged = tokens.filter((t) => /^[a-z]+$/.test(t) && isGibberishWord(t));
  if (flagged.length === 0) return false;
  return (
    flagged.some((w) => w.length >= 8) ||
    flagged.length >= 2 ||
    flagged.length / Math.max(1, wordTokens.length) >= 0.4
  );
}

/* ------------------------------ Kiểm tra 1 trường ------------------------------ */

/** @returns {{ ok: true, clean: string } | { ok: false, reason: string }} */
function inspectText(text, spec) {
  const clean = sanitizeText(text);
  if (!clean) return { ok: false, reason: R.EMPTY };
  if (clean.length > spec.maxLength) return { ok: false, reason: R.TOO_LONG };

  const letters = (clean.match(/\p{L}/gu) ?? []).length;
  if (letters === 0) return { ok: false, reason: R.NO_LETTERS };
  if (letters < spec.minLetters) return { ok: false, reason: R.TOO_SHORT };

  const variants = buildSearchVariants(clean);
  if (hasProfanity(variants)) return { ok: false, reason: R.PROFANITY };
  if (hasContactInfo(clean)) return { ok: false, reason: R.CONTACT_INFO };
  if (symbolNoiseRatio(clean) > MAX_SYMBOL_NOISE_RATIO) return { ok: false, reason: R.SYMBOL_SPAM };
  if (hasAbnormalRepetition(clean, variants.plainTokens)) return { ok: false, reason: R.REPEATED };
  if (hasGibberish(variants.plainTokens)) return { ok: false, reason: R.GIBBERISH };

  return { ok: true, clean };
}

export const contentModerationService = {
  /**
   * Kiểm tra tiêu đề + nội dung đánh giá. Trường nào `undefined` thì bỏ qua (dùng cho cập nhật từng phần).
   * Hợp lệ -> trả về bản ĐÃ LÀM SẠCH (trim, gom khoảng trắng, bỏ ký tự vô hình) để lưu DB.
   * Vi phạm -> ném ValidationError, gộp lý do của cả tiêu đề và nội dung (nếu cùng sai).
   */
  moderateFeedback({ title, content } = {}) {
    const clean = {};
    const messages = [];

    for (const [field, value] of [['title', title], ['content', content]]) {
      if (value === undefined) continue;
      const spec = FIELD_SPECS[field];
      if (typeof value !== 'string') {
        messages.push(`${spec.label} đánh giá không hợp lệ.`);
        continue;
      }
      const result = inspectText(value, spec);
      if (result.ok) clean[field] = result.clean;
      else messages.push(REASON_MESSAGES[result.reason](spec));
    }

    if (messages.length > 0) throw new ValidationError(messages.join(' '));
    return clean;
  },

  /** Dùng cho test/debug: trả về lý do thay vì ném lỗi. */
  inspect(text, field = 'content') {
    return inspectText(text, FIELD_SPECS[field]);
  },
};

export default contentModerationService;
