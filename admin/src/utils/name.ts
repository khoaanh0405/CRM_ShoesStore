/**
 * Họ tên theo quy ước Việt Nam:
 *   lastName  = Họ (kèm tên đệm), ví dụ "Nguyễn Văn"
 *   firstName = Tên,              ví dụ "An"
 *   Hiển thị  = "<lastName> <firstName>" -> "Nguyễn Văn An"
 */
export type PersonName = {
  firstName?: string | null;
  lastName?: string | null;
  /** Chỉ dùng làm dự phòng khi API trả sẵn họ tên ghép (chỉ-đọc, backend suy ra từ lastName + firstName). */
  fullName?: string | null;
  /** Hồ sơ nhân sự lồng bên trong (vd survey.creator.employee). */
  employee?: PersonName | null;
};

/** Họ tên đầy đủ để hiển thị. Trả về chuỗi rỗng nếu không có thông tin để caller tự chọn giá trị thay thế. */
export function fullNameOf(p?: PersonName | null): string {
  if (!p) return '';
  const joined = [p.lastName, p.firstName].map((x) => (x ?? '').trim()).filter(Boolean).join(' ');
  if (joined) return joined;
  const fallback = (p.fullName ?? '').trim();
  if (fallback) return fallback;
  return p.employee ? fullNameOf(p.employee) : '';
}

/** So sánh theo Tên trước, rồi tới Họ (cách xếp tên người Việt). */
export function compareByName(a: PersonName, b: PersonName): number {
  return (a.firstName ?? '').localeCompare(b.firstName ?? '', 'vi') || (a.lastName ?? '').localeCompare(b.lastName ?? '', 'vi');
}
