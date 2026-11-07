import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Star, X, Send, Pencil, Trash2, MessageSquare, Eye, EyeOff, Search, Image as ImageIcon } from 'lucide-react';
import { getFeedbacks } from '../../services/api';
import api from '../../utils/api';
import { useAuthStore } from '../../store/useAuthStore';
import { showConfirm } from '../../lib/dialog';
import type { Feedback, FeedbackStatus } from '../../types/feedback';
import Pagination from '../../components/Pagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { fullNameOf, type PersonName } from '../../utils/name';
import './FeedbacksPage.css';

const FEEDBACKS_PER_PAGE = 10;

// ===== Tìm kiếm / lọc đánh giá (chạy trên danh sách đã tải) =====
type SearchableFeedback = Feedback & { replies?: unknown[] };

type SortKey = 'newest' | 'oldest' | 'ratingDesc' | 'ratingAsc';

/** Điều kiện tìm kiếm: chỉ áp dụng khi bấm nút "Tìm kiếm". Chuỗi rỗng = bỏ qua điều kiện đó. */
interface SearchCriteria {
  keyword: string; // khớp sản phẩm HOẶC nội dung HOẶC khách hàng
  status: '' | 'Approved' | 'Rejected';
  rating: '' | '1' | '2' | '3' | '4' | '5';
  replied: '' | 'yes' | 'no';
  dateFrom: string; // yyyy-MM-dd
  dateTo: string;
  sort: SortKey;
}

const EMPTY_CRITERIA: SearchCriteria = {
  keyword: '', status: '', rating: '', replied: '', dateFrom: '', dateTo: '', sort: 'newest',
};

/** Chữ thường + bỏ dấu tiếng Việt: "Giày" khớp với "giay". */
const normalizeText = (s: unknown): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const hasReplies = (fb: SearchableFeedback) => (fb.replies?.length ?? 0) > 0;

function matchesCriteria(fb: SearchableFeedback, c: SearchCriteria): boolean {
  const contains = (hay: string, needle: string) => !needle.trim() || normalizeText(hay).includes(normalizeText(needle));

  if (c.keyword.trim()) {
    const cust = fb.customer as any;
    const customerText = [fullNameOf(fb.customer), cust?.email, cust?.phone].filter(Boolean).join(' ');
    const hit =
      contains(fb.product?.productName ?? '', c.keyword) ||
      contains(fb.content ?? '', c.keyword) ||
      contains(customerText, c.keyword);
    if (!hit) return false;
  }
  if (c.status && fb.status !== c.status) return false;
  if (c.rating && fb.rating !== Number(c.rating)) return false;
  if (c.replied === 'yes' && !hasReplies(fb)) return false;
  if (c.replied === 'no' && hasReplies(fb)) return false;
  const created = new Date(fb.createdAt).getTime();
  if (c.dateFrom && created < new Date(`${c.dateFrom}T00:00:00`).getTime()) return false;
  if (c.dateTo && created > new Date(`${c.dateTo}T23:59:59.999`).getTime()) return false;
  return true;
}

function sortFeedbacks(list: FeedbackEx[], sort: SortKey): FeedbackEx[] {
  const arr = [...list];
  switch (sort) {
    case 'oldest': return arr.sort((a, b) => a.feedbackId - b.feedbackId);
    // mặc định (newest): mã lớn nhất lên đầu, giảm dần
    case 'ratingDesc': return arr.sort((a, b) => b.rating - a.rating || b.feedbackId - a.feedbackId);
    case 'ratingAsc': return arr.sort((a, b) => a.rating - b.rating || b.feedbackId - a.feedbackId);
    default: return arr.sort((a, b) => b.feedbackId - a.feedbackId);
  }
}

const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="rating-stars">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={14} className={s <= rating ? 'star filled' : 'star empty'}
        fill={s <= rating ? '#F59E0B' : 'none'} stroke={s <= rating ? '#F59E0B' : '#CBD5E1'} />
    ))}
    <span className="rating-value">{rating}/5</span>
  </div>
);

const StatusBadge: React.FC<{ status: FeedbackStatus }> = ({ status }) => {
  const map = {
    Pending: { label: 'Chờ xử lý (cũ)', cls: 'badge-pending' },
    Approved: { label: 'Đang hiển thị', cls: 'badge-approved' },
    Rejected: { label: 'Đã ẩn', cls: 'badge-rejected' },
  };
  const { label, cls } = map[status];
  return <span className={`status-badge ${cls}`}>{label}</span>;
};

