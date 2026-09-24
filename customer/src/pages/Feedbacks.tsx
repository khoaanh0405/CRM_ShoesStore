import { AppButton } from '@/components/AppButton';
import { Chip } from '@/components/Chip';
import { RatingStars } from '@/components/RatingStars';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { StatusBadge, type BadgeTone } from '@/components/StatusBadge';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { FEEDBACK_STATUS } from '@/constants/domain';
import { useApi } from '@/hooks/useApi';
import { useCustomerId } from '@/hooks/useCustomerId';
import { feedbackService } from '@/services/feedback.service';
import { productService } from '@/services/product.service';
import type { Feedback, FeedbackStatus } from '@/types/feedback';
import { formatDate } from '@/utils/format';
import { Plus, MessageCircle, Filter } from 'lucide-react';
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

/** Tab Đánh giá (mục 4.3.3): lịch sử phản hồi + lối vào màn viết đánh giá mới. */
export default function FeedbacksPage() {
  const navigate = useNavigate();
  const customerId = useCustomerId();
  const [filter, setFilter] = useState<Filter>('all');

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

  return (
    <div>
      <ScreenHeader title="Đánh giá" subtitle={data ? `${data.feedbacks.length} phản hồi đã gửi` : undefined}
        right={<AppButton label="Viết đánh giá" icon={Plus} compact onClick={openCreate} />} />

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: `0 ${SCREEN_PADDING}px 12px` }}>
        {FILTERS.map((f) => <Chip key={f.key} label={f.label} selected={filter === f.key} onClick={() => setFilter(f.key)} />)}
      </div>

      {loading && !data ? <LoadingView /> : !data ? <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: `0 ${SCREEN_PADDING}px 24px` }}>
          {items.length === 0 ? (
            data.feedbacks.length === 0 ? (
              <EmptyView icon={MessageCircle} title="Bạn chưa gửi đánh giá nào" message="Chia sẻ cảm nhận về đôi giày bạn đã mua để giúp người khác chọn tốt hơn." actionLabel="Viết đánh giá đầu tiên" onAction={openCreate} />
            ) : (
              <EmptyView icon={Filter} title="Không có phản hồi nào ở trạng thái này" />
            )
          ) : items.map((item) => (
            <FeedbackCard key={item.feedbackId} feedback={item} productName={data.productNames.get(item.productId) ?? `Sản phẩm #${item.productId}`} onOpenProduct={() => navigate(`/product/${item.productId}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackCard({ feedback, productName, onOpenProduct }: { feedback: Feedback; productName: string; onOpenProduct: () => void; }) {
  const meta = STATUS_META[feedback.status] ?? STATUS_META.Pending;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, borderRadius: Radius.lg, border: `1px solid ${AppColors.border}`, background: AppColors.surface }}>
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
    </div>
  );
}
