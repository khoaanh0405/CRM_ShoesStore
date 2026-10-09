import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Star, CheckCircle, XCircle, X, Send, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { getFeedbacks, updateFeedbackStatus } from '../../services/api';
import api from '../../utils/api';
import { useAuthStore } from '../../store/useAuthStore';
import { showConfirm } from '../../lib/dialog';
import type { Feedback, FeedbackStatus } from '../../types/feedback';
import Pagination from '../../components/Pagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import './FeedbacksPage.css';

type FilterTab = 'All' | FeedbackStatus;

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'Tất cả', value: 'All' },
  { label: 'Chờ duyệt', value: 'Pending' },
  { label: 'Đã duyệt', value: 'Approved' },
  { label: 'Từ chối', value: 'Rejected' },
];

const FEEDBACKS_PER_PAGE = 10;

const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="rating-stars">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={14}
        className={s <= rating ? 'star filled' : 'star empty'}
        fill={s <= rating ? '#F59E0B' : 'none'}
        stroke={s <= rating ? '#F59E0B' : '#CBD5E1'}
      />
    ))}
    <span className="rating-value">{rating}/5</span>
  </div>
);

const StatusBadge: React.FC<{ status: FeedbackStatus }> = ({ status }) => {
  const map = {
    Pending: { label: 'Chờ duyệt', cls: 'badge-pending' },
    Approved: { label: 'Đã duyệt', cls: 'badge-approved' },
    Rejected: { label: 'Từ chối', cls: 'badge-rejected' },
  };
  const { label, cls } = map[status];
  return <span className={`status-badge ${cls}`}>{label}</span>;
};

interface ReplyItem {
  replyId: number;
  accountId: number;
  content: string;
  createdAt: string;
  account?: { username: string };
}

