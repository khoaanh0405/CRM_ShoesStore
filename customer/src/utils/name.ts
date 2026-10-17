import { normalizeSpaces } from './validation';

/**
 * Họ tên theo quy ước Việt Nam:
 *   lastName  = Họ (kèm tên đệm), ví dụ "Nguyễn Văn"
 *   firstName = Tên,              ví dụ "An"
 *   Hiển thị  = "<lastName> <firstName>" -> "Nguyễn Văn An"
 */
export type PersonName = {
  firstName?: string | null;
  lastName?: string | null;
  /** Chỉ dùng làm dự phòng khi API trả sẵn họ tên ghép. */
  fullName?: string | null;
};

export const NAME_PART_MAX = 50;
const NAME_PART_REGEX = /^[\p{L}][\p{L}\s'.-]*$/u;

/** Họ tên đầy đủ để hiển thị ("" nếu không có thông tin). */
export function fullNameOf(p?: PersonName | null): string {
  if (!p) return '';
  const joined = [p.lastName, p.firstName].map((x) => (x ?? '').trim()).filter(Boolean).join(' ');
  return joined || (p.fullName ?? '').trim();
}

/** Kiểm tra 1 ô tên (Họ hoặc Tên): bắt buộc, tối đa 50 ký tự, chỉ gồm chữ cái (có dấu), khoảng trắng, ' . - */
export function validateNamePart(label: 'Họ' | 'Tên', value: string): string | null {
  const v = normalizeSpaces(value);
  if (!v) return `Vui lòng nhập ${label.toLowerCase()}.`;
  if (v.length > NAME_PART_MAX) return `${label} tối đa ${NAME_PART_MAX} ký tự.`;
  if (!NAME_PART_REGEX.test(v)) return `${label} chỉ được gồm chữ cái.`;
  return null;
}
