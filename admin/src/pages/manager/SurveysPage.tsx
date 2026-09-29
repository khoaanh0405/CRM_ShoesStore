import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, FileText, Users, MessageSquare, Power, PowerOff, X, ChevronRight, Search, Package } from 'lucide-react';
import { getSurveys, toggleSurveyActive } from '../../services/api';
import api from '../../utils/api';
import type { Survey } from '../../types/survey';
import Pagination from '../../components/Pagination';
import './SurveysPage.css';

type ProductLite = { productId: number; productName: string; brand?: string | null };
type SurveyItem = Survey & { productId?: number | null; product?: ProductLite | null };

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

// Modal tạo khảo sát mới (chung hoặc gắn với 1 sản phẩm)
const CreateSurveyModal: React.FC<{
  onClose: () => void;
  onCreated: (survey: SurveyItem) => void;
}> = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [mode, setMode] = useState<'general' | 'product'>('general');
  const [productId, setProductId] = useState<number | ''>('');
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get('/products')
      .then((res) => setProducts(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error('Không tải được danh sách sản phẩm'));
  }, []);

  const modeBtn = (key: 'general' | 'product', label: string) => (
    <button
      type="button"
      onClick={() => setMode(key)}
      style={{
        flex: 1, height: 40, borderRadius: 8, fontWeight: 600, fontSize: 13.5,
        border: `1.5px solid ${mode === key ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: mode === key ? 'var(--color-primary)' : '#fff',
        color: mode === key ? '#fff' : 'var(--color-text-muted)',
      }}
    >
      {label}
    </button>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Tiêu đề không được để trống');
    if (mode === 'product' && productId === '') return toast.error('Vui lòng chọn sản phẩm cần khảo sát');
    setLoading(true);
    try {
      const res = await api.post('/surveys/simple', {
        title: title.trim(),
        description,
        isActive,
        productId: mode === 'product' ? productId : null,
      });
      const created: SurveyItem = res.data?.data ?? res.data;
      const product = mode === 'product' ? products.find((p) => p.productId === productId) : null;
      toast.success('✅ Tạo khảo sát thành công!');
      onCreated({ ...created, product: created.product ?? product ?? null });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Tạo khảo sát thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Tạo khảo sát mới</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Loại khảo sát</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {modeBtn('general', 'Khảo sát chung')}
                {modeBtn('product', 'Theo sản phẩm')}
              </div>
            </div>

            {mode === 'product' && (
              <div className="form-group">
                <label className="form-label">Sản phẩm <span className="required">*</span></label>
                <select
                  className="form-input"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.productName}{p.brand ? ` (${p.brand})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Tiêu đề <span className="required">*</span></label>
              <input
                id="survey-title"
                type="text"
                className="form-input"
                placeholder={
                  mode === 'product'
                    ? 'VD: Mức độ hài lòng với Giày Sneaker Classic'
                    : 'VD: Khảo sát xu hướng giày Thu Đông 2026'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mô tả</label>
              <textarea
                id="survey-description"
                className="form-input form-textarea"
                placeholder="Mô tả mục đích, nội dung khảo sát..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group form-toggle-row">
              <div>
                <label className="form-label">Trạng thái</label>
                <p className="form-hint">Khảo sát đang hoạt động sẽ hiển thị cho khách hàng</p>
              </div>
              <button
                type="button"
                id="survey-active-toggle"
                className={`toggle-btn ${isActive ? 'on' : 'off'}`}
                onClick={() => setIsActive(!isActive)}
              >
                <span className="toggle-thumb" />
              </button>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo khảo sát'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SurveysPage: React.FC = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDraft, setSearchDraft] = useState('');

  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchDraft);
  };

  const handleClearSearch = () => {
    setSearchDraft('');
    setSearchTerm('');
  };

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const data = await getSurveys();
      setSurveys(data as SurveyItem[]);
    } catch {
      toast.error('Không thể tải danh sách khảo sát');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const handleToggleActive = async (survey: SurveyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingId(survey.surveyId);
    try {
      const updated = await toggleSurveyActive(survey.surveyId, !survey.isActive);
      setSurveys((prev) =>
        prev.map((s) =>
          s.surveyId === survey.surveyId ? { ...s, isActive: updated.isActive ?? !survey.isActive } : s
        )
      );
      toast.success(survey.isActive ? '🔴 Đã đóng khảo sát' : '🟢 Đã kích hoạt khảo sát');
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSurveyCreated = (newSurvey: SurveyItem) => {
    setSurveys((prev) => [newSurvey, ...prev]);
  };

  const activeSurveys = surveys.filter((s) => s.isActive);
  const inactiveSurveys = surveys.filter((s) => !s.isActive);

  const kw = searchTerm.toLowerCase();
  const filteredSurveys = surveys.filter(
    (s) =>
      s.title.toLowerCase().includes(kw) ||
      (s.description ?? '').toLowerCase().includes(kw) ||
      (s.product?.productName ?? '').toLowerCase().includes(kw)
  );

  const SURVEYS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredSurveys.length / SURVEYS_PER_PAGE));
  const paginatedSurveys = filteredSurveys.slice(
    (currentPage - 1) * SURVEYS_PER_PAGE,
    currentPage * SURVEYS_PER_PAGE
  );

  return (
    <div className="surveys-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Khảo sát</h1>
          <p className="page-subtitle">Tạo, quản lý và theo dõi kết quả khảo sát khách hàng</p>
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

      <div className="surveys-stats">
        <div className="stat-chip">
          <FileText size={16} />
          <span>Tổng: <strong>{surveys.length}</strong></span>
        </div>
        <div className="stat-chip active">
          <Power size={16} />
          <span>Đang hoạt động: <strong>{activeSurveys.length}</strong></span>
        </div>
        <div className="stat-chip inactive">
          <PowerOff size={16} />
          <span>Đã đóng: <strong>{inactiveSurveys.length}</strong></span>
        </div>
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
            {filteredSurveys.length === 0 && searchTerm ? (
              <div className="empty-state">
                <Search size={48} strokeWidth={1} />
                <p>Không tìm thấy khảo sát với từ khóa "{searchTerm}"</p>
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
                    <div className="survey-card-icon">
                      <FileText size={22} />
                    </div>
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
                      </div>
                    </div>
                  </div>

                  <div className="survey-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`toggle-active-btn ${survey.isActive ? 'deactivate' : 'activate'}`}
                      onClick={(e) => handleToggleActive(survey, e)}
                      disabled={togglingId === survey.surveyId}
                      title={survey.isActive ? 'Đóng khảo sát' : 'Kích hoạt khảo sát'}
                    >
                      {survey.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                      {togglingId === survey.surveyId ? 'Đang xử lý...' : survey.isActive ? 'Đóng' : 'Kích hoạt'}
                    </button>
                    <button className="detail-btn" onClick={() => navigate(`/surveys/${survey.surveyId}`)} title="Xem chi tiết">
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
        <CreateSurveyModal onClose={() => setShowCreateModal(false)} onCreated={handleSurveyCreated} />
      )}
    </div>
  );
};

export default SurveysPage;
