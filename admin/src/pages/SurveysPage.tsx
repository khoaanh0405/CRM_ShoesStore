import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, FileText, Users, MessageSquare, Power, PowerOff, X, ChevronRight } from 'lucide-react';
import { getSurveys, createSurvey, toggleSurveyActive } from '../services/api';
import type { Survey, CreateSurveyForm } from '../types/survey';
import './SurveysPage.css';

// Modal tạo khảo sát mới
const CreateSurveyModal: React.FC<{
  onClose: () => void;
  onCreated: (survey: Survey) => void;
}> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState<CreateSurveyForm>({
    title: '',
    description: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Tiêu đề không được để trống');
      return;
    }
    setLoading(true);
    try {
      const created = await createSurvey(form);
      toast.success('✅ Tạo khảo sát thành công!');
      onCreated(created);
      onClose();
    } catch {
      toast.error('Tạo khảo sát thất bại, vui lòng thử lại');
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
              <label className="form-label">Tiêu đề <span className="required">*</span></label>
              <input
                id="survey-title"
                type="text"
                className="form-input"
                placeholder="VD: Khảo sát xu hướng giày Thu Đông 2026"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                className={`toggle-btn ${form.isActive ? 'on' : 'off'}`}
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
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
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const data = await getSurveys();
      setSurveys(data);
    } catch {
      toast.error('Không thể tải danh sách khảo sát');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const handleToggleActive = async (survey: Survey, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingId(survey.surveyId);
    try {
      const updated = await toggleSurveyActive(survey.surveyId, !survey.isActive);
      setSurveys((prev) =>
        prev.map((s) =>
          s.surveyId === survey.surveyId ? { ...s, isActive: updated.isActive ?? !survey.isActive } : s
        )
      );
      toast.success(
        survey.isActive ? '🔴 Đã đóng khảo sát' : '🟢 Đã kích hoạt khảo sát'
      );
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSurveyCreated = (newSurvey: Survey) => {
    setSurveys((prev) => [newSurvey, ...prev]);
  };

  const activeSurveys = surveys.filter((s) => s.isActive);
  const inactiveSurveys = surveys.filter((s) => !s.isActive);

  return (
    <div className="surveys-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Khảo sát</h1>
          <p className="page-subtitle">Tạo, quản lý và theo dõi kết quả khảo sát khách hàng</p>
        </div>
        <button
          id="create-survey-btn"
          className="btn btn-primary create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} />
          Tạo khảo sát mới
        </button>
      </div>

      {/* Summary stats */}
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

      {/* Content */}
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
        <div className="surveys-list">
          {surveys.map((survey) => (
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
                  </div>
                  {survey.description && (
                    <p className="survey-card-desc">{survey.description}</p>
                  )}
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
                <button
                  className="detail-btn"
                  onClick={() => navigate(`/surveys/${survey.surveyId}`)}
                  title="Xem chi tiết"
                >
                  Chi tiết <ChevronRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateSurveyModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleSurveyCreated}
        />
      )}
    </div>
  );
};

export default SurveysPage;
