import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, Send, Search, Check } from 'lucide-react';
import api from '../utils/api';
import {
  getCustomers, createQuestion, createOption, assignSurvey, getSurveyFull,
} from '../services/api';
import type { QuestionType } from '../types/survey';
import './CreateSurveyModal.css';

type ProductLite = { productId: number; productName: string; brand?: string | null };
type CustomerLite = { customerId: number; fullName: string; phone?: string | null; isLocked?: boolean };
type Audience = 'all' | 'select' | 'later';

interface DraftQuestion {
  key: number;
  content: string;
  type: QuestionType;
  options: string[];
}

interface Props {
  onClose: () => void;
  /** Gọi sau khi tạo xong để trang danh sách tải lại. `surveyId` để điều hướng nếu cần. */
  onCreated: (surveyId: number) => void;
  /** Gọi khi tạo khảo sát xong nhưng 1 bước phụ (câu hỏi/gán khách) lỗi — cho phép mở trang chi tiết để sửa. */
  onPartial?: (surveyId: number) => void;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Chọn một',
  TEXT: 'Trả lời tự do',
};

let keySeq = 1;
const newQuestion = (): DraftQuestion => ({
  key: keySeq++,
  content: '',
  type: 'SINGLE_CHOICE',
  options: ['', ''],
});

/** Lấy id từ nhiều dạng response khác nhau (đã/ chưa unwrap `data`). */
const pickId = (res: any, field: string): number | undefined =>
  res?.[field] ?? res?.data?.[field] ?? res?.data?.data?.[field];

