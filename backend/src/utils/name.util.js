/**
 * Tiện ích xử lý họ tên theo quy ước Việt Nam:
 *   lastName  = Họ (kèm tên đệm), ví dụ "Nguyễn Văn"
 *   firstName = Tên,              ví dụ "An"
 *   Họ tên đầy đủ hiển thị = "<lastName> <firstName>" -> "Nguyễn Văn An"
 */

/** Chuẩn hóa 1 thành phần tên: trim + gộp khoảng trắng liên tiếp. undefined/null -> undefined. */
export function normalizeNamePart(value) {
  if (value === undefined || value === null) return undefined;
  return String(value).trim().replace(/\s+/g, ' ');
}

/** Ghép Họ + Tên thành họ tên đầy đủ. */
export function buildFullName(person) {
  return [person?.lastName, person?.firstName]
    .map((s) => (s ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

/** Trả về bản sao của đối tượng có thêm trường `fullName` (chỉ-đọc, suy ra từ lastName + firstName). */
export function withFullName(person) {
  return person ? { ...person, fullName: buildFullName(person) } : person;
}
