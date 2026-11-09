import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Search, X, Users, Heart, Calendar, ClipboardList, Star, MessageSquare, Download, Phone, Mail, Cake,
} from 'lucide-react';
import { getCustomers, getFeedbacks, getSurveys } from '../../services/api';
import api from '../../utils/api';
import Pagination from '../../components/Pagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { fullNameOf } from '../../utils/name';
import { AGE_BUCKETS, getAge, preferenceTagOf } from '../../utils/customerStats';
import './CustomerReport.css';

type TabKey = 'PROFILE' | 'AGE' | 'PREF';

interface Group { key: string; label: string; members: any[] }
interface SurveyAnswered { surveyId: number; title: string; at?: string | null }
interface ReviewItem { feedbackId: number; productName: string; rating: number; title?: string; at?: string | null }
interface CustomerRow {
  customer: any;
  id: number;
  name: string;
  gender: string;
  surveys: SurveyAnswered[];
  reviews: ReviewItem[];
  avgRating: number | null;
}

const PER_PAGE = 8;

const TABS: Record<TabKey, { label: string; listTitle: string; icon: any }> = {
  PROFILE: { label: 'Hồ sơ & mức độ tương tác', listTitle: 'Giới tính', icon: Users },
  AGE: { label: 'Độ tuổi', listTitle: 'Nhóm tuổi', icon: Calendar },
  PREF: { label: 'Sở thích sản phẩm', listTitle: 'Sở thích', icon: Heart },
};

const UNDER_18 = { label: 'Dưới 18', min: 0, max: 17 };
const UNKNOWN = { label: 'Chưa rõ' };
const REPORT_BUCKETS = [UNDER_18, ...AGE_BUCKETS];
const GENDER_ORDER = ['Nam', 'Nữ', 'Khác', 'Chưa rõ'];

/** Chữ thường + bỏ dấu tiếng Việt. */
const normalizeText = (s: unknown): string =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();

const bucketLabelOf = (c: any): string => {
  const age = getAge(c.dateOfBirth);
  if (age === null) return UNKNOWN.label;
  return REPORT_BUCKETS.find((b) => age >= b.min && age <= b.max)?.label ?? UNKNOWN.label;
};
const genderLabelOf = (c: any): string => (c.gender || '').trim() || 'Chưa rõ';
const pct = (n: number, total: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const prefTagsOf = (c: any): string[] => Array.from(new Set<string>((c.preferences ?? []).map(preferenceTagOf).filter(Boolean)));
const unwrap = (res: any): any[] => {
  const d = res?.data?.data ?? res?.data ?? [];
  return Array.isArray(d) ? d : [];
};

/** Tìm kiếm chính xác:
 *  - "18" hoặc "18 tuổi" (1–3 chữ số, không bắt đầu bằng 0) → đúng 18 tuổi
 *  - 4 chữ số trong khoảng 1900 → năm hiện tại → đúng năm sinh
 *  - chuỗi số khác (VD: 0901...) → SĐT chứa dãy số đó
 *  - còn lại → tên hoặc email chứa từ khóa */
const matchesKeyword = (c: any, kw: string) => {
  if (!kw) return true;

  const ageQuery = kw.match(/^([1-9]\d{0,2})\s*(tuoi)?$/);
  if (ageQuery) {
    const age = getAge(c.dateOfBirth);
    return age !== null && age === Number(ageQuery[1]);
  }

  if (/^\d{4}$/.test(kw) && Number(kw) >= 1900 && Number(kw) <= new Date().getFullYear()) {
    return !!c.dateOfBirth && new Date(c.dateOfBirth).getFullYear() === Number(kw);
  }

  if (/^\d+$/.test(kw)) return (c.phone ?? '').replace(/\s/g, '').includes(kw);

  return normalizeText(fullNameOf(c)).includes(kw) || normalizeText(c.email).includes(kw);
};

/* ================= Xuất Excel (không cần thư viện ngoài) ================= */
type Cell = string | number | null | undefined;
interface Sheet { name: string; headers: string[]; rows: Cell[][]; widths?: number[] }

const xmlEsc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const downloadExcel = (filename: string, sheets: Sheet[]) => {
  const cell = (v: Cell, style = '') =>
    typeof v === 'number'
      ? `<Cell${style}><Data ss:Type="Number">${v}</Data></Cell>`
      : `<Cell${style}><Data ss:Type="String">${xmlEsc(v)}</Data></Cell>`;
  const body = sheets.map((s) => `
    <Worksheet ss:Name="${xmlEsc(s.name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31))}">
      <Table>
        ${(s.widths ?? s.headers.map(() => 120)).map((w) => `<Column ss:Width="${w}"/>`).join('')}
        <Row>${s.headers.map((h) => cell(h, ' ss:StyleID="h"')).join('')}</Row>
        ${s.rows.map((r) => `<Row>${r.map((v) => cell(v)).join('')}</Row>`).join('')}
      </Table>
    </Worksheet>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles><Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/></Style></Styles>${body}
</Workbook>`;
  const url = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/* ================= Thành phần dùng chung ================= */
const Stars: React.FC<{ value: number }> = ({ value }) => (
  <span className="cr-stars" title={`${value}/5`}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={12} fill={s <= Math.round(value) ? '#16A34A' : 'none'} stroke={s <= Math.round(value) ? '#16A34A' : '#CBD5E1'} />
    ))}
  </span>
);

