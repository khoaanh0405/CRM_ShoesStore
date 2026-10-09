import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = { page: number; totalPages: number; totalItems: number; pageSize: number; onChange: (page: number) => void };

/** Dãy số trang có dấu "…" khi quá dài, vd: 1 … 4 5 6 … 12 */
function getPages(page: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (page >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => set.add(n));
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('gap');
    out.push(n);
  });
  return out;
}

export function Pagination({ page, totalPages, totalItems, onChange }: Props) {
  if (totalItems <= 0) return null;

  return (
    <nav className="pager" aria-label="Phân trang" style={{ justifyContent: 'center' }}>
      <div className="pager-list" style={{ justifyContent: 'center' }}>
        <button className="pager-btn" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Trang trước"><ChevronLeft size={18} /></button>
        {getPages(page, totalPages).map((p, i) => p === 'gap'
          ? <span key={`g${i}`} className="pager-gap">…</span>
          : <button key={p} className={`pager-btn${p === page ? ' active' : ''}`} onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined}>{p}</button>)}
        <button className="pager-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Trang sau"><ChevronRight size={18} /></button>
      </div>
    </nav>
  );
}