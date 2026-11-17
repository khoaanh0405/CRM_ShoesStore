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

/** Độ dài tối đa của Họ hoặc Tên (khớp maxLength ở các ô nhập). */
export const NAME_PART_MAX = 50;

const NAME_PART_RE = /^[\p{L}][\p{L}\s'’.-]*$/u;

/**
 * Kiểm tra Họ hoặc Tên: bắt buộc, tối đa NAME_PART_MAX ký tự,
 * chỉ gồm chữ cái (có dấu), khoảng trắng, dấu nháy ', dấu chấm và gạch ngang; phải bắt đầu bằng chữ cái.
 * @param label nhãn dùng trong thông báo, vd: 'Họ' | 'Tên'
 */
export function validateNamePart(label: string, value: string): string | null {
  const v = value.trim().replace(/\s+/g, ' ');
  if (!v) return `Vui lòng nhập ${label.toLowerCase()}.`;
  if (v.length > NAME_PART_MAX) return `${label} tối đa ${NAME_PART_MAX} ký tự.`;
  if (!NAME_PART_RE.test(v)) return `${label} chỉ được gồm chữ cái, không chứa số hoặc ký tự đặc biệt.`;
  return null;
}

