import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = { page: number; totalPages: number; onChange: (page: number) => void };

/** Dãy số trang có dấu "…" khi quá dài, vd: 1 … 4 5 6 … 12 */
function getPages(page: number, total: number): (number | 'gap')[] {
  const effectiveTotal = Math.max(1, total);
  if (effectiveTotal <= 7) return Array.from({ length: effectiveTotal }, (_, i) => i + 1);
  const set = new Set([1, effectiveTotal, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (page >= effectiveTotal - 2) [effectiveTotal - 1, effectiveTotal - 2, effectiveTotal - 3].forEach((n) => set.add(n));
  const nums = [...set].filter((n) => n >= 1 && n <= effectiveTotal).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('gap');
    out.push(n);
  });
  return out;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  const displayTotal = Math.max(1, totalPages);

  return (
    <nav className="pager" aria-label="Phân trang" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div className="pager-list" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="pager-btn" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Trang trước">
          <ChevronLeft size={18} />
        </button>
        {getPages(page, displayTotal).map((p, i) =>
          p === 'gap' ? (
            <span key={`g${i}`} className="pager-gap">…</span>
          ) : (
            <button
              key={p}
              className={`pager-btn${p === page ? ' active' : ''}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button className="pager-btn" onClick={() => onChange(page + 1)} disabled={page >= displayTotal} aria-label="Trang sau">
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}