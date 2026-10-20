import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, X } from 'lucide-react';
import { getCustomers } from '../../services/api';
import Pagination from '../../components/Pagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { fullNameOf } from '../../utils/name';
import { AGE_BUCKETS, getAge, preferenceTagOf } from '../../utils/customerStats';
import './CustomerReport.css';

type TabKey = 'AGE' | 'PREF';

interface Group {
  key: string;
  label: string;
  color: string;
  members: any[];
}

const ITEMS_PER_PAGE = 6; // vừa chiều cao ô trái (ô trái là chuẩn, ô phải theo ô trái)

const TABS: Record<TabKey, { label: string; listTitle: string; hint: string }> = {
  AGE: { label: 'Tỷ lệ độ tuổi', listTitle: 'Nhóm tuổi', hint: 'Chọn một nhóm tuổi để xem những khách hàng thuộc nhóm đó.' },
  PREF: { label: 'Sở thích', listTitle: 'Sở thích', hint: 'Chọn một sở thích để xem những khách hàng yêu thích loại giày đó.' },
};

/** Báo cáo có thêm nhóm "Dưới 18" và "Chưa rõ" để tổng các nhóm luôn khớp tổng khách hàng. */
const UNDER_18 = { label: 'Dưới 18', min: 0, max: 17, color: '#8B5CF6' };
const UNKNOWN = { label: 'Chưa rõ', color: '#94A3B8' };
const REPORT_BUCKETS = [UNDER_18, ...AGE_BUCKETS];
const PREF_COLOR = '#8B5CF6';

const bucketLabelOf = (c: any): string => {
  const age = getAge(c.dateOfBirth);
  if (age === null) return UNKNOWN.label;
  return REPORT_BUCKETS.find((b) => age >= b.min && age <= b.max)?.label ?? UNKNOWN.label;
};

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const prefTagsOf = (c: any): string[] => Array.from(new Set<string>((c.preferences ?? []).map(preferenceTagOf).filter(Boolean)));

/* ==========================================================
   Chi tiết một nhóm: danh sách khách hàng thuộc nhóm đã chọn
   (được remount theo group.key nên ô tìm kiếm / trang tự đặt lại)
   ========================================================== */