/** Phản hồi của cửa hàng (ReviewReply) — người trả lời là Employee. */
interface ReplyItem {
  replyId: number;
  employeeId: number;
  content: string;
  createdAt: string;
  employee?: PersonName & { employeeId: number; employeeCode?: string };
}

type FeedbackEx = Feedback & {
  replies?: ReplyItem[];
  handler?: (PersonName & { employeeId: number; employeeCode?: string }) | null;
  handledAt?: string | null;
};

// ===== SUB FORM: chi tiết + trả lời đánh giá =====
const FeedbackDetailPanel: React.FC<{
  feedback: FeedbackEx;
  onRepliesChanged: () => void;
  onToggleHidden: () => void;
  busy: boolean;
}> = ({ feedback, onRepliesChanged, onToggleHidden, busy }) => {
  const me = useAuthStore((s) => s.user);
  const [replies, setReplies] = useState<ReplyItem[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const loadReplies = useCallback(async () => {
    try {
      const res = await api.get(`/feedbacks/${feedback.feedbackId}/replies`);
      setReplies(res.data?.data ?? res.data ?? []);
    } catch { /* bỏ qua */ }
  }, [feedback.feedbackId]);

  // Đổi đánh giá được chọn: reset form và tải lại phản hồi
  useEffect(() => {
    setReplies([]);
    setText('');
    setEditingId(null);
    loadReplies();
  }, [loadReplies]);

  const sendReply = async () => {
    if (!text.trim()) return void toast.error('Vui lòng nhập nội dung phản hồi.');
    setSending(true);
    try {
      await api.post(`/feedbacks/${feedback.feedbackId}/replies`, { content: text.trim() });
      toast.success('Đã gửi phản hồi cho khách hàng');
      setText('');
      await loadReplies();
      onRepliesChanged();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Gửi phản hồi thất bại');
    } finally { setSending(false); }
  };

  const saveEdit = async (replyId: number) => {
    if (!editText.trim()) return void toast.error('Nội dung không được để trống.');
    try {
      await api.put(`/replies/${replyId}`, { content: editText.trim() });
      toast.success('Đã cập nhật phản hồi');
      setEditingId(null);
      await loadReplies();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Cập nhật thất bại');
    }
  };

  const removeReply = async (replyId: number) => {
    const ok = await showConfirm({ title: 'Xóa phản hồi?', message: 'Phản hồi này sẽ bị xóa.', confirmLabel: 'Xóa', tone: 'warning', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/replies/${replyId}`);
      toast.success('Đã xóa phản hồi');
      await loadReplies();
      onRepliesChanged();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Xóa thất bại');
    }
  };

  const customerName = fullNameOf(feedback.customer) || `KH #${feedback.customerId}`;

  return (
    <>
      <div className="fb-detail-head">
        <img
          className="fb-detail-avatar"
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=8B5CF6&color=fff&size=96`}
          alt=""
        />
        <div className="fb-detail-head__info">
          <div className="fb-detail-name">{customerName}</div>
          <div className="fb-detail-sub">
            <StatusBadge status={feedback.status} />
            <span>{new Date(feedback.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      <div className="fb-detail-body">
        <div className="modal-meta">
          <div className="meta-row"><span className="meta-label">Sản phẩm:</span><span>{feedback.product?.productName ?? `SP #${feedback.productId}`}</span></div>
          <div className="meta-row"><span className="meta-label">Đánh giá:</span><RatingStars rating={feedback.rating} /></div>
          {feedback.handler && (
            <div className="meta-row">
              <span className="meta-label">Người xử lý:</span>
              <span>{fullNameOf(feedback.handler)}{feedback.handledAt ? ` · ${new Date(feedback.handledAt).toLocaleString('vi-VN')}` : ''}</span>
            </div>
          )}
        </div>

        <div className="modal-content-section">
          <p>{feedback.content}</p>
        </div>

        {feedback.imageUrl && (
          <div className="modal-content-section">
            <h4>Hình ảnh khách hàng đính kèm</h4>
            <a className="modal-image" href={feedback.imageUrl} target="_blank" rel="noreferrer" title="Bấm để xem ảnh gốc">
              <img src={feedback.imageUrl} alt="Ảnh đánh giá" />
            </a>
          </div>
        )}

        {/* ===== Phản hồi của cửa hàng ===== */}
        <div className="reply-section">
          <h4 className="reply-title"><MessageSquare size={16} /> Phản hồi của cửa hàng ({replies.length})</h4>

          {replies.length === 0 && <p className="reply-empty">Chưa có phản hồi nào cho đánh giá này.</p>}

          {replies.map((r) => {
            const mine = r.employeeId === me?.accountId; // employeeId = accountId
            return (
              <div key={r.replyId} className="reply-item">
                <div className="reply-head">
                  <b>{fullNameOf(r.employee) || 'Manager'}</b>
                  <span>{new Date(r.createdAt).toLocaleString('vi-VN')}</span>
                  {mine && editingId !== r.replyId && (
                    <span className="reply-actions">
                      <button title="Sửa" onClick={() => { setEditingId(r.replyId); setEditText(r.content); }}><Pencil size={13} /></button>
                      <button title="Xóa" className="danger" onClick={() => removeReply(r.replyId)}><Trash2 size={13} /></button>
                    </span>
                  )}
                </div>
                {editingId === r.replyId ? (
                  <div className="reply-edit">
                    <textarea rows={3} value={editText} maxLength={2000} onChange={(e) => setEditText(e.target.value)} />
                    <div className="reply-edit-btns">
                      <button className="btn btn-reject" onClick={() => setEditingId(null)}>Hủy</button>
                      <button className="btn btn-approve" onClick={() => saveEdit(r.replyId)}>Lưu</button>
                    </div>
                  </div>
                ) : (
                  <p className="reply-content">{r.content}</p>
                )}
              </div>
            );
          })}

          {feedback.status === 'Approved' ? (
            <div className="reply-form">
              <textarea rows={3} maxLength={2000} placeholder="Nhập phản hồi gửi tới khách hàng..." value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn btn-approve reply-send" onClick={sendReply} disabled={sending}>
                <Send size={15} /> {sending ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          ) : (
            <p className="reply-empty">
              {feedback.status === 'Pending'
                ? 'Đánh giá cũ này chưa được đăng công khai nên chưa thể trả lời.'
                : 'Đánh giá này đang bị ẩn nên không thể trả lời. Hãy hiện lại đánh giá nếu muốn phản hồi.'}
            </p>
          )}
        </div>
      </div>

      <div className="fb-detail-footer">
        {feedback.status === 'Rejected' ? (
          <button className="btn btn-approve" onClick={onToggleHidden} disabled={busy}>
            <Eye size={16} />{busy ? 'Đang xử lý...' : 'Hiện lại đánh giá'}
          </button>
        ) : (
          <button className="btn btn-reject" onClick={onToggleHidden} disabled={busy}>
            <EyeOff size={16} />{busy ? 'Đang xử lý...' : 'Ẩn đánh giá'}
          </button>
        )}
      </div>
    </>
  );
};

const FeedbacksPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackEx[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [busyId, setBusyId] = useState<number | null>(null);

  // Gõ/chọn vào `draft`, chỉ áp dụng (`applied`) khi bấm nút "Tìm kiếm".
  const [draft, setDraft] = useState<SearchCriteria>(EMPTY_CRITERIA);
  const [applied, setApplied] = useState<SearchCriteria>(EMPTY_CRITERIA);

  const knownIdsRef = useRef<Set<number> | null>(null);

  /** silent = true: dùng cho auto-refresh. */
  const loadFeedbacks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data: FeedbackEx[] = await getFeedbacks();
      const sorted = [...data].sort((a, b) => b.feedbackId - a.feedbackId);
      setFeedbacks(sorted);

      const ids = new Set<number>(sorted.map((f) => f.feedbackId));
      if (knownIdsRef.current) {
        const fresh = sorted.filter((f) => !knownIdsRef.current!.has(f.feedbackId));
        if (fresh.length > 0) {
          toast.success(`📩 Có ${fresh.length} đánh giá mới từ khách hàng`, { duration: 4000 });
          setNewIds(new Set<number>(fresh.map((f) => f.feedbackId)));
          setTimeout(() => setNewIds(new Set()), 6000);
        }
      }
      knownIdsRef.current = ids;
    } catch {
      if (!silent) toast.error('Không thể tải danh sách đánh giá');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeedbacks(); }, [loadFeedbacks]);
  useAutoRefresh(() => loadFeedbacks(true), 5000);

  const filtered = useMemo(
    () => sortFeedbacks(feedbacks.filter((f) => matchesCriteria(f, applied)), applied.sort),
    [feedbacks, applied],
  );

  useEffect(() => { setCurrentPage(1); }, [applied]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / FEEDBACKS_PER_PAGE));
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [totalPages, currentPage]);

  const paginatedFeedbacks = filtered.slice((currentPage - 1) * FEEDBACKS_PER_PAGE, currentPage * FEEDBACKS_PER_PAGE);

  // Form phụ luôn có một đánh giá được chọn (mặc định: dòng đầu tiên của kết quả lọc)
  useEffect(() => {
    if (loading) return;
    if (!filtered.some((f) => f.feedbackId === selectedId)) {
      setSelectedId(filtered[0]?.feedbackId ?? null);
    }
  }, [filtered, selectedId, loading]);

  const selectedFeedback = useMemo(
    () => feedbacks.find((f) => f.feedbackId === selectedId) ?? null,
    [feedbacks, selectedId],
  );

  /** Ô từ khóa: chỉ lưu nháp, áp dụng khi bấm "Tìm kiếm". */
  const setKeyword = (value: string) => setDraft((prev) => ({ ...prev, keyword: value }));

  /** Bộ lọc nâng cao: áp dụng ngay khi chọn. */
  const setFilter = <K extends keyof SearchCriteria>(key: K, value: SearchCriteria[K]) => {
    const next = { ...draft, [key]: value };
    if (next.dateFrom && next.dateTo && next.dateFrom > next.dateTo) {
      setDraft(next);
      return void toast.error('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
    }
    setDraft(next);
    setApplied((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setApplied((prev) => ({ ...prev, keyword: draft.keyword }));
  };
  const handleClearKeyword = () => {
    setDraft((prev) => ({ ...prev, keyword: '' }));
    setApplied((prev) => ({ ...prev, keyword: '' }));
  };

  /** Ẩn đánh giá (có xác nhận) hoặc hiện lại. Backend: PATCH /feedbacks/:id/visibility { hidden }. */
  const toggleHidden = async (fb: FeedbackEx) => {
    const hide = fb.status !== 'Rejected';
    if (hide) {
      const ok = await showConfirm({
        title: 'Ẩn đánh giá?',
        message: 'Đánh giá sẽ không còn hiển thị công khai trên website. Bạn có thể hiện lại bất cứ lúc nào.',
        confirmLabel: 'Ẩn', tone: 'warning', danger: true,
      });
      if (!ok) return;
    }
    setBusyId(fb.feedbackId);
    try {
      await api.patch(`/feedbacks/${fb.feedbackId}/visibility`, { hidden: hide });
      toast.success(hide ? 'Đã ẩn đánh giá' : 'Đã hiện lại đánh giá');
      await loadFeedbacks(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Thao tác thất bại, vui lòng thử lại');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="feedbacks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Đánh giá</h1>
          <p className="page-subtitle">Chọn đánh giá ở danh sách để xem chi tiết và phản hồi khách hàng</p>
        </div>
      </div>

      {!loading && feedbacks.length > 0 && (
        <div className="filter-block">
          <form className="filter-search-row" onSubmit={handleSearch}>
            <label className="fb-search">
              <Search size={16} className="fb-search__icon" />
              <input
                type="text"
                className="fb-search__input"
                placeholder="Tìm sản phẩm, nội dung, khách hàng..."
                value={draft.keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              {draft.keyword && (
                <button type="button" className="fb-search__clear" onClick={handleClearKeyword} title="Xóa từ khóa">
                  <X size={14} />
                </button>
              )}
            </label>
            <button type="submit" className="fb-search__submit">
              <Search size={16} />
              Tìm kiếm
            </button>
          </form>

          <div className="filter-adv-row">
            <select className="fb-select" value={draft.status} onChange={(e) => setFilter('status', e.target.value as SearchCriteria['status'])}>
              <option value="">Tất cả trạng thái</option>
              <option value="Approved">Đang hiển thị</option>
              <option value="Rejected">Đã ẩn</option>
            </select>
            <select className="fb-select" value={draft.rating} onChange={(e) => setFilter('rating', e.target.value as SearchCriteria['rating'])}>
              <option value="">Tất cả số sao</option>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}
            </select>
            <select className="fb-select" value={draft.replied} onChange={(e) => setFilter('replied', e.target.value as SearchCriteria['replied'])}>
              <option value="">Tất cả phản hồi</option>
              <option value="yes">Đã phản hồi</option>
              <option value="no">Chưa phản hồi</option>
            </select>
            <select className="fb-select" value={draft.sort} onChange={(e) => setFilter('sort', e.target.value as SortKey)}>
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="ratingDesc">Số sao cao → thấp</option>
              <option value="ratingAsc">Số sao thấp → cao</option>
            </select>
            <div className="date-range">
              <span className="date-range__label">Từ ngày</span>
              <input type="date" className="date-pill" value={draft.dateFrom} max={draft.dateTo || undefined}
                onChange={(e) => setFilter('dateFrom', e.target.value)} />
              <span className="date-range__label">đến</span>
              <input type="date" className="date-pill" value={draft.dateTo} min={draft.dateFrom || undefined}
                onChange={(e) => setFilter('dateTo', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Đang tải đánh giá...</p></div>
      ) : feedbacks.length === 0 ? (
        <div className="empty-state">
          <Star size={48} strokeWidth={1} />
          <p>Chưa có đánh giá nào</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Search size={48} strokeWidth={1} />
          <p>Không tìm thấy đánh giá phù hợp</p>
        </div>
      ) : (
        <div className="fb-layout">
          {/* ===== MAIN: danh sách ===== */}
          <section className="fb-main">
            <div className="fb-main__title">Danh sách đánh giá <span className="fb-muted">({filtered.length})</span></div>
            <div className="feedbacks-table-wrapper">
              <table className="feedbacks-table">
                <thead>
                  <tr>
                    <th>Mã</th><th>Sản phẩm</th><th>Khách hàng</th><th>Rating</th><th>Ngày gửi</th><th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFeedbacks.map((fb) => {
                    const isNew = newIds.has(fb.feedbackId);
                    const name = fullNameOf(fb.customer) || `KH #${fb.customerId}`;
                    return (
                      <tr
                        key={fb.feedbackId}
                        className={`feedback-row ${fb.status === 'Rejected' ? 'hidden-row' : ''} ${fb.feedbackId === selectedId ? 'is-selected' : ''} ${isNew ? 'is-new' : ''}`}
                        onClick={() => setSelectedId(fb.feedbackId)}
                      >
                        <td className="col-index">#{fb.feedbackId}</td>
                        <td className="col-product">
                          <span className="product-name" title={fb.product?.productName}>{fb.product?.productName ?? `SP #${fb.productId}`}</span>
                          <span className="feedback-title" title={fb.content}>
                            {isNew && <span className="tag-new">MỚI</span>}
                            {fb.content}
                            {fb.imageUrl && <span style={{ marginLeft: 6, display: 'inline-flex', verticalAlign: 'middle', color: '#7C3AED' }} title="Có ảnh đính kèm"><ImageIcon size={14} /></span>}
                            {(fb.replies?.length ?? 0) > 0 && <span className="tag-replied">Đã phản hồi</span>}
                          </span>
                        </td>
                        <td className="col-customer">
                          <div className="customer-avatar">
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5CF6&color=fff&size=32`} alt="" />
                            <span>{name}</span>
                          </div>
                        </td>
                        <td className="col-rating"><RatingStars rating={fb.rating} /></td>
                        <td className="col-date">{new Date(fb.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td className="col-status"><StatusBadge status={fb.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={FEEDBACKS_PER_PAGE} itemLabel="đánh giá" onPageChange={setCurrentPage} />
          </section>

          {/* ===== SUB: chi tiết ===== */}
          <aside className="fb-sub">
            {selectedFeedback ? (
              <FeedbackDetailPanel
                feedback={selectedFeedback}
                onRepliesChanged={() => loadFeedbacks(true)}
                onToggleHidden={() => toggleHidden(selectedFeedback)}
                busy={busyId === selectedFeedback.feedbackId}
              />
            ) : (
              <div className="fb-detail-empty">
                <MessageSquare size={44} strokeWidth={1} />
                <p>Chọn một đánh giá để xem chi tiết</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default FeedbacksPage;
