/** 1450000 | "1450000.00" -> "1.450.000₫" */
export function formatPrice(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}₫`;
}

/** ISO string -> "dd/MM/yyyy" */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** ISO string -> "yyyy-MM-dd" (giá trị cho ô nhập ngày sinh). */
export function toDateInput(iso?: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

/** "Nguyễn Văn An" -> "A" (chữ cái đầu của tên gọi). */
export function initialOf(fullName?: string | null): string {
  const last = (fullName ?? '').trim().split(/\s+/).pop() ?? '';
  return last ? last.charAt(0).toUpperCase() : '?';
}

/** "Nguyễn Văn An" -> "An" */
export function givenNameOf(fullName?: string | null): string {
  return (fullName ?? '').trim().split(/\s+/).pop() ?? '';
}

/** "2003-05-20T00:00:00.000Z" | "2003-05-20" -> "20/05/2003" (không phụ thuộc múi giờ, dùng cho ngày sinh). */
export function formatDateOnly(value?: string | null): string {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
}