const GroupDetail: React.FC<{ group: Group; total: number; highlightPref: boolean }> = ({ group, total, highlightPref }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const k = search.trim().toLowerCase();
    if (!k) return group.members;
    return group.members.filter(
      (c) =>
        fullNameOf(c).toLowerCase().includes(k) ||
        (c.phone ?? '').includes(k) ||
        (c.email ?? '').toLowerCase().includes(k),
    );
  }, [group.members, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const rows = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <section className="cr-detail">
      <div className="cr-detail-inner">
      <header className="cr-detail-head">
        <div>
          <h2 className="cr-detail-title">
            <i className="cr-dot cr-dot-lg" style={{ background: group.color }} />
            {group.label}
          </h2>
          <p className="cr-detail-sub">
            <b>{group.members.length}</b> khách hàng · chiếm <b>{pct(group.members.length, total)}%</b> tổng số khách hàng
          </p>
        </div>
        {group.members.length > 0 && (
          <label className="cr-search">
            <Search size={16} />
            <input
              placeholder="Tìm tên, email, SĐT..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button type="button" className="cr-search-reset" onClick={() => { setSearch(''); setPage(1); }} title="Xóa từ khóa">
                <X size={12} />
              </button>
            )}
          </label>
        )}
      </header>

      {group.members.length === 0 ? (
        <div className="cr-empty">Chưa có khách hàng nào trong nhóm này.</div>
      ) : (
        <>
          <div className="cr-table-wrap">
            <table className="cr-table">
              <thead>
                <tr>
                  <th>STT</th><th>Họ tên</th><th>Ngày sinh</th><th>Giới tính</th><th>SĐT</th><th>Email</th><th>Sở thích</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="cr-table-empty">Không tìm thấy khách hàng phù hợp</td></tr>
                ) : rows.map((c, idx) => {
                  const age = getAge(c.dateOfBirth);
                  const tags = prefTagsOf(c);
                  return (
                    <tr key={c.customerId}>
                      <td className="cr-muted">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                      <td className="cr-strong">{fullNameOf(c) || '—'}</td>
                      <td>
                        <div>{fmtDate(c.dateOfBirth)}</div>
                        {age !== null && age >= 0 && <div className="cr-muted cr-age">{age} tuổi</div>}
                      </td>
                      <td>{c.gender || '—'}</td>
                      <td>{c.phone || '—'}</td>
                      <td>{c.email || '—'}</td>
                      <td>
                        {tags.length === 0 ? <span className="cr-muted">—</span> : (
                          <div className="cr-chips">
                            {tags.map((t) => (
                              <span key={t} className={`cr-chip ${highlightPref && t === group.label ? 'cr-chip-hit' : ''}`}>{t}</span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="cr-detail-foot">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemLabel="khách hàng"
              onPageChange={setPage}
            />
          </div>
        </>
      )}
      </div>
    </section>
  );
};

/* ==========================================================
   Trang báo cáo
   ========================================================== */
const CustomerReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tab, setTab] = useState<TabKey>('AGE');
  const [selected, setSelected] = useState<Record<TabKey, string | null>>({ AGE: null, PREF: null });

  const load = useCallback(async (silent = false) => {
    try {
      setCustomers(await getCustomers());
    } catch {
      if (!silent) toast.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(() => load(true), 5000);

  const total = customers.length;

  const ageGroups: Group[] = useMemo(
    () =>
      [...REPORT_BUCKETS, UNKNOWN]
        .map((b) => ({ key: b.label, label: b.label, color: b.color, members: customers.filter((c) => bucketLabelOf(c) === b.label) }))
        // Luôn hiện 4 nhóm chính; "Dưới 18" / "Chưa rõ" chỉ hiện khi có khách
        .filter((g) => g.members.length > 0 || AGE_BUCKETS.some((x) => x.label === g.label)),
    [customers],
  );

  const prefGroups: Group[] = useMemo(() => {
    const map = new Map<string, any[]>();
    customers.forEach((c) => prefTagsOf(c).forEach((t) => map.set(t, [...(map.get(t) ?? []), c])));
    return Array.from(map, ([label, members]) => ({ key: label, label, color: PREF_COLOR, members }))
      .sort((a, b) => b.members.length - a.members.length || a.label.localeCompare(b.label, 'vi'));
  }, [customers]);

  const groups = tab === 'AGE' ? ageGroups : prefGroups;
  const active = groups.find((g) => g.key === selected[tab]) ?? groups[0] ?? null;
  const select = (key: string) => setSelected((s) => ({ ...s, [tab]: key }));

  if (loading) return <div className="cr-loading">Đang tải dữ liệu...</div>;

  return (
    <div className="cr-page">
      <h1 className="cr-title">Báo cáo khách hàng</h1>
      <p className="cr-subtitle">{TABS[tab].hint}</p>

      <div className="cr-tabs" role="tablist" aria-label="Loại báo cáo">
        {(Object.keys(TABS) as TabKey[]).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className={`cr-tab ${tab === k ? 'cr-tab--active' : ''}`}
            onClick={() => setTab(k)}
          >
            {TABS[k].label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <div className="cr-empty cr-empty-page">Chưa có khách hàng nào để thống kê.</div>
      ) : (
        <div className="cr-layout">
          {/* Cột trái: các nhóm */}
          <aside className="cr-groups">
            <div className="cr-groups-inner">
            <div className="cr-groups-head">
              <span>{TABS[tab].listTitle}</span>
              <span className="cr-muted">{total} khách hàng</span>
            </div>

            {tab === 'AGE' && (
              <div className="cr-stack" aria-hidden="true">
                {ageGroups.filter((g) => g.members.length > 0).map((g) => (
                  <span
                    key={g.key}
                    className={`cr-stack-seg ${active?.key === g.key ? 'is-active' : ''}`}
                    style={{ width: `${pct(g.members.length, total)}%`, background: g.color }}
                    title={`${g.label}: ${g.members.length} khách (${pct(g.members.length, total)}%)`}
                    onClick={() => select(g.key)}
                  />
                ))}
              </div>
            )}

            <ul className="cr-group-list">
              {groups.length === 0 ? (
                <li className="cr-empty">Chưa có dữ liệu sở thích.</li>
              ) : groups.map((g) => {
                const p = pct(g.members.length, total);
                return (
                  <li key={g.key}>
                    <button
                      type="button"
                      className={`cr-group ${active?.key === g.key ? 'active' : ''}`}
                      onClick={() => select(g.key)}
                    >
                      <span className="cr-group-top">
                        <span className="cr-group-name"><i className="cr-dot" style={{ background: g.color }} />{g.label}</span>
                        <span className="cr-group-num"><b>{g.members.length}</b> khách</span>
                      </span>
                      <span className="cr-group-bar"><span style={{ width: `${p}%`, background: g.color }} /></span>
                      <span className="cr-group-pct">{p}% tổng số khách hàng</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            </div>
          </aside>

          {/* Cột phải: khách hàng thuộc nhóm đang chọn */}
          {active ? (
            <GroupDetail key={`${tab}-${active.key}`} group={active} total={total} highlightPref={tab === 'PREF'} />
          ) : (
            <div className="cr-empty cr-detail">Chưa có dữ liệu.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerReport;
