import { AppButton } from '@/components/AppButton';
import { Chip } from '@/components/Chip';
import { RatingStars } from '@/components/RatingStars';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { StatusBadge, type BadgeTone } from '@/components/StatusBadge';
import { AppColors, Radius } from '@/constants/appTheme';
import { FEEDBACK_STATUS } from '@/constants/domain';
import { useApi } from '@/hooks/useApi';
import { useCustomerId } from '@/hooks/useCustomerId';
import { showConfirm } from '@/lib/dialog';
import { getApiErrorMessage } from '@/services/api-client';
import { feedbackService } from '@/services/feedback.service';
import { productService } from '@/services/product.service';
import type { Feedback, FeedbackStatus } from '@/types/feedback';
import { formatDate } from '@/utils/format';
import { Plus, MessageCircle, Filter, PenLine, Undo2, Edit3, Store } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_META: Record<FeedbackStatus, { label: string; tone: BadgeTone }> = {
  Pending: { label: 'Chờ duyệt', tone: 'warning' },
  Approved: { label: 'Đã duyệt', tone: 'success' },
  Rejected: { label: 'Không được duyệt', tone: 'danger' },
};

type Filter = 'all' | FeedbackStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: FEEDBACK_STATUS.PENDING, label: STATUS_META.Pending.label },
  { key: FEEDBACK_STATUS.APPROVED, label: STATUS_META.Approved.label },
  { key: FEEDBACK_STATUS.REJECTED, label: STATUS_META.Rejected.label },
];

const TIPS = [
  'Nêu rõ chất liệu, độ vừa chân, độ êm khi sử dụng.',
  'Cho biết bạn dùng giày vào mục đích nào (đi làm, chạy bộ, chơi thể thao...).',
  'Góp ý thẳng thắn giúp cửa hàng cải thiện sản phẩm mới.',
  'Đánh giá đang chờ duyệt vẫn có thể chỉnh sửa hoặc thu hồi.',
];

