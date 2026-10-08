import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus, FileText, Users, MessageSquare, Power, PowerOff, X, ChevronRight, Search, Package,
} from 'lucide-react';
import { getSurveys, toggleSurveyActive } from '../../services/api';
import type { Survey } from '../../types/survey';
import Pagination from '../../components/Pagination';
import CreateSurveyModal from '../../components/CreateSurveyModal';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import './SurveysPage.css';

type ProductLite = { productId: number; productName: string; brand?: string | null };
type SurveyItem = Survey & { productId?: number | null; product?: ProductLite | null };

const SURVEYS_PER_PAGE = 6;

type StatusFilter = 'ALL' | 'ACTIVE' | 'CLOSED';

const ProductBadge: React.FC<{ product?: ProductLite | null }> = ({ product }) =>
  product ? (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999,
        background: '#EDE9FE', color: '#7C3AED', fontSize: 12, fontWeight: 600,
      }}
    >
      <Package size={12} /> {product.productName}
    </span>
  ) : null;

const SurveysPage: React.FC = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Tổng phản hồi ở lần tải trước — để báo "có phản hồi mới" khi tăng
  const prevResponsesRef = useRef<number | null>(null);

  /** silent = true: dùng cho auto-refresh, không bật spinner, không báo lỗi. */
  const loadSurveys = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = (await getSurveys()) as SurveyItem[];
      setSurveys(data);

      const total = data.reduce((s, x) => s + (x._count?.surveyResponses ?? 0), 0);
      if (prevResponsesRef.current !== null && total > prevResponsesRef.current) {
        toast(`📝 Có ${total - prevResponsesRef.current} phản hồi khảo sát mới`, { duration: 4000 });
      }
      prevResponsesRef.current = total;
    } catch {
      if (!silent) toast.error('Không thể tải danh sách khảo sát');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadSurveys(); }, [loadSurveys]);

  // Real-time: tự cập nhật mỗi 5 giây (phản hồi, đối tượng, trạng thái...)
  useAutoRefresh(() => loadSurveys(true), 5000);

  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchDraft);
  };
  const handleClearSearch = () => { setSearchDraft(''); setSearchTerm(''); };

  const handleToggleActive = async (survey: SurveyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingId(survey.surveyId);
    try {
      const updated = await toggleSurveyActive(survey.surveyId, !survey.isActive);
      setSurveys((prev) =>
        prev.map((s) =>
          s.surveyId === survey.surveyId ? { ...s, isActive: updated.isActive ?? !survey.isActive } : s,
        ),
      );
      toast.success(survey.isActive ? '🔴 Đã đóng khảo sát' : '🟢 Đã kích hoạt khảo sát');
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setTogglingId(null);
    }
  };

  const activeSurveys = surveys.filter((s) => s.isActive);
  const inactiveSurveys = surveys.filter((s) => !s.isActive);

  const kw = searchTerm.toLowerCase();
  const filteredSurveys = surveys.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(kw) ||
      (s.description ?? '').toLowerCase().includes(kw) ||
      (s.product?.productName ?? '').toLowerCase().includes(kw);
    const matchStatus =
      statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? s.isActive : !s.isActive);
    return matchSearch && matchStatus;
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSurveys.length / SURVEYS_PER_PAGE));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedSurveys = filteredSurveys.slice(
    (currentPage - 1) * SURVEYS_PER_PAGE,
    currentPage * SURVEYS_PER_PAGE,
  );

  return (
    <div className="surveys-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Khảo sát</h1>
          <p className="page-subtitle">Tạo, gửi và theo dõi kết quả khảo sát khách hàng theo thời gian thực</p>
        </div>
      </div>

      <div className="surveys-toolbar">
        <form className="survey-search-form" onSubmit={handleApplySearch}>
          <label className="survey-search-bar">
            <Search size={16} className="survey-search-icon" />
            <input
              type="text"
              className="survey-search-input"
              placeholder="Tìm khảo sát theo tên, mô tả, sản phẩm..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
            {searchDraft && (
              <button type="button" className="survey-search-clear" onClick={handleClearSearch} title="Xóa từ khóa">
                <X size={14} />
              </button>
            )}
          </label>
          <button type="submit" className="survey-search-submit">
            <Search size={16} />
            Tìm kiếm
          </button>
        </form>

        <button id="create-survey-btn" className="btn btn-primary create-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Tạo khảo sát mới
        </button>
      </div>

      <div className="sv-filter">
        <button type="button" className={`sv-filter-btn ${statusFilter === 'ALL' ? 'on' : ''}`}
          onClick={() => setStatusFilter('ALL')}>
          <FileText size={15} /> Tổng: <strong>{surveys.length}</strong>
        </button>
        <button type="button" className={`sv-filter-btn active ${statusFilter === 'ACTIVE' ? 'on' : ''}`}
          onClick={() => setStatusFilter('ACTIVE')}>
          <Power size={15} /> Đang hoạt động: <strong>{activeSurveys.length}</strong>
        </button>
        <button type="button" className={`sv-filter-btn closed ${statusFilter === 'CLOSED' ? 'on' : ''}`}
          onClick={() => setStatusFilter('CLOSED')}>
          <PowerOff size={15} /> Đã đóng: <strong>{inactiveSurveys.length}</strong>
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Đang tải danh sách khảo sát...</p>
        </div>
      ) : surveys.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} strokeWidth={1} />
          <p>Chưa có khảo sát nào. Tạo khảo sát đầu tiên ngay!</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Tạo khảo sát
          </button>
        </div>
      ) : (
        <>
          <div className="surveys-list">
            {filteredSurveys.length === 0 ? (
              <div className="empty-state">
                <Search size={48} strokeWidth={1} />
                <p>
                  {searchTerm
                    ? `Không tìm thấy khảo sát với từ khóa "${searchTerm}"`
                    : 'Không có khảo sát nào ở mục này'}
                </p>
              </div>
            ) : (
              paginatedSurveys.map((survey) => (
                <div
                  key={survey.surveyId}
                  className={`survey-card ${!survey.isActive ? 'inactive' : ''}`}
                  onClick={() => navigate(`/surveys/${survey.surveyId}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/surveys/${survey.surveyId}`)}
                >
                  <div className="survey-card-left">
                    <div className="survey-card-icon"><FileText size={22} /></div>
                    <div className="survey-card-info">
                      <div className="survey-card-title-row">
                        <h3 className="survey-card-title">{survey.title}</h3>
                        <span className={`active-badge ${survey.isActive ? 'on' : 'off'}`}>
                          {survey.isActive ? '● Đang hoạt động' : '○ Đã đóng'}
                        </span>
                        <ProductBadge product={survey.product} />
                      </div>
                      {survey.description && <p className="survey-card-desc">{survey.description}</p>}
                      <div className="survey-card-meta">
                        <span className="meta-chip">
                          <FileText size={13} />
                          {survey._count?.questions ?? survey.questions?.length ?? 0} câu hỏi
                        </span>
                        <span className="meta-chip">
                          <Users size={13} />
                          {survey._count?.surveyTargets ?? 0} đối tượng
                        </span>
                        <span className="meta-chip">
                          <MessageSquare size={13} />
                          {survey._count?.surveyResponses ?? 0} phản hồi
                        </span>
                        <span className="meta-chip date">
                          Tạo ngày {new Date(survey.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="meta-chip">
                        Người tạo: {survey.creator?.username ?? 'Không xác định'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="survey-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`toggle-active-btn ${survey.isActive ? 'deactivate' : 'activate'}`}
                      onClick={(e) => handleToggleActive(survey, e)}
                      disabled={togglingId === survey.surveyId}
                    >
                      {survey.isActive ? <PowerOff size={15} /> : <Power size={15} />}
                      {survey.isActive ? 'Đóng' : 'Kích hoạt'}
                    </button>
                    <button className="detail-btn" onClick={() => navigate(`/surveys/${survey.surveyId}`)}>
                      Chi tiết <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSurveys.length}
            itemsPerPage={SURVEYS_PER_PAGE}
            itemLabel="khảo sát"
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {showCreateModal && (
        <CreateSurveyModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => loadSurveys(true)}
          onPartial={(id) => navigate(`/surveys/${id}`)}
        />
      )}
    </div>
  );
};

export default SurveysPage;
