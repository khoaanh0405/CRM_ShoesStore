import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Star, CheckCircle, XCircle, X } from 'lucide-react';
import { getFeedbacks, updateFeedbackStatus } from '../services/api';
import type { Feedback, FeedbackStatus } from '../types/feedback';
import Pagination from '../components/Pagination';
import './FeedbacksPage.css';

type FilterTab = 'All' | FeedbackStatus;

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'Tất cả', value: 'All' },
  { label: 'Chờ duyệt', value: 'Pending' },
  { label: 'Đã duyệt', value: 'Approved' },
  { label: 'Từ chối', value: 'Rejected' },
];

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

// Modal xem chi tiết
const FeedbackModal: React.FC<{
  feedback: Feedback;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}> = ({ feedback, onClose, onApprove, onReject, loading }) => (
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
      </div>

      {feedback.status === 'Pending' && (
        <div className="modal-footer">
          <button
            className="btn btn-approve"
            onClick={onApprove}
            disabled={loading}
          >
            <CheckCircle size={16} />
            {loading ? 'Đang xử lý...' : 'Duyệt'}
          </button>
          <button
            className="btn btn-reject"
            onClick={onReject}
            disabled={loading}
          >
            <XCircle size={16} />
            {loading ? 'Đang xử lý...' : 'Từ chối'}
          </button>
        </div>
      )}
    </div>
  </div>
);

const FeedbacksPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const data = await getFeedbacks();
      setFeedbacks(data);
    } catch {
      toast.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const filtered =
    activeTab === 'All' ? feedbacks : feedbacks.filter((f) => f.status === activeTab);

  // Pagination for feedbacks (10 items per page)
  const FEEDBACKS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / FEEDBACKS_PER_PAGE));
  const paginatedFeedbacks = filtered.slice(
    (currentPage - 1) * FEEDBACKS_PER_PAGE,
    currentPage * FEEDBACKS_PER_PAGE
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
        prev.map((f) => (f.feedbackId === feedback.feedbackId ? { ...f, status: updated.status ?? status } : f))
      );
      if (selectedFeedback?.feedbackId === feedback.feedbackId) {
        setSelectedFeedback((prev) => prev ? { ...prev, status } : null);
      }
      toast.success(status === 'Approved' ? '✅ Đã duyệt đánh giá!' : '❌ Đã từ chối đánh giá!');
    } catch {
      toast.error('Thao tác thất bại, vui lòng thử lại');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="feedbacks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Đánh giá</h1>
          <p className="page-subtitle">Duyệt và quản lý đánh giá sản phẩm từ khách hàng</p>
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
          <p>Không có đánh giá nào {activeTab !== 'All' ? `với trạng thái "${FILTER_TABS.find(t => t.value === activeTab)?.label}"` : ''}</p>
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
                <tr key={fb.feedbackId} className="feedback-row">
                  <td className="col-index">{(currentPage - 1) * FEEDBACKS_PER_PAGE + idx + 1}</td>
                  <td className="col-product">
                    <span className="product-name">
                      {fb.product?.productName ?? `SP #${fb.productId}`}
                    </span>
                  </td>
                  <td className="col-customer">
                    <div className="customer-avatar">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fb.customer?.fullName ?? 'KH')}&background=1EAD5D&color=fff&size=32`}
                        alt=""
                      />
                      <span>{fb.customer?.fullName ?? `KH #${fb.customerId}`}</span>
                    </div>
                  </td>
                  <td className="col-title">
                    <span className="feedback-title" title={fb.title}>{fb.title}</span>
                  </td>
                  <td className="col-rating">
                    <RatingStars rating={fb.rating} />
                  </td>
                  <td className="col-date">
                    {new Date(fb.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="col-status">
                    <StatusBadge status={fb.status} />
                  </td>
                  <td className="col-actions">
                    <div className="action-group">
                      <button
                        className="action-btn view-btn"
                        title="Xem chi tiết"
                        onClick={() => setSelectedFeedback(fb)}
                      >
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

      {/* Modal */}
      {selectedFeedback && (
        <FeedbackModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          onApprove={() => handleStatusChange(selectedFeedback, 'Approved')}
          onReject={() => handleStatusChange(selectedFeedback, 'Rejected')}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default FeedbacksPage;