// Modal chi tiết + trả lời đánh giá (ReviewReply)
const FeedbackModal: React.FC<{
  feedback: Feedback;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
  onRepliesChanged: () => void;
}> = ({ feedback, onClose, onApprove, onReject, loading, onRepliesChanged }) => {
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

  useEffect(() => { loadReplies(); }, [loadReplies]);

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chi tiết đánh giá</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="modal-meta">
            <div className="meta-row">
              <span className="meta-label">Khách hàng:</span>
              <span>{feedback.customer?.fullName ?? `KH #${feedback.customerId}`}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Sản phẩm:</span>
              <span>{feedback.product?.productName ?? `SP #${feedback.productId}`}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Đánh giá:</span>
              <RatingStars rating={feedback.rating} />
            </div>
            <div className="meta-row">
              <span className="meta-label">Trạng thái:</span>
              <StatusBadge status={feedback.status} />
            </div>
            <div className="meta-row">
              <span className="meta-label">Ngày gửi:</span>
              <span>{new Date(feedback.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          <div className="modal-content-section">
            <h4>{feedback.title}</h4>
            <p>{feedback.content}</p>
          </div>

          {feedback.imageUrl && (
            <div className="modal-image">
              <img src={feedback.imageUrl} alt="Ảnh đánh giá" />
            </div>
          )}

          {/* ===== Phản hồi của cửa hàng ===== */}
          <div className="reply-section">
            <h4 className="reply-title"><MessageSquare size={16} /> Phản hồi của cửa hàng ({replies.length})</h4>

            {replies.length === 0 && <p className="reply-empty">Chưa có phản hồi nào cho đánh giá này.</p>}

            {replies.map((r) => {
              const mine = r.accountId === me?.accountId;
              return (
                <div key={r.replyId} className="reply-item">
                  <div className="reply-head">
                    <b>{r.account?.username ?? 'Manager'}</b>
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
                <textarea
                  rows={3}
                  maxLength={2000}
                  placeholder="Nhập phản hồi gửi tới khách hàng..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button className="btn btn-approve reply-send" onClick={sendReply} disabled={sending}>
                  <Send size={15} /> {sending ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
              </div>
            ) : (
              <p className="reply-empty">
                {feedback.status === 'Pending'
                  ? 'Hãy duyệt đánh giá này trước, sau đó bạn mới có thể trả lời khách hàng.'
                  : 'Đánh giá đã bị từ chối nên không thể trả lời.'}
              </p>
            )}
          </div>
        </div>

        {feedback.status === 'Pending' && (
          <div className="modal-footer">
            <button className="btn btn-approve" onClick={onApprove} disabled={loading}>
              <CheckCircle size={16} />
              {loading ? 'Đang xử lý...' : 'Duyệt'}
            </button>
            <button className="btn btn-reject" onClick={onReject} disabled={loading}>
              <XCircle size={16} />
              {loading ? 'Đang xử lý...' : 'Từ chối'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const FeedbacksPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [newIds, setNewIds] = useState<Set<number>>(new Set()); // dòng vừa xuất hiện, tô sáng vài giây

  // Các feedbackId đã biết — null = chưa tải lần đầu (không báo "mới" cho lần tải đầu tiên)
  const knownIdsRef = useRef<Set<number> | null>(null);

  /** silent = true: dùng cho auto-refresh, không bật spinner, không báo lỗi. */
  const loadFeedbacks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getFeedbacks();
      const sorted = [...data].sort((a: Feedback, b: Feedback) => b.feedbackId - a.feedbackId);
      setFeedbacks(sorted);

      // Đồng bộ modal đang mở với dữ liệu mới nhất (vd. trạng thái vừa đổi ở nơi khác)
      setSelectedFeedback((prev) =>
        prev ? data.find((f: Feedback) => f.feedbackId === prev.feedbackId) ?? prev : prev,
      );

      // Phát hiện đánh giá mới khách vừa gửi
      const ids = new Set<number>(data.map((f: Feedback) => f.feedbackId));
      if (knownIdsRef.current) {
        const fresh = data.filter((f: Feedback) => !knownIdsRef.current!.has(f.feedbackId));
        if (fresh.length > 0) {
          toast.success(`📩 Có ${fresh.length} đánh giá mới từ khách hàng`, { duration: 4000 });
          const freshIds = new Set<number>(fresh.map((f: Feedback) => f.feedbackId));
          setNewIds(freshIds);
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

  // Real-time: tự cập nhật mỗi 5 giây, không cần reload trang
  useAutoRefresh(() => loadFeedbacks(true), 5000);

  const filtered =
    activeTab === 'All' ? feedbacks : feedbacks.filter((f) => f.status === activeTab);

  useEffect(() => { setCurrentPage(1); }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / FEEDBACKS_PER_PAGE));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedFeedbacks = filtered.slice(
    (currentPage - 1) * FEEDBACKS_PER_PAGE,
    currentPage * FEEDBACKS_PER_PAGE,
  );

  const counts = {
    All: feedbacks.length,
    Pending: feedbacks.filter((f) => f.status === 'Pending').length,
    Approved: feedbacks.filter((f) => f.status === 'Approved').length,
    Rejected: feedbacks.filter((f) => f.status === 'Rejected').length,
  };

  const handleStatusChange = async (feedback: Feedback, status: FeedbackStatus) => {
    setActionLoading(true);
    try {
      const updated = await updateFeedbackStatus(feedback.feedbackId, status);
      setFeedbacks((prev) =>
        prev.map((f) => (f.feedbackId === feedback.feedbackId ? { ...f, status: updated.status ?? status } : f)),
      );
      if (selectedFeedback?.feedbackId === feedback.feedbackId) {
        setSelectedFeedback((prev) => (prev ? { ...prev, status } : null));
      }
      toast.success(status === 'Approved' ? '✅ Đã duyệt đánh giá!' : '❌ Đã từ chối đánh giá!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Thao tác thất bại, vui lòng thử lại');
    } finally {
      setActionLoading(false);
    }
  };

  const isSuspicious = (f: Feedback) =>
    feedbacks.filter(
      (x) =>
        x.customerId === f.customerId &&
        x.status === 'Pending' &&
        Math.abs(new Date(x.createdAt).getTime() - new Date(f.createdAt).getTime()) < 10 * 60 * 1000,
    ).length >= 3;

  return (
    <div className="feedbacks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Đánh giá</h1>
          <p className="page-subtitle">Duyệt và quản lý đánh giá sản phẩm từ khách hàng theo thời gian thực</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`filter-tab ${activeTab === tab.value ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
            <span className="tab-count">{counts[tab.value]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Đang tải đánh giá...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Star size={48} strokeWidth={1} />
          <p>
            Không có đánh giá nào{' '}
            {activeTab !== 'All' ? `với trạng thái "${FILTER_TABS.find((t) => t.value === activeTab)?.label}"` : ''}
          </p>
        </div>
      ) : (
        <div className="feedbacks-table-wrapper">
          <table className="feedbacks-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Sản phẩm</th>
                <th>Khách hàng</th>
                <th>Tiêu đề</th>
                <th>Rating</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th className="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFeedbacks.map((fb, idx) => (
                <tr
                  key={fb.feedbackId}
                  className="feedback-row"
                  style={{
                    background: newIds.has(fb.feedbackId) ? '#F5F1FE' : undefined,
                    transition: 'background 0.6s ease',
                  }}
                >
                  <td className="col-index">{(currentPage - 1) * FEEDBACKS_PER_PAGE + idx + 1}</td>
                  <td className="col-product">
                    <span className="product-name">{fb.product?.productName ?? `SP #${fb.productId}`}</span>
                  </td>
                  <td className="col-customer">
                    <div className="customer-avatar">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fb.customer?.fullName ?? 'KH')}&background=8B5CF6&color=fff&size=32`}
                        alt=""
                      />
                      <span>{fb.customer?.fullName ?? `KH #${fb.customerId}`}</span>
                    </div>
                  </td>
                  <td className="col-title">
                    <span className="feedback-title" title={fb.title}>
                      {newIds.has(fb.feedbackId) && (
                        <span style={{ color: '#7C3AED', fontWeight: 700, marginRight: 4 }}>MỚI</span>
                      )}
                      {isSuspicious(fb) && <span style={{ color: '#DC2626', fontWeight: 700 }}>⚠ </span>}
                      {fb.title}
                      {((fb as any).replies?.length ?? 0) > 0 && (
                        <span style={{ marginLeft: 6, padding: '1px 8px', borderRadius: 999, background: '#DBEAFE', color: '#2563EB', fontSize: 11, fontWeight: 700 }}>Đã phản hồi</span>
                      )}
                    </span>
                  </td>
                  <td className="col-rating"><RatingStars rating={fb.rating} /></td>
                  <td className="col-date">{new Date(fb.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="col-status"><StatusBadge status={fb.status} /></td>
                  <td className="col-actions">
                    <div className="action-group">
                      <button className="action-btn view-btn" title="Xem chi tiết" onClick={() => setSelectedFeedback(fb)}>
                        Chi tiết
                      </button>
                      {fb.status === 'Pending' && (
                        <>
                          <button
                            className="action-btn approve-btn"
                            title="Duyệt đánh giá"
                            onClick={() => handleStatusChange(fb, 'Approved')}
                            disabled={actionLoading}
                          >
                            Duyệt
                          </button>
                          <button
                            className="action-btn reject-btn"
                            title="Từ chối đánh giá"
                            onClick={() => handleStatusChange(fb, 'Rejected')}
                            disabled={actionLoading}
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={FEEDBACKS_PER_PAGE}
            itemLabel="đánh giá"
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {selectedFeedback && (
        <FeedbackModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          onApprove={() => handleStatusChange(selectedFeedback, 'Approved')}
          onReject={() => handleStatusChange(selectedFeedback, 'Rejected')}
          loading={actionLoading}
          onRepliesChanged={() => loadFeedbacks(true)}
        />
      )}
    </div>
  );
};

export default FeedbacksPage;