/** Tab Đánh giá (mục 4.3.3): lịch sử phản hồi bên trái, thống kê + mẹo bên phải. */
export default function FeedbacksPage() {
  const navigate = useNavigate();
  const customerId = useCustomerId();
  const [filter, setFilter] = useState<Filter>('all');
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const { data, loading, error, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    const [feedbacks, products] = await Promise.all([
      feedbackService.listByCustomer(customerId),
      productService.list().catch(() => []),
    ]);
    const productNames = new Map(products.map((p) => [p.productId, p.productName]));
    return { feedbacks, productNames };
  }, [customerId]);

  const items = (data?.feedbacks ?? []).filter((f) => filter === 'all' || f.status === filter);
  const openCreate = () => navigate('/feedback/create');
  const all = data?.feedbacks ?? [];
  const avg = all.length ? all.reduce((s, f) => s + f.rating, 0) / all.length : 0;
  const count = (s: FeedbackStatus) => all.filter((f) => f.status === s).length;

  const handleWithdraw = async (f: Feedback) => {
    if (withdrawingId != null) return;
    const ok = await showConfirm({
      title: 'Thu hồi đánh giá?',
      message: 'Đánh giá đang chờ duyệt sẽ bị xóa và không thể khôi phục.',
      confirmLabel: 'Thu hồi',
      tone: 'warning',
      danger: true,
    });
    if (!ok) return;
    setWithdrawingId(f.feedbackId);
    try {
      await feedbackService.remove(f.feedbackId);
      await reload();
      alert('Đã thu hồi đánh giá.');
    } catch (e) {
      alert('Không thu hồi được: ' + getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div>
      <ScreenHeader title="Đánh giá" subtitle={data ? `${data.feedbacks.length} phản hồi đã gửi` : undefined}
        right={<AppButton label="Viết đánh giá" icon={Plus} compact onClick={openCreate} />} />

      {loading && !data ? <LoadingView /> : !data ? <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} /> : (
        <div className="page-split">
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
              {FILTERS.map((f) => <Chip key={f.key} label={f.label} selected={filter === f.key} onClick={() => setFilter(f.key)} />)}
            </div>
            <div className="card-grid">
              {items.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', background: '#fff', border: `1px solid ${AppColors.border}`, borderRadius: Radius.lg }}>
                  {data.feedbacks.length === 0 ? (
                    <EmptyView icon={MessageCircle} title="Bạn chưa gửi đánh giá nào" message="Chia sẻ cảm nhận về đôi giày bạn đã mua để giúp người khác chọn tốt hơn." actionLabel="Viết đánh giá đầu tiên" onAction={openCreate} />
                  ) : (
                    <EmptyView icon={Filter} title="Không có phản hồi nào ở trạng thái này" />
                  )}
                </div>
              ) : items.map((item) => (
                <FeedbackCard
                  key={item.feedbackId}
                  feedback={item}
                  productName={data.productNames.get(item.productId) ?? `Sản phẩm #${item.productId}`}
                  onOpenProduct={() => navigate(`/product/${item.productId}`)}
                  onEdit={() => navigate(`/feedback/${item.feedbackId}/edit`)}
                  onWithdraw={() => handleWithdraw(item)}
                  withdrawing={withdrawingId === item.feedbackId}
                />
              ))}
            </div>
          </div>

          <aside className="side-stack">
            <div className="panel">
              <div className="panel-title" style={{ marginBottom: 12 }}>Thống kê đánh giá</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{all.length ? avg.toFixed(1) : '—'}</span>
                <RatingStars value={avg} size={18} />
              </div>
              <div className="stat-row"><span style={{ color: AppColors.textSecondary, fontSize: 14 }}>Đã duyệt</span><b>{count('Approved')}</b></div>
              <div className="stat-row"><span style={{ color: AppColors.textSecondary, fontSize: 14 }}>Chờ duyệt</span><b>{count('Pending')}</b></div>
              <div className="stat-row"><span style={{ color: AppColors.textSecondary, fontSize: 14 }}>Không được duyệt</span><b>{count('Rejected')}</b></div>
            </div>
            <div className="panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <PenLine size={20} />
                <div className="panel-title" style={{ fontSize: 16 }}>Mẹo viết đánh giá hữu ích</div>
              </div>
              <ul className="tip-list">{TIPS.map((t) => <li key={t}><span>•</span><span>{t}</span></li>)}</ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function FeedbackCard({ feedback, productName, onOpenProduct, onEdit, onWithdraw, withdrawing }: {
  feedback: Feedback; productName: string; onOpenProduct: () => void; onEdit: () => void; onWithdraw: () => void; withdrawing: boolean;
}) {
  const meta = STATUS_META[feedback.status] ?? STATUS_META.Pending;
  const replies = feedback.replies ?? [];
  const isPending = feedback.status === FEEDBACK_STATUS.PENDING;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 18, borderRadius: Radius.lg, border: `1px solid ${AppColors.border}`, background: AppColors.surface }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <button onClick={onOpenProduct} style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', textAlign: 'left' }}>
          <span style={{ color: AppColors.accent, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{productName}</span>
        </button>
        <StatusBadge label={meta.label} tone={meta.tone} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <RatingStars value={feedback.rating} size={14} />
        <span style={{ color: AppColors.textSecondary, fontSize: 12 }}>{formatDate(feedback.createdAt)}</span>
      </div>
      <span style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: 800 }}>{feedback.title}</span>
      <span style={{ color: AppColors.textSecondary, fontSize: 14, lineHeight: '20px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as any }}>{feedback.content}</span>

      {/* Phản hồi của cửa hàng */}
      {replies.map((r) => (
        <div key={r.replyId} style={{ marginTop: 4, padding: '10px 12px', borderRadius: Radius.md, background: AppColors.background, borderLeft: `3px solid ${AppColors.accent}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: AppColors.textPrimary }}>
            <Store size={13} /> Phản hồi từ cửa hàng
            <span style={{ fontWeight: 500, color: AppColors.textSecondary }}>· {formatDate(r.createdAt)}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 13.5, lineHeight: '19px', color: AppColors.textPrimary, whiteSpace: 'pre-wrap' }}>{r.content}</div>
        </div>
      ))}

      {isPending ? (
        <div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <AppButton label="Chỉnh sửa" icon={Edit3} variant="secondary" compact onClick={onEdit} />
          <AppButton label="Thu hồi đánh giá" icon={Undo2} variant="danger" compact loading={withdrawing} onClick={onWithdraw} />
        </div>
      ) : null}
    </div>
  );
}