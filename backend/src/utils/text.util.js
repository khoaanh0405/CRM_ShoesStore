/**
 * Tiện ích xử lý chuỗi — logic kỹ thuật thuần túy, KHÔNG chứa quy tắc nghiệp vụ.
 * Dùng cho bộ lọc nội dung nhưng có thể tái sử dụng ở domain khác.
 */

const ZERO_WIDTH_ALL = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g;
const ZERO_WIDTH_STORE = /[\u200B\u200C\u2060\uFEFF\u00AD]/g; // giữ ZWJ để không vỡ emoji ghép
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const COMBINING_MARKS = /[\u0300-\u036F]/g;
// Ký tự chèn GIỮA hai chữ cái để né lọc: c.h.ó, d-i-t, d*i*t ...
const JOINERS = /(?<=\p{L})[.\-_*+|~`'’,^\\/·•](?=\p{L})/gu;
// Leet-speak: d1t, l0n, d!t, @ ...  (chỉ đổi khi sát chữ cái, để không đụng vào số thuần như "42")
const LEET_MAP = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' };
const LEET_NEAR_LETTER = /(?<=\p{L})[013457@$!]+|[013457@$!]+(?=\p{L})/gu;

/** Làm sạch nội dung để LƯU: NFC, bỏ ký tự vô hình/điều khiển, gom khoảng trắng thừa, trim. */
export function sanitizeText(text) {
  return String(text ?? '')
    .normalize('NFC')
    .replace(ZERO_WIDTH_STORE, '')
    .replace(CONTROL_CHARS, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\u00A0]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** "Đẹp lắm" -> "Dep lam" (giữ nguyên hoa/thường; gọi toLowerCase trước nếu cần). */
export function stripDiacritics(text) {
  return text.normalize('NFD').replace(COMBINING_MARKS, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

/** "địttttt" -> "dịt" : gom mọi chuỗi chữ cái lặp liên tiếp thành 1 ký tự. */
export function collapseRepeats(text) {
  return text.replace(/(\p{L})\1+/gu, '$1');
}

/** Tách từ: mọi ký tự không phải chữ/số coi như dấu ngăn cách. */
export function tokenize(text) {
  return text.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(Boolean);
}

/** ["d","i","t","me"] -> ["dit","me"] : ghép các chữ cái đứng riêng lẻ liên tiếp (>= 2). */
export function mergeSingleLetters(tokens) {
  const out = [];
  let run = [];
  const flush = () => {
    if (run.length >= 2) out.push(run.join(''));
    else out.push(...run);
    run = [];
  };
  for (const t of tokens) {
    if (/^\p{L}$/u.test(t)) run.push(t);
    else { flush(); out.push(t); }
  }
  flush();
  return out;
}

/**
 * Chuẩn hóa 1 đoạn văn thành nhiều "biến thể" để dò từ cấm.
 * Mỗi biến thể là chuỗi đã bọc khoảng trắng hai đầu để so khớp nguyên từ bằng includes(` ${từ} `).
 *  - plainVariants   : đã hạ chữ thường, bỏ dấu, gom ký tự lặp; gồm bản gốc, bản bỏ ký tự chèn,
 *                      bản ghép chữ cái rời, bản giải leet-speak.
 *  - accentedVariants: giữ dấu (chỉ có khi người dùng thật sự gõ có dấu).
 *  - plainTokens     : token bỏ dấu, CHƯA gom lặp (dùng cho phân tích spam/vô nghĩa).
 */
export function buildSearchVariants(raw) {
  const base = String(raw ?? '').normalize('NFKC').replace(ZERO_WIDTH_ALL, '').toLowerCase();
  const plain = stripDiacritics(base);
  const hasDiacritics = plain !== base;

  const pad = (tokens) => ` ${tokens.map(collapseRepeats).join(' ')} `;
  const dropJoiners = (s) => s.replace(JOINERS, '');
  const plainTokens = tokenize(plain);

  const plainVariants = [
    pad(plainTokens),
    pad(tokenize(dropJoiners(plain))),
    pad(mergeSingleLetters(plainTokens)),
    pad(tokenize(plain.replace(LEET_NEAR_LETTER, (m) => [...m].map((c) => LEET_MAP[c]).join('')))),
  ];
  const accentedVariants = hasDiacritics ? [pad(tokenize(base)), pad(tokenize(dropJoiners(base)))] : [];

  return { plainVariants, accentedVariants, hasDiacritics, plainTokens };
}
