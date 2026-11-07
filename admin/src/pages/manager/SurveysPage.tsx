import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { fullNameOf } from '../../utils/name';
import './SurveysPage.css';

type ProductLite = { productId: number; productName: string; brand?: string | null };
type SurveyItem = Survey & { productId?: number | null; product?: ProductLite | null };

const SURVEYS_PER_PAGE = 6;

type SortKey = 'newest' | 'oldest' | 'responses' | 'title';

interface SearchCriteria {
  keyword: string;
  status: '' | 'ACTIVE' | 'CLOSED';
  product: '' | 'HAS' | 'NONE'; // Tất cả / Có gắn sản phẩm / Không gắn sản phẩm
  dateFrom: string; // yyyy-MM-dd
  dateTo: string;
  sort: SortKey;
}

const EMPTY_CRITERIA: SearchCriteria = { keyword: '', status: '', product: '', dateFrom: '', dateTo: '', sort: 'newest' };

/** Chữ thường + bỏ dấu tiếng Việt. */
const normalizeText = (s: unknown): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();

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
  const [draft, setDraft] = useState<SearchCriteria>(EMPTY_CRITERIA);
  const [applied, setApplied] = useState<SearchCriteria>(EMPTY_CRITERIA);
  const [currentPage, setCurrentPage] = useState(1);

  const prevResponsesRef = useRef<number | null>(null);

  const loadSurveys = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = (await getSurveys()) as SurveyItem[];
      setSurveys([...data].sort((a, b) => b.surveyId - a.surveyId));

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

  useAutoRefresh(() => loadSurveys(true), 5000);

  /** Ô từ khóa: chỉ lưu nháp, áp dụng khi bấm "Tìm kiếm". */
  const setKeyword = (value: string) => setDraft((prev) => ({ ...prev, keyword: value }));

  /** Bộ lọc nâng cao: áp dụng ngay khi chọn. */
  const setFilter = <K extends keyof SearchCriteria>(key: K, value: SearchCriteria[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (next.dateFrom && next.dateTo && next.dateFrom > next.dateTo) {
      return void toast.error('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
    }
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

  const filteredSurveys = useMemo(() => {
    const kw = normalizeText(applied.keyword);
    const list = surveys.filter((s) => {
      if (kw) {
        const hit =
          normalizeText(`KS${String(s.surveyId).padStart(3, '0')}`).includes(kw) ||
          String(s.surveyId) === kw ||
          normalizeText(s.title).includes(kw) ||
          normalizeText(s.description).includes(kw) ||
          normalizeText(s.product?.productName).includes(kw) ||
          normalizeText(fullNameOf(s.creator) || s.creator?.username).includes(kw);
        if (!hit) return false;
      }
      if (applied.status === 'ACTIVE' && !s.isActive) return false;
      if (applied.status === 'CLOSED' && s.isActive) return false;
      if (applied.product === 'NONE' && s.product) return false;
      if (applied.product === 'HAS' && !s.product) return false;
      const created = new Date(s.createdAt).getTime();
      if (applied.dateFrom && created < new Date(`${applied.dateFrom}T00:00:00`).getTime()) return false;
      if (applied.dateTo && created > new Date(`${applied.dateTo}T23:59:59.999`).getTime()) return false;
      return true;
    });
    switch (applied.sort) {
      case 'oldest': return list.sort((a, b) => a.surveyId - b.surveyId);
      case 'responses': return list.sort((a, b) => (b._count?.surveyResponses ?? 0) - (a._count?.surveyResponses ?? 0));
      case 'title': return list.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
      default: return list.sort((a, b) => b.surveyId - a.surveyId);
    }
  }, [surveys, applied]);

  useEffect(() => { setCurrentPage(1); }, [applied]);

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
        <button id="create-survey-btn" className="btn btn-primary create-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Tạo khảo sát mới
        </button>
      </div>

      <div className="filter-block">
        <form className="filter-search-row" onSubmit={handleSearch}>
          <label className="survey-search-bar">
            <Search size={16} className="survey-search-icon" />
            <input
              type="text"
              className="survey-search-input"
              placeholder="Tìm khảo sát theo tên, mô tả, sản phẩm..."
              value={draft.keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {draft.keyword && (
              <button type="button" className="survey-search-clear" onClick={handleClearKeyword} title="Xóa từ khóa">
                <X size={14} />
              </button>
            )}
          </label>
          <button type="submit" className="survey-search-submit">
            <Search size={16} />
            Tìm kiếm
          </button>
        </form>

        <div className="filter-adv-row">
          <select className="survey-select" value={draft.status} onChange={(e) => setFilter('status', e.target.value as SearchCriteria['status'])}>
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="CLOSED">Đã đóng</option>
          </select>
          <select className="survey-select" value={draft.product} onChange={(e) => setFilter('product', e.target.value as SearchCriteria['product'])}>
            <option value="">Tất cả sản phẩm</option>
            <option value="NONE">Không gắn sản phẩm</option>
            <option value="HAS">Có gắn sản phẩm</option>
          </select>
          <select className="survey-select" value={draft.sort} onChange={(e) => setFilter('sort', e.target.value as SortKey)}>
            <option value="newest">Mới tạo nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="responses">Nhiều phản hồi nhất</option>
            <option value="title">Tên A → Z</option>
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
                <p>Không tìm thấy khảo sát phù hợp</p>
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
                    <div className="survey-card-code">KS{String(survey.surveyId).padStart(3, '0')}</div>
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
                          Người tạo: {fullNameOf(survey.creator) || survey.creator?.username || '—'}
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
