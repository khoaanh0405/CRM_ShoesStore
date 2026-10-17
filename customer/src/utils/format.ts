import { fullNameOf, type PersonName } from './name';

/** Tên có thể truyền vào dưới dạng chuỗi họ tên ("Nguyễn Văn An") hoặc đối tượng { firstName, lastName }. */
export type NameInput = string | PersonName | null | undefined;

export function formatPrice(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}₫`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function toDateInput(iso?: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

/** Tên gọi (từ cuối của Tên). Đối tượng: ưu tiên firstName; chuỗi: lấy từ cuối như trước. */
export function givenNameOf(name?: NameInput): string {
  const text = typeof name === 'object' && name !== null ? (name.firstName ?? '').trim() || fullNameOf(name) : (name ?? '');
  return text.trim().split(/\s+/).pop() ?? '';
}

/** Chữ cái đầu của Tên, dùng cho avatar. */
export function initialOf(name?: NameInput): string {
  const last = givenNameOf(name);
  return last ? last.charAt(0).toUpperCase() : '?';
}

export function formatDateOnly(value?: string | null): string {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
}