const CreateSurveyModal: React.FC<Props> = ({ onClose, onCreated, onPartial }) => {
  const [mode, setMode] = useState<'general' | 'product'>('general');
  const [productId, setProductId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([newQuestion()]);
  const [audience, setAudience] = useState<Audience>('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [custSearch, setCustSearch] = useState('');

  const [products, setProducts] = useState<ProductLite[]>([]);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    api.get('/products')
      .then((res) => setProducts(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error('Không tải được danh sách sản phẩm'));
    Promise.resolve(getCustomers())
      .then((list: any) => setCustomers(list as CustomerLite[]))
      .catch(() => toast.error('Không tải được danh sách khách hàng'));
  }, []);

  const activeCustomers = useMemo(() => customers.filter((c) => !c.isLocked), [customers]);
  const shownCustomers = useMemo(() => {
    const k = custSearch.trim().toLowerCase();
    return activeCustomers.filter(
      (c) => !k || c.fullName.toLowerCase().includes(k) || (c.phone ?? '').includes(k),
    );
  }, [activeCustomers, custSearch]);

  /* ---------- thao tác trên form ---------- */
  const patchQ = (key: number, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  const removeQ = (key: number) => setQuestions((qs) => qs.filter((q) => q.key !== key));
  const setOpt = (key: number, i: number, v: string) =>
    setQuestions((qs) => qs.map((q) =>
      q.key === key ? { ...q, options: q.options.map((o, idx) => (idx === i ? v : o)) } : q));
  const addOpt = (key: number) =>
    setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, options: [...q.options, ''] } : q)));
  const removeOpt = (key: number, i: number) =>
    setQuestions((qs) => qs.map((q) =>
      q.key === key ? { ...q, options: q.options.filter((_, idx) => idx !== i) } : q));
  const toggleCustomer = (id: number) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const targetCount =
    audience === 'all' ? activeCustomers.length : audience === 'select' ? selected.size : 0;

  /* ---------- validate ---------- */
  const validate = (): string | null => {
    if (!title.trim()) return 'Tiêu đề không được để trống';
    if (mode === 'product' && productId === '') return 'Vui lòng chọn sản phẩm cần khảo sát';
    if (questions.length === 0) return 'Cần ít nhất 1 câu hỏi';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) return `Câu ${i + 1}: chưa nhập nội dung câu hỏi`;
      if (q.type === 'SINGLE_CHOICE' && q.options.filter((o) => o.trim()).length < 2)
        return `Câu ${i + 1}: cần ít nhất 2 lựa chọn`;
    }
    if (audience === 'select' && selected.size === 0) return 'Hãy chọn ít nhất 1 khách hàng (hoặc chọn "Gửi tất cả")';
    return null;
  };

  /* ---------- 1 nút xác nhận: tạo khảo sát → câu hỏi → lựa chọn → gán khách ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);

    setSubmitting(true);
    let surveyId: number | undefined;
    try {
      setProgress('Đang tạo khảo sát...');
      const res = await api.post('/surveys/simple', {
        title: title.trim(),
        description: description.trim(),
        isActive: true,
        productId: mode === 'product' ? productId : null,
      });
      surveyId = pickId(res.data?.data ?? res.data, 'surveyId') ?? pickId(res.data, 'surveyId');
      if (!surveyId) throw new Error('Không nhận được surveyId từ máy chủ');

      // 1) câu hỏi (tuần tự để giữ đúng thứ tự)
      const qIds: (number | undefined)[] = [];
      for (let i = 0; i < questions.length; i++) {
        setProgress(`Đang tạo câu hỏi ${i + 1}/${questions.length}...`);
        const q = questions[i];
        const r: any = await createQuestion({
          surveyId, questionContent: q.content.trim(), questionType: q.type,
        });
        qIds.push(pickId(r, 'questionId'));
      }

      // Fallback: nếu API createQuestion không trả về id → đối chiếu theo nội dung
      if (qIds.some((id) => !id)) {
        const full: any = await getSurveyFull(surveyId);
        const used = new Set<number>(qIds.filter(Boolean) as number[]);
        questions.forEach((q, i) => {
          if (qIds[i]) return;
          const m = (full?.questions ?? []).find(
            (x: any) => x.questionContent === q.content.trim() && !used.has(x.questionId));
          if (m) { qIds[i] = m.questionId; used.add(m.questionId); }
        });
      }

      // 2) lựa chọn
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (q.type !== 'SINGLE_CHOICE') continue;
        const qid = qIds[i];
        if (!qid) throw new Error(`Không xác định được câu hỏi ${i + 1} để thêm lựa chọn`);
        setProgress(`Đang thêm lựa chọn cho câu ${i + 1}...`);
        for (const text of q.options.map((o) => o.trim()).filter(Boolean)) {
          await createOption({ questionId: qid, optionText: text });
        }
      }

      // 3) gửi cho khách hàng
      if (audience !== 'later') {
        const ids = audience === 'all'
          ? activeCustomers.map((c) => c.customerId)
          : Array.from(selected);
        if (ids.length > 0) {
          setProgress(`Đang gửi cho ${ids.length} khách hàng...`);
          await assignSurvey(surveyId, ids);
        }
      }

      toast.success(
        audience === 'later'
          ? '✅ Đã tạo khảo sát'
          : `✅ Đã tạo và gửi khảo sát cho ${targetCount} khách hàng`,
      );
      onCreated(surveyId);
      onClose();
    } catch (ex: any) {
      const msg = ex?.response?.data?.message ?? ex?.message ?? 'Có lỗi xảy ra';
      if (surveyId) {
        // Khảo sát đã được tạo nhưng 1 bước phụ lỗi → không tạo trùng, cho phép sửa tiếp ở trang chi tiết
        toast.error(`Khảo sát đã tạo nhưng chưa hoàn tất: ${msg}. Hãy kiểm tra lại ở trang chi tiết.`, { duration: 6000 });
        onPartial?.(surveyId);
        onClose();
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
      setProgress('');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
      <div className="modal-card csm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Tạo khảo sát mới</h3>
          <button className="modal-close-btn" onClick={onClose} disabled={submitting}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body csm-body">
            {/* Thông tin chung */}
            <div className="csm-section">
              <div className="csm-seg">
                <button type="button" className={mode === 'general' ? 'on' : ''} onClick={() => setMode('general')}>Khảo sát chung</button>
                <button type="button" className={mode === 'product' ? 'on' : ''} onClick={() => setMode('product')}>Theo sản phẩm</button>
              </div>

              {mode === 'product' && (
                <select className="form-input" value={productId}
                  onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.productName}{p.brand ? ` (${p.brand})` : ''}
                    </option>
                  ))}
                </select>
              )}

              <input className="form-input" placeholder="Tiêu đề khảo sát *" value={title}
                onChange={(e) => setTitle(e.target.value)} autoFocus />
              <textarea className="form-input form-textarea" rows={2} placeholder="Mô tả (không bắt buộc)"
                value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {/* Câu hỏi */}
            <div className="csm-section">
              <div className="csm-section-title">
                <span>Câu hỏi ({questions.length})</span>
                <span className="csm-hint">Thêm lựa chọn ngay trong từng câu</span>
              </div>

              {questions.map((q, idx) => (
                <div key={q.key} className="csm-q">
                  <div className="csm-q-head">
                    <span className="csm-q-idx">{idx + 1}</span>
                    <input className="form-input" placeholder="Nội dung câu hỏi..." value={q.content}
                      onChange={(e) => patchQ(q.key, { content: e.target.value })} />
                    <select className="form-input csm-q-type" value={q.type}
                      onChange={(e) => patchQ(q.key, { type: e.target.value as QuestionType })}>
                      {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    <button type="button" className="csm-icon-btn" title="Xóa câu hỏi"
                      disabled={questions.length === 1} onClick={() => removeQ(q.key)}>
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {q.type === 'SINGLE_CHOICE' && (
                    <>
                      <div className="csm-opts">
                        {q.options.map((o, i) => (
                          <div key={i} className="csm-opt">
                            <span className="csm-opt-letter">{String.fromCharCode(65 + i)}.</span>
                            <input className="form-input" placeholder={`Lựa chọn ${i + 1}`} value={o}
                              onChange={(e) => setOpt(q.key, i, e.target.value)} />
                            <button type="button" className="csm-icon-btn" title="Xóa lựa chọn"
                              disabled={q.options.length <= 2} onClick={() => removeOpt(q.key, i)}>
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" className="csm-add sm" onClick={() => addOpt(q.key)}>
                        <Plus size={13} /> Thêm lựa chọn
                      </button>
                    </>
                  )}
                </div>
              ))}

              <button type="button" className="csm-add" onClick={() => setQuestions((qs) => [...qs, newQuestion()])}>
                <Plus size={15} /> Thêm câu hỏi
              </button>
            </div>

            {/* Đối tượng */}
            <div className="csm-section">
              <div className="csm-section-title"><span>Gửi cho ai?</span></div>
              <div className="csm-seg">
                <button type="button" className={audience === 'all' ? 'on' : ''} onClick={() => setAudience('all')}>
                  Tất cả ({activeCustomers.length})
                </button>
                <button type="button" className={audience === 'select' ? 'on' : ''} onClick={() => setAudience('select')}>
                  Chọn khách hàng
                </button>
                <button type="button" className={audience === 'later' ? 'on' : ''} onClick={() => setAudience('later')}>
                  Gửi sau
                </button>
              </div>

              {audience === 'select' && (
                <>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-muted)' }} />
                    <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Tìm theo tên, SĐT..."
                      value={custSearch} onChange={(e) => setCustSearch(e.target.value)} />
                  </div>
                  <div className="csm-customers">
                    {shownCustomers.map((c) => (
                      <div key={c.customerId}
                        className={`csm-chip ${selected.has(c.customerId) ? 'sel' : ''}`}
                        onClick={() => toggleCustomer(c.customerId)}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{c.fullName}</strong>
                          {c.phone && <small>{c.phone}</small>}
                        </div>
                        {selected.has(c.customerId) && <Check size={14} color="#7C3AED" />}
                      </div>
                    ))}
                    {shownCustomers.length === 0 && <span className="csm-hint">Không có khách hàng phù hợp</span>}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <span className="csm-footer-info">
              {submitting ? progress : audience === 'later' ? 'Khảo sát sẽ được tạo, chưa gửi cho khách' : `Sẽ gửi cho ${targetCount} khách hàng`}
            </span>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={15} />
              {submitting ? 'Đang xử lý...' : audience === 'later' ? 'Xác nhận tạo' : 'Xác nhận & gửi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSurveyModal;