const PagerFoot: React.FC<{ page: number; totalItems: number; onPage: (p: number) => void }> = ({ page, totalItems, onPage }) => (
  <div className="cr-card-foot">
    <Pagination
      currentPage={page}
      totalPages={Math.max(1, Math.ceil(totalItems / PER_PAGE))}
      totalItems={totalItems}
      itemsPerPage={PER_PAGE}
      itemLabel="khách hàng"
      onPageChange={onPage}
    />
  </div>
);

/* ================= Tab: Độ tuổi / Sở thích ================= */
const GroupDetail: React.FC<{
  group: Group; total: number; members: any[]; page: number; onPage: (p: number) => void; highlightPref: boolean;
}> = ({ group, total, members, page, onPage, highlightPref }) => {
  const rows = members.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  return (
    <section className="cr-card">
      <header className="cr-card-head">
        <h2 className="cr-card-title">{group.label}</h2>
        <p className="cr-card-sub">
          <b>{group.members.length}</b> khách hàng · chiếm <b>{pct(group.members.length, total)}%</b> tổng số
        </p>
      </header>
      {group.members.length === 0 ? (
        <div className="cr-empty">Chưa có khách hàng nào trong nhóm này.</div>
      ) : (
        <>
          <div className="cr-table-wrap">
            <table className="cr-table">
              <thead>
                <tr><th>STT</th><th>Họ tên</th><th>Ngày sinh</th><th>Giới tính</th><th>SĐT</th><th>Email</th><th>Sở thích</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="cr-table-empty">Không tìm thấy khách hàng phù hợp</td></tr>
                ) : rows.map((c, idx) => {
                  const age = getAge(c.dateOfBirth);
                  const tags = prefTagsOf(c);
                  return (
                    <tr key={c.customerId}>
                      <td className="cr-muted">{(page - 1) * PER_PAGE + idx + 1}</td>
                      <td className="cr-strong">{fullNameOf(c) || '—'}</td>
                      <td>
                        <div>{fmtDate(c.dateOfBirth)}</div>
                        {age !== null && age >= 0 && <div className="cr-muted cr-small">{age} tuổi</div>}
                      </td>
                      <td>{c.gender || '—'}</td>
                      <td className="cr-nowrap">{c.phone || '—'}</td>
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
          <PagerFoot page={page} totalItems={members.length} onPage={onPage} />
        </>
      )}
    </section>
  );
};

/* ================= Tab: Hồ sơ & mức độ tương tác ================= */
const CustomerDetail: React.FC<{ row: CustomerRow }> = ({ row }) => {
  const c = row.customer;
  const age = getAge(c.dateOfBirth);
  const tags = prefTagsOf(c);
  return (
    <div className="cr-sub">
      <div className="cr-sub-hero">
        <div className="cr-sub-avatar">{(row.name || '?').charAt(0).toUpperCase()}</div>
        <div className="cr-sub-hero-info">
          <h3 className="cr-sub-name">{row.name || '—'}</h3>
          <div className="cr-sub-badges">
            <span className="cr-tag">{row.gender}</span>
            {age !== null && age >= 0 && <span className="cr-muted cr-small">{age} tuổi</span>}
          </div>
        </div>
      </div>

      <div className="cr-sub-body">
        <div className="cr-sub-contact">
          <div><Phone size={14} /> <span>{c.phone || 'Chưa cập nhật'}</span></div>
          <div><Mail size={14} /> <span>{c.email || 'Chưa cập nhật'}</span></div>
          <div><Cake size={14} /> <span>{c.dateOfBirth ? fmtDate(c.dateOfBirth) : 'Chưa cập nhật'}</span></div>
        </div>
        {tags.length > 0 && <div className="cr-chips cr-sub-prefs">{tags.map((t) => <span key={t} className="cr-chip">{t}</span>)}</div>}

        <div className="cr-sub-stats">
          <div className="cr-sub-stat"><b>{row.surveys.length}</b><span>Khảo sát đã trả lời</span></div>
          <div className="cr-sub-stat"><b>{row.reviews.length}</b><span>Lượt đánh giá</span></div>
          <div className="cr-sub-stat"><b>{row.avgRating !== null ? row.avgRating.toFixed(1) : '—'}</b><span>Điểm trung bình</span></div>
        </div>

        <section className="cr-sub-section">
          <h4><ClipboardList size={15} /> Khảo sát đã trả lời ({row.surveys.length})</h4>
          {row.surveys.length === 0 ? <p className="cr-sub-empty">Khách hàng chưa trả lời khảo sát nào.</p> : (
            <ul className="cr-mini-list">
              {row.surveys.map((s) => (
                <li key={s.surveyId}>
                  <span className="cr-mini-main">{s.title}</span>
                  <span className="cr-muted cr-small">{fmtDate(s.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cr-sub-section">
          <h4><MessageSquare size={15} /> Đánh giá sản phẩm ({row.reviews.length})</h4>
          {row.reviews.length === 0 ? <p className="cr-sub-empty">Khách hàng chưa đánh giá sản phẩm nào.</p> : (
            <ul className="cr-mini-list">
              {row.reviews.map((f) => (
                <li key={f.feedbackId}>
                  <span className="cr-mini-main">
                    {f.productName}
                    <span className="cr-mini-stars"><Stars value={f.rating} /></span>
                    {f.title && <span className="cr-muted cr-small cr-mini-title">{f.title}</span>}
                  </span>
                  <span className="cr-muted cr-small">{fmtDate(f.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

const ProfileView: React.FC<{
  rows: CustomerRow[]; allRows: CustomerRow[]; gender: string; onGender: (g: string) => void;
  page: number; onPage: (p: number) => void; selectedId: number | null; onSelect: (id: number) => void;
}> = ({ rows, allRows, gender, onGender, page, onPage, selectedId, onSelect }) => {
  const genderStats = useMemo(() => {
    const map = new Map<string, number>();
    allRows.forEach((r) => map.set(r.gender, (map.get(r.gender) ?? 0) + 1));
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => (GENDER_ORDER.indexOf(a.label) + 1 || 99) - (GENDER_ORDER.indexOf(b.label) + 1 || 99));
  }, [allRows]);

  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0] ?? null;

  return (
    <div className="cr-main-sub">
      <section className="cr-card">
        <header className="cr-card-head">
          <h2 className="cr-card-title">Danh sách khách hàng</h2>
          <div className="cr-gender-pills">
            <button type="button" className={`cr-pill ${gender === 'ALL' ? 'active' : ''}`} onClick={() => onGender('ALL')}>
              Tất cả <b>{allRows.length}</b>
            </button>
            {genderStats.map((g) => (
              <button
                key={g.label}
                type="button"
                className={`cr-pill ${gender === g.label ? 'active' : ''}`}
                onClick={() => onGender(g.label)}
              >
                {g.label} <b>{g.count}</b>
              </button>
            ))}
          </div>
        </header>

        <div className="cr-table-wrap">
          <table className="cr-table cr-table-select">
            <thead>
              <tr><th>Mã KH</th><th>Khách hàng</th><th>Giới tính</th><th className="cr-num">Khảo sát</th><th className="cr-num">Đánh giá</th></tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={5} className="cr-table-empty">Không có khách hàng phù hợp</td></tr>
              ) : pageRows.map((r) => (
                <tr key={r.id} className={selected?.id === r.id ? 'is-selected' : ''} onClick={() => onSelect(r.id)}>
                  <td className="cr-muted cr-nowrap">#{r.id}</td>
                  <td>
                    <div className="cr-strong">{r.name || '—'}</div>
                    <div className="cr-muted cr-small">{r.customer.email || r.customer.phone || '—'}</div>
                  </td>
                  <td><span className="cr-tag">{r.gender}</span></td>
                  <td className="cr-num">{r.surveys.length > 0 ? <b>{r.surveys.length}</b> : <span className="cr-muted">0</span>}</td>
                  <td className="cr-num">
                    {r.reviews.length > 0 ? (
                      <span className="cr-rev"><b>{r.reviews.length}</b>{r.avgRating !== null && <span className="cr-muted cr-small">★ {r.avgRating.toFixed(1)}</span>}</span>
                    ) : <span className="cr-muted">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PagerFoot page={page} totalItems={rows.length} onPage={onPage} />
      </section>

      <aside className="cr-card cr-sub-card">
        {selected ? <CustomerDetail key={selected.id} row={selected} /> : <div className="cr-empty">Chọn một khách hàng để xem chi tiết.</div>}
      </aside>
    </div>
  );
};

/* ================= Trang chính ================= */
const CustomerReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [surveyMap, setSurveyMap] = useState<Map<number, SurveyAnswered[]>>(new Map());

  const [tab, setTab] = useState<TabKey>('PROFILE');
  const [draft, setDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [gender, setGender] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Record<'AGE' | 'PREF', string | null>>({ AGE: null, PREF: null });

  const load = useCallback(async (silent = false) => {
    try {
      const [cs, fbs, surveys] = await Promise.all([
        getCustomers(),
        getFeedbacks().catch(() => []),
        getSurveys().catch(() => []),
      ]);
      setCustomers(cs);
      setFeedbacks(fbs as any[]);

      const answered = (surveys as any[]).filter((s) => (s._count?.surveyResponses ?? 0) > 0);
      const lists = await Promise.all(
        answered.map((s) =>
          api.get(`/surveys/${s.surveyId}/responses`)
            .then((res) => ({ survey: s, items: unwrap(res) }))
            .catch(() => ({ survey: s, items: [] as any[] })),
        ),
      );
      const map = new Map<number, SurveyAnswered[]>();
      lists.forEach(({ survey, items }) => {
        items.forEach((it) => {
          const cid = it.customerId ?? it.customer?.customerId;
          if (cid == null) return;
          const arr = map.get(cid) ?? [];
          if (arr.some((x) => x.surveyId === survey.surveyId)) return;
          arr.push({ surveyId: survey.surveyId, title: survey.title, at: it.submittedAt ?? it.createdAt ?? null });
          map.set(cid, arr);
        });
      });
      setSurveyMap(map);
    } catch {
      if (!silent) toast.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(() => load(true), 10000);

  const total = customers.length;
  const kw = normalizeText(keyword);

  /* ----- dữ liệu ----- */
  const allRows: CustomerRow[] = useMemo(() => {
    const fbBy = new Map<number, ReviewItem[]>();
    feedbacks.forEach((f) => {
      const arr = fbBy.get(f.customerId) ?? [];
      arr.push({
        feedbackId: f.feedbackId,
        productName: f.product?.productName ?? `SP #${f.productId}`,
        rating: Number(f.rating) || 0,
        title: f.title,
        at: f.createdAt,
      });
      fbBy.set(f.customerId, arr);
    });
    return customers
      .map((c) => {
        const reviews = (fbBy.get(c.customerId) ?? []).sort((a, b) => b.feedbackId - a.feedbackId);
        return {
          customer: c,
          id: c.customerId as number,
          name: fullNameOf(c) || c.username || '',
          gender: genderLabelOf(c),
          surveys: surveyMap.get(c.customerId) ?? [],
          reviews,
          avgRating: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null,
        };
      })
      .sort((a, b) => b.id - a.id);
  }, [customers, feedbacks, surveyMap]);

  const profileRows = useMemo(
    () => allRows.filter((r) => (gender === 'ALL' || r.gender === gender) && matchesKeyword(r.customer, kw)),
    [allRows, gender, kw],
  );

  const ageGroups: Group[] = useMemo(
    () =>
      [...REPORT_BUCKETS, UNKNOWN]
        .map((b) => ({ key: b.label, label: b.label, members: customers.filter((c) => bucketLabelOf(c) === b.label) }))
        .filter((g) => g.members.length > 0 || AGE_BUCKETS.some((x) => x.label === g.label)),
    [customers],
  );

  const prefGroups: Group[] = useMemo(() => {
    const map = new Map<string, any[]>();
    customers.forEach((c) => prefTagsOf(c).forEach((t) => map.set(t, [...(map.get(t) ?? []), c])));
    return Array.from(map, ([label, members]) => ({ key: label, label, members }))
      .sort((a, b) => b.members.length - a.members.length || a.label.localeCompare(b.label, 'vi'));
  }, [customers]);

  const listTab: 'AGE' | 'PREF' = tab === 'PREF' ? 'PREF' : 'AGE';
  const groups = listTab === 'AGE' ? ageGroups : prefGroups;
  // Khi đang tìm kiếm: mỗi nhóm chỉ giữ khách khớp từ khóa, ẩn nhóm không có ai.
  const viewGroups: Group[] = useMemo(
    () => groups.map((g) => ({ ...g, members: kw ? g.members.filter((c) => matchesKeyword(c, kw)) : g.members })),
    [groups, kw],
  );
  const shownGroups = kw ? viewGroups.filter((g) => g.members.length > 0) : viewGroups;
  const active = shownGroups.find((g) => g.key === selectedGroup[listTab]) ?? shownGroups[0] ?? null;
  const groupMembers = active ? active.members : [];

  const listLength = tab === 'PROFILE' ? profileRows.length : groupMembers.length;
  const totalPages = Math.max(1, Math.ceil(listLength / PER_PAGE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  /* ----- thao tác ----- */
  const changeTab = (k: TabKey) => { setTab(k); setPage(1); };
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setKeyword(draft); setPage(1); };
  const handleClear = () => { setDraft(''); setKeyword(''); setPage(1); };
  const chooseGender = (g: string) => { setGender(g); setPage(1); };
  const chooseGroup = (key: string) => { setSelectedGroup((s) => ({ ...s, [listTab]: key })); setPage(1); };

  /** Xuất toàn bộ báo cáo (giới tính, độ tuổi, sở thích, khảo sát, đánh giá) trong 1 file, theo từ khóa đang áp dụng. */
  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const list = allRows.filter(
      (r) => (tab !== 'PROFILE' || gender === 'ALL' || r.gender === gender) && matchesKeyword(r.customer, kw),
    );
    if (list.length === 0) return void toast.error('Không có dữ liệu để xuất');
    const n = list.length;

    // Giới tính
    const genderMap = new Map<string, number>();
    list.forEach((r) => genderMap.set(r.gender, (genderMap.get(r.gender) ?? 0) + 1));
    const genderX = [...genderMap.entries()].sort(
      (a, b) => (GENDER_ORDER.indexOf(a[0]) + 1 || 99) - (GENDER_ORDER.indexOf(b[0]) + 1 || 99),
    );

    // Độ tuổi
    const ageOrder = [...REPORT_BUCKETS.map((b) => b.label), UNKNOWN.label];
    const ageMap = new Map<string, CustomerRow[]>(ageOrder.map((l) => [l, []]));
    list.forEach((r) => (ageMap.get(bucketLabelOf(r.customer)) ?? ageMap.get(UNKNOWN.label)!).push(r));
    const ageX = ageOrder.map((label) => ({ label, members: ageMap.get(label)! })).filter((g) => g.members.length > 0);

    // Sở thích
    const prefMap = new Map<string, CustomerRow[]>();
    list.forEach((r) => prefTagsOf(r.customer).forEach((t) => prefMap.set(t, [...(prefMap.get(t) ?? []), r])));
    const prefX = Array.from(prefMap, ([label, members]) => ({ label, members }))
      .sort((a, b) => b.members.length - a.members.length || a.label.localeCompare(b.label, 'vi'));

    const ageOf = (r: CustomerRow) => {
      const a = getAge(r.customer.dateOfBirth);
      return a !== null && a >= 0 ? a : '';
    };
    const detailRow = (label: string, r: CustomerRow, i: number): Cell[] => [
      label, i + 1, r.name, fmtDate(r.customer.dateOfBirth), ageOf(r), r.gender,
      r.customer.phone ?? '', r.customer.email ?? '', prefTagsOf(r.customer).join('; '),
    ];
    const detailHeaders = (first: string) => [first, 'STT', 'Họ tên', 'Ngày sinh', 'Tuổi', 'Giới tính', 'SĐT', 'Email', 'Sở thích'];
    const detailWidths = [160, 40, 160, 90, 50, 70, 100, 190, 260];

    downloadExcel(`BaoCaoKhachHang_${stamp}.xls`, [
      {
        name: 'Tổng hợp',
        headers: ['Chỉ tiêu', 'Nhóm', 'Số khách hàng', 'Tỷ lệ (%)'],
        widths: [110, 200, 110, 90],
        rows: [
          ['Tổng khách hàng', 'Tất cả', n, 100] as Cell[],
          ...genderX.map(([l, c]) => ['Giới tính', l, c, pct(c, n)] as Cell[]),
          ...ageX.map((g) => ['Độ tuổi', g.label, g.members.length, pct(g.members.length, n)] as Cell[]),
          ...prefX.map((g) => ['Sở thích', g.label, g.members.length, pct(g.members.length, n)] as Cell[]),
        ],
      },
      {
        name: 'Khách hàng',
        headers: ['STT', 'Họ tên', 'Giới tính', 'Ngày sinh', 'Tuổi', 'Nhóm tuổi', 'SĐT', 'Email', 'Sở thích', 'Số khảo sát đã trả lời', 'Danh sách khảo sát', 'Số lượt đánh giá', 'Điểm đánh giá TB'],
        widths: [40, 160, 70, 90, 50, 90, 100, 190, 220, 110, 320, 100, 100],
        rows: list.map((r, i) => [
          i + 1, r.name, r.gender, fmtDate(r.customer.dateOfBirth), ageOf(r), bucketLabelOf(r.customer),
          r.customer.phone ?? '', r.customer.email ?? '', prefTagsOf(r.customer).join('; '),
          r.surveys.length, r.surveys.map((x) => x.title).join('; '), r.reviews.length,
          r.avgRating !== null ? Math.round(r.avgRating * 10) / 10 : '',
        ]),
      },
      {
        name: 'Theo độ tuổi',
        headers: detailHeaders('Nhóm tuổi'),
        widths: detailWidths,
        rows: ageX.flatMap((g) => g.members.map((r, i) => detailRow(g.label, r, i))),
      },
      {
        name: 'Theo sở thích',
        headers: detailHeaders('Sở thích'),
        widths: detailWidths,
        rows: prefX.flatMap((g) => g.members.map((r, i) => detailRow(g.label, r, i))),
      },
      {
        name: 'Khảo sát đã trả lời',
        headers: ['Khách hàng', 'Giới tính', 'Khảo sát', 'Ngày trả lời'],
        widths: [160, 70, 320, 100],
        rows: list.flatMap((r) => r.surveys.map((x) => [r.name, r.gender, x.title, fmtDate(x.at)])),
      },
      {
        name: 'Đánh giá sản phẩm',
        headers: ['Khách hàng', 'Giới tính', 'Sản phẩm', 'Số sao', 'Tiêu đề', 'Ngày đánh giá'],
        widths: [160, 70, 200, 60, 260, 100],
        rows: list.flatMap((r) => r.reviews.map((f) => [r.name, r.gender, f.productName, f.rating, f.title ?? '', fmtDate(f.at)])),
      },
    ]);
    toast.success('Đã xuất file Excel');
  };

  if (loading) return <div className="cr-loading">Đang tải dữ liệu báo cáo...</div>;

  return (
    <div className="cr-page">
      <div className="cr-header-section">
        <div>
          <h1 className="cr-title">Báo cáo khách hàng</h1>
          <p className="cr-subtitle">Phân tích hồ sơ, sở thích và mức độ tương tác của khách hàng</p>
        </div>
      </div>

      <div className="cr-tabs" role="tablist" aria-label="Loại báo cáo">
        {(Object.keys(TABS) as TabKey[]).map((k) => {
          const Icon = TABS[k].icon;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={`cr-tab ${tab === k ? 'cr-tab--active' : ''}`}
              onClick={() => changeTab(k)}
            >
              <Icon size={15} />
              <span>{TABS[k].label}</span>
            </button>
          );
        })}
      </div>

      <div className="cr-toolbar">
        <form className="cr-search-form" onSubmit={handleSearch}>
          <label className="cr-search">
            <Search size={16} className="cr-search__icon" />
            <input
              type="text"
              className="cr-search__input"
              placeholder="Tìm tên, email, SĐT hoặc tuổi (VD: 18)..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            {draft && (
              <button type="button" className="cr-search__reset" onClick={handleClear} title="Xóa từ khóa">
                <X size={13} />
              </button>
            )}
          </label>
          <button type="submit" className="cr-search__submit"><Search size={16} /> Tìm kiếm</button>
        </form>
        <button type="button" className="cr-export-btn" onClick={handleExport}>
          <Download size={16} /> Xuất Excel
        </button>
      </div>

      {total === 0 ? (
        <div className="cr-empty cr-empty-page">Chưa có khách hàng nào để thống kê.</div>
      ) : tab === 'PROFILE' ? (
        <ProfileView
          rows={profileRows}
          allRows={allRows}
          gender={gender}
          onGender={chooseGender}
          page={page}
          onPage={setPage}
          selectedId={selectedCustomer}
          onSelect={setSelectedCustomer}
        />
      ) : (
        <div className="cr-vertical-layout">
          <aside className="cr-card cr-groups-top">
            <div className="cr-groups-head">
              <span>{TABS[tab].listTitle}</span>
              <span className="cr-muted">{total} khách hàng</span>
            </div>

            <ul className="cr-group-pills">
              {shownGroups.length === 0 ? (
                <li className="cr-empty">{kw ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có dữ liệu.'}</li>
              ) : shownGroups.map((g) => {
                const p = pct(g.members.length, total);
                return (
                  <li key={g.key}>
                    <button
                      type="button"
                      className={`cr-group-pill ${active?.key === g.key ? 'active' : ''}`}
                      onClick={() => chooseGroup(g.key)}
                    >
                      <span className="cr-group-name">{g.label}</span>
                      <span className="cr-group-num"><b>{g.members.length}</b> ({p}%)</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {active ? (
            <GroupDetail
              key={`${tab}-${active.key}`}
              group={active}
              total={total}
              members={groupMembers}
              page={page}
              onPage={setPage}
              highlightPref={tab === 'PREF'}
            />
          ) : (
            <div className="cr-card cr-empty">{kw ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có dữ liệu.'}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerReport;
