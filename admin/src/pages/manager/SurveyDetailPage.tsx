import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Plus, Trash2, Edit2, Check, X, Users, BarChart2, Lock, Send,
  FileText, ChevronDown, ChevronUp, Power, PowerOff
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  getSurveyFull, getSurveyStats, assignSurvey, getCustomers,
  createQuestion, updateQuestion, deleteQuestion, createOption, deleteOption,
  toggleSurveyActive,
} from '../../services/api';
import api from '../../utils/api';
import { showAlert, showConfirm } from '../../lib/dialog';
import type {
  Survey, SurveyQuestion, SurveyStats, QuestionType
} from '../../types/survey';
import type { CustomerBasic } from '../../services/api';
import './SurveyDetailPage.css';
import './SurveyLock.css';

type ActiveTab = 'questions' | 'targets' | 'stats';

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  TEXT: 'Trả lời tự do',
  SINGLE_CHOICE: 'Chọn một',
};

const CHART_COLORS = ['#1EAD5D', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

const errMsg = (e: any, fallback: string) => e?.response?.data?.message ?? fallback;

// ====================================================
// TAB 1: Câu hỏi & Tùy chọn
// locked = khảo sát đã có người trả lời -> chỉ xem
// ====================================================
const QuestionsTab: React.FC<{ survey: Survey; onReload: () => void; locked: boolean }> = ({ survey, onReload, locked }) => {
  const [newQ, setNewQ] = useState<{ content: string; type: QuestionType }>({
    content: '',
    type: 'SINGLE_CHOICE',
  });
  const [addingQ, setAddingQ] = useState(false);
  const [showQForm, setShowQForm] = useState(false);
  const [editingQId, setEditingQId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newOptionTexts, setNewOptionTexts] = useState<Record<number, string>>({});
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const handleAddQuestion = async () => {
    if (!newQ.content.trim()) {
      await showAlert({ title: 'Thiếu nội dung', message: 'Nội dung câu hỏi không được để trống.', tone: 'warning' });
      return;
    }
    setAddingQ(true);
    try {
      await createQuestion({ surveyId: survey.surveyId, questionContent: newQ.content, questionType: newQ.type });
      toast.success('Đã thêm câu hỏi');
      setNewQ({ content: '', type: 'SINGLE_CHOICE' });
      setShowQForm(false);
      onReload();
    } catch (e) {
      await showAlert({ title: 'Không thể thêm câu hỏi', message: errMsg(e, 'Vui lòng thử lại.'), tone: 'error' });
    } finally { setAddingQ(false); }
  };

  const handleUpdateQuestion = async (q: SurveyQuestion) => {
    if (!editContent.trim()) {
      await showAlert({ title: 'Thiếu nội dung', message: 'Nội dung câu hỏi không được để trống.', tone: 'warning' });
      return;
    }
    try {
      await updateQuestion(q.questionId, { questionContent: editContent });
      toast.success('Đã cập nhật câu hỏi');
      setEditingQId(null);
      onReload();
    } catch (e) {
      await showAlert({ title: 'Không thể cập nhật', message: errMsg(e, 'Vui lòng thử lại.'), tone: 'error' });
    }
  };

  const handleDeleteQuestion = async (q: SurveyQuestion) => {
    const ok = await showConfirm({
      title: 'Xóa câu hỏi?',
      message: `Câu hỏi "${q.questionContent}" cùng các lựa chọn của nó sẽ bị xóa.`,
      confirmLabel: 'Xóa', tone: 'warning', danger: true,
    });
    if (!ok) return;
    setDeletingIds((s) => new Set(s).add(q.questionId));
    try {
      await deleteQuestion(q.questionId);
      toast.success('Đã xóa câu hỏi');
      onReload();
    } catch (e) {
      await showAlert({ title: 'Không thể xóa câu hỏi', message: errMsg(e, 'Vui lòng thử lại.'), tone: 'error' });
    } finally {
      setDeletingIds((s) => { const n = new Set(s); n.delete(q.questionId); return n; });
    }
  };

  const handleAddOption = async (questionId: number) => {
    const text = newOptionTexts[questionId]?.trim();
    if (!text) {
      await showAlert({ title: 'Thiếu nội dung', message: 'Nội dung lựa chọn không được để trống.', tone: 'warning' });
      return;
    }
    try {
      await createOption({ questionId, optionText: text });
      toast.success('Đã thêm lựa chọn');
      setNewOptionTexts((p) => ({ ...p, [questionId]: '' }));
      onReload();
    } catch (e) {
      await showAlert({ title: 'Không thể thêm lựa chọn', message: errMsg(e, 'Vui lòng thử lại.'), tone: 'error' });
    }
  };

  const handleDeleteOption = async (optionId: number, text: string) => {
    const ok = await showConfirm({
      title: 'Xóa lựa chọn?', message: `Lựa chọn "${text}" sẽ bị xóa.`,
      confirmLabel: 'Xóa', tone: 'warning', danger: true,
    });
    if (!ok) return;
    try {
      await deleteOption(optionId);
      toast.success('Đã xóa lựa chọn');
      onReload();
    } catch (e) {
      await showAlert({ title: 'Không thể xóa lựa chọn', message: errMsg(e, 'Vui lòng thử lại.'), tone: 'error' });
    }
  };

  const questions = survey.questions ?? [];

  return (
    <div className="tab-content">
      {locked && (
        <div className="lock-banner">
          <Lock size={18} />
          <div>
            <b>Cấu trúc khảo sát đã bị khóa</b>
            Khảo sát này đã có khách hàng trả lời nên chỉ được xem. Bạn không thể thêm, sửa hay xóa câu hỏi/lựa chọn.
            Nếu cần thay đổi, hãy tạo một khảo sát mới.
          </div>
        </div>
      )}

      <div className="tab-section-header">
        <span>{questions.length} câu hỏi</span>
        {!locked && (
          <button id="add-question-btn" className="btn btn-primary btn-sm" onClick={() => setShowQForm(!showQForm)}>
            <Plus size={15} /> Thêm câu hỏi
          </button>
        )}
      </div>

      {!locked && showQForm && (
        <div className="add-question-form">
          <textarea
            className="form-input"
            placeholder="Nội dung câu hỏi..."
            rows={2}
            value={newQ.content}
            onChange={(e) => setNewQ({ ...newQ, content: e.target.value })}
            autoFocus
          />
          <div className="form-row">
            <select
              className="form-input form-select"
              value={newQ.type}
              onChange={(e) => setNewQ({ ...newQ, type: e.target.value as QuestionType })}
            >
              {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={handleAddQuestion} disabled={addingQ}>
              {addingQ ? 'Đang thêm...' : 'Lưu'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowQForm(false)}>Hủy</button>
          </div>
        </div>
      )}

      {questions.length === 0 && !showQForm && (
        <div className="empty-state-sm">
          <p>Chưa có câu hỏi nào.{!locked && ' Nhấn "+ Thêm câu hỏi" để bắt đầu.'}</p>
        </div>
      )}

      <div className="questions-list">
        {questions.map((q, idx) => (
          <div key={q.questionId} className="question-card">
            <div className="question-header">
              <div className="question-index">{idx + 1}</div>
              <div className="question-body">
                {!locked && editingQId === q.questionId ? (
                  <div className="edit-row">
                    <textarea
                      className="form-input"
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      autoFocus
                    />
                    <button className="icon-btn success-btn" onClick={() => handleUpdateQuestion(q)} title="Lưu">
                      <Check size={15} />
                    </button>
                    <button className="icon-btn ghost-btn" onClick={() => setEditingQId(null)} title="Hủy">
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <p className="question-text">{q.questionContent}</p>
                )}
                <span className="question-type-badge">{QUESTION_TYPE_LABELS[q.questionType]}</span>
              </div>
              {!locked && (
                <div className="question-actions">
                  <button
                    className="icon-btn edit-btn"
                    title="Sửa"
                    onClick={() => { setEditingQId(q.questionId); setEditContent(q.questionContent); }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="icon-btn danger-btn"
                    title="Xóa câu hỏi"
                    onClick={() => handleDeleteQuestion(q)}
                    disabled={deletingIds.has(q.questionId)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {q.questionType !== 'TEXT' && (
              <div className="options-section">
                <div className="options-list">
                  {q.options.map((opt, oi) => (
                    <div key={opt.optionId} className="option-item">
                      <span className="option-bullet">{String.fromCharCode(65 + oi)}.</span>
                      <span className="option-text">{opt.optionText}</span>
                      {!locked && (
                        <button
                          className="icon-btn danger-btn btn-xs"
                          onClick={() => handleDeleteOption(opt.optionId, opt.optionText)}
                          title="Xóa tùy chọn"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {!locked && (
                  <div className="add-option-row">
                    <input
                      className="form-input form-input-sm"
                      placeholder="Thêm tùy chọn..."
                      value={newOptionTexts[q.questionId] ?? ''}
                      onChange={(e) => setNewOptionTexts((p) => ({ ...p, [q.questionId]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddOption(q.questionId)}
                    />
                    <button className="btn btn-ghost btn-sm" onClick={() => handleAddOption(q.questionId)}>
                      <Plus size={14} /> Thêm
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ====================================================
// TAB 2: Đối tượng — gửi cho KH đã chọn / gửi tất cả (chỉ người chưa nhận)
// ====================================================
const TargetsTab: React.FC<{ survey: Survey }> = ({ survey }) => {
  const [customers, setCustomers] = useState<CustomerBasic[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTargets = useCallback(async () => {
    try {
      const res = await api.get(`/surveys/${survey.surveyId}/targets`);
      const list: any[] = res.data?.data ?? res.data ?? [];
      setAssignedIds(new Set(list.map((t) => t.customerId)));
    } catch {
      setAssignedIds(new Set());
    }
  }, [survey.surveyId]);

  useEffect(() => {
    Promise.all([getCustomers().then(setCustomers), loadTargets()])
      .catch(() => showAlert({ title: 'Lỗi tải dữ liệu', message: 'Không tải được danh sách khách hàng.', tone: 'error' }))
      .finally(() => setLoading(false));
  }, [loadTargets]);

  const filtered = customers.filter((c) =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone ?? '').includes(searchTerm)
  );

  const pendingAll = customers.filter((c) => !(c as any).isLocked && !assignedIds.has(c.customerId));

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const send = async (ids: number[]) => {
    setSending(true);
    try {
      await assignSurvey(survey.surveyId, ids);
      setSelected(new Set());
      await loadTargets();
      await showAlert({
        title: 'Đã gửi khảo sát',
        message: `Khảo sát "${survey.title}" đã được gửi cho ${ids.length} khách hàng. Họ sẽ nhận được thông báo ngay.`,
        tone: 'success',
      });
    } catch (e) {
      await showAlert({ title: 'Gửi khảo sát thất bại', message: errMsg(e, 'Vui lòng thử lại sau.'), tone: 'error' });
    } finally { setSending(false); }
  };

  const handleSendSelected = async () => {
    const ids = Array.from(selected).filter((id) => !assignedIds.has(id));
    if (ids.length === 0) {
      await showAlert({ title: 'Chưa chọn khách hàng', message: 'Hãy chọn ít nhất 1 khách hàng chưa nhận khảo sát.', tone: 'warning' });
      return;
    }
    const ok = await showConfirm({
      title: 'Gửi khảo sát?', message: `Gửi khảo sát cho ${ids.length} khách hàng đã chọn.`,
      confirmLabel: 'Gửi', tone: 'info',
    });
    if (ok) send(ids);
  };

  const handleSendAll = async () => {
    if (pendingAll.length === 0) {
      await showAlert({ title: 'Không còn ai để gửi', message: 'Tất cả khách hàng đã nhận khảo sát này rồi.', tone: 'info' });
      return;
    }
    const ok = await showConfirm({
      title: 'Gửi cho tất cả?',
      message: `Gửi khảo sát cho ${pendingAll.length} khách hàng chưa nhận. Người đã nhận sẽ được bỏ qua.`,
      confirmLabel: 'Gửi tất cả', tone: 'info',
    });
    if (ok) send(pendingAll.map((c) => c.customerId));
  };

  return (
    <div className="tab-content">
      <div className="tab-section-header">
        <span>Đã gửi {assignedIds.size}/{customers.length} khách hàng</span>
        <div className="send-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleSendAll} disabled={sending || loading} id="assign-all-btn">
            <Send size={15} /> Gửi tất cả ({pendingAll.length})
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSendSelected}
            disabled={sending || selected.size === 0} id="assign-survey-btn">
            <Users size={15} />
            {sending ? 'Đang gửi...' : `Gửi cho ${selected.size > 0 ? selected.size : ''} KH đã chọn`}
          </button>
        </div>
      </div>

      <input
        className="form-input search-input"
        placeholder="Tìm kiếm theo tên, số điện thoại..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <div className="loading-state-sm"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-sm"><p>Không tìm thấy khách hàng</p></div>
      ) : (
        <div className="customers-grid">
          {filtered.map((c) => {
            const isSelected = selected.has(c.customerId);
            const isAssigned = assignedIds.has(c.customerId);
            return (
              <div
                key={c.customerId}
                className={`customer-chip ${isSelected ? 'selected' : ''} ${isAssigned ? 'assigned' : ''}`}
                onClick={() => !isAssigned && toggleSelect(c.customerId)}
                title={isAssigned ? 'Đã gửi khảo sát' : ''}
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.fullName)}&background=8B5CF6&color=fff&size=32`}
                  alt=""
                  className="chip-avatar"
                />
                <div className="chip-info">
                  <span className="chip-name">{c.fullName}</span>
                  {c.phone && <span className="chip-phone">{c.phone}</span>}
                </div>
                {isSelected && <Check size={14} className="chip-check" />}
                {isAssigned && <span className="assigned-label">Đã gửi</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ====================================================
// TAB 3: Thống kê
// ====================================================
const StatsTab: React.FC<{ surveyId: number }> = ({ surveyId }) => {
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTexts, setExpandedTexts] = useState<Set<number>>(new Set());

  useEffect(() => {
    getSurveyStats(surveyId)
      .then(setStats)
      .catch(() => toast.error('Không tải được thống kê'))
      .finally(() => setLoading(false));
  }, [surveyId]);

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;
  if (!stats) return <div className="empty-state-sm"><p>Không có dữ liệu thống kê</p></div>;

  const completionPct = stats.totalAssigned > 0
    ? Math.round((stats.totalResponses / stats.totalAssigned) * 100)
    : 0;

  return (
    <div className="tab-content">
      <div className="stats-overview">
        <div className="stat-box">
          <div className="stat-box-value">{stats.totalAssigned}</div>
          <div className="stat-box-label">Tổng đối tượng</div>
        </div>
        <div className="stat-box highlight">
          <div className="stat-box-value">{stats.totalResponses}</div>
          <div className="stat-box-label">Đã phản hồi</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value">{completionPct}%</div>
          <div className="stat-box-label">Tỷ lệ hoàn thành</div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${completionPct}%` }} />
        </div>
        <span className="progress-label">{stats.totalResponses}/{stats.totalAssigned} phản hồi</span>
      </div>

      {stats.questions.map((q, idx) => (
        <div key={q.questionId} className="stat-question-card">
          <div className="stat-q-header">
            <span className="stat-q-idx">Câu {idx + 1}</span>
            <h4 className="stat-q-content">{q.questionContent}</h4>
            <span className="stat-q-total">{q.totalResponses} phản hồi</span>
          </div>

          {q.questionType === 'TEXT' ? (
            <div className="text-answers">
              <p className="text-answers-label">Danh sách câu trả lời:</p>
              {(q.textAnswers ?? []).slice(0, expandedTexts.has(q.questionId) ? undefined : 5).map((ans, i) => (
                <div key={i} className="text-answer-item">"{ans}"</div>
              ))}
              {(q.textAnswers?.length ?? 0) > 5 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    setExpandedTexts((p) => {
                      const n = new Set(p);
                      if (n.has(q.questionId)) n.delete(q.questionId); else n.add(q.questionId);
                      return n;
                    })
                  }
                >
                  {expandedTexts.has(q.questionId) ? (
                    <><ChevronUp size={14} /> Thu gọn</>
                  ) : (
                    <><ChevronDown size={14} /> Xem thêm {(q.textAnswers?.length ?? 0) - 5} câu trả lời</>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={Math.max(160, q.breakdown.length * 44)}>
                <BarChart data={q.breakdown} layout="vertical">
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="optionText" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v} phản hồi`, '']} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {q.breakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <table className="breakdown-table">
                <thead>
                  <tr><th>Lựa chọn</th><th>Số phiếu</th><th>Tỷ lệ</th></tr>
                </thead>
                <tbody>
                  {q.breakdown.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <span className="breakdown-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        {row.optionText}
                      </td>
                      <td><strong>{row.count}</strong></td>
                      <td>{row.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {stats.questions.length === 0 && (
        <div className="empty-state-sm"><p>Chưa có dữ liệu thống kê (chưa có câu hỏi hoặc chưa có phản hồi)</p></div>
      )}
    </div>
  );
};

// ====================================================
// MAIN PAGE
// ====================================================
const SurveyDetailPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('questions');
  const [toggling, setToggling] = useState(false);

  const loadSurvey = useCallback(async () => {
    if (!surveyId) return;
    try {
      const data = await getSurveyFull(Number(surveyId));
      setSurvey(data);
    } catch {
      toast.error('Không tải được thông tin khảo sát');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => { loadSurvey(); }, [loadSurvey]);

  const handleToggleActive = async () => {
    if (!survey) return;
    setToggling(true);
    try {
      const updated = await toggleSurveyActive(survey.surveyId, !survey.isActive);
      setSurvey((prev) => prev ? { ...prev, isActive: updated.isActive ?? !survey.isActive } : prev);
      toast.success(survey.isActive ? 'Đã đóng khảo sát' : 'Đã kích hoạt khảo sát');
    } catch (e) {
      await showAlert({ title: 'Thao tác thất bại', message: errMsg(e, 'Vui lòng thử lại.'), tone: 'error' });
    } finally { setToggling(false); }
  };

  const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'questions', label: 'Câu hỏi & Tùy chọn', icon: <FileText size={15} /> },
    { key: 'targets', label: 'Đối tượng', icon: <Users size={15} /> },
    { key: 'stats', label: 'Thống kê', icon: <BarChart2 size={15} /> },
  ];

  if (loading) {
    return (
      <div className="survey-detail-page">
        <div className="loading-state"><div className="spinner" /><p>Đang tải...</p></div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="survey-detail-page">
        <div className="empty-state"><p>Không tìm thấy khảo sát</p></div>
      </div>
    );
  }

  // Khảo sát đã có người trả lời -> khóa cấu trúc (chỉ xem)
  const locked = ((survey as any)._count?.surveyResponses ?? 0) > 0;

  return (
    <div className="survey-detail-page">
      <div className="breadcrumb">
        <button className="back-btn" onClick={() => navigate('/surveys')}>
          <ArrowLeft size={18} /> Quay lại
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Chi tiết khảo sát</span>
      </div>

      <div className="survey-detail-header">
        <div className="sdh-info">
          <div className="sdh-title-row">
            <h1 className="sdh-title">{survey.title}</h1>
            <span className={`active-badge ${survey.isActive ? 'on' : 'off'}`}>
              {survey.isActive ? '● Đang hoạt động' : '○ Đã đóng'}
            </span>
          </div>
          {survey.description && <p className="sdh-desc">{survey.description}</p>}
          <div className="sdh-meta">
            <span>Tạo ngày {new Date(survey.createdAt).toLocaleDateString('vi-VN')}</span>
            <span>•</span>
            <span>Tạo bởi <b>{(survey as any).creator?.username ?? 'Không rõ'}</b></span>
            <span>•</span>
            <span>{survey.questions?.length ?? 0} câu hỏi</span>
            {locked && <><span>•</span><span>Đã có phản hồi (khóa chỉnh sửa)</span></>}
          </div>
        </div>
        <button
          className={`toggle-active-btn ${survey.isActive ? 'deactivate' : 'activate'}`}
          onClick={handleToggleActive}
          disabled={toggling}
        >
          {survey.isActive ? <PowerOff size={16} /> : <Power size={16} />}
          {toggling ? 'Đang xử lý...' : survey.isActive ? 'Đóng khảo sát' : 'Kích hoạt'}
        </button>
      </div>

      <div className="detail-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            className={`detail-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="detail-tab-content">
        {activeTab === 'questions' && <QuestionsTab survey={survey} onReload={loadSurvey} locked={locked} />}
        {activeTab === 'targets' && <TargetsTab survey={survey} />}
        {activeTab === 'stats' && <StatsTab surveyId={survey.surveyId} />}
      </div>
    </div>
  );
};

export default SurveyDetailPage;
