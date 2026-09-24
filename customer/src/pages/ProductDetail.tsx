import { AppButton } from '@/components/AppButton';
import { Card } from '@/components/Card';
import { RatingStars } from '@/components/RatingStars';
import { SectionTitle } from '@/components/SectionTitle';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { FEEDBACK_STATUS } from '@/constants/domain';
import { useApi } from '@/hooks/useApi';
import { productService } from '@/services/product.service';
import { formatDate, formatPrice } from '@/utils/format';
import { ChevronLeft, Edit3, ImageOff } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

/** Chi tiết sản phẩm + đánh giá đã được duyệt + nút "Viết đánh giá" (mục 4.3.3). */
export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const { data, loading, error, reload } = useApi(async () => {
    const [product, feedbacks] = await Promise.all([
      productService.getById(productId),
      productService.listFeedbacks(productId).catch(() => []),
    ]);
    return { product, feedbacks };
  }, [productId]);

  const goBack = () => navigate(-1);

  if (loading && !data) return <LoadingView />;
  if (!data) return <ErrorView message={error ?? 'Không tìm thấy sản phẩm.'} onRetry={reload} />;

  const { product } = data;
  const approved = data.feedbacks.filter((f) => f.status === FEEDBACK_STATUS.APPROVED);
  const average = approved.length > 0 ? approved.reduce((sum, f) => sum + f.rating, 0) / approved.length : 0;
  const soldOut = product.stockQuantity <= 0;

  const specs: [string, string | null][] = [
    ['Thương hiệu', product.brand],
    ['Danh mục', product.category],
    ['Kích cỡ', product.size],
    ['Màu sắc', product.color],
    ['Chất liệu', product.material],
    ['Tình trạng', soldOut ? 'Hết hàng' : `Còn ${product.stockQuantity} sản phẩm`],
  ];

  return (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
    <div className="pd-grid">
      <div style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: Radius.lg, overflow: 'hidden', background: AppColors.surface, border: `1px solid ${AppColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {product.imageUrl ? <img src={product.imageUrl} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageOff size={48} color={AppColors.textSecondary} />}
        <button onClick={goBack} aria-label="Quay lại" style={{ position: 'absolute', left: 12, top: 12, width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: AppColors.overlay, border: `1px solid ${AppColors.border}` }}>
          <ChevronLeft size={22} color={AppColors.textPrimary} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ color: AppColors.textPrimary, fontSize: 30, fontWeight: 800, lineHeight: '38px' }}>{product.productName}</h1>
        <span style={{ color: AppColors.accent, fontSize: 26, fontWeight: 800 }}>{formatPrice(product.price)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RatingStars value={average} size={18} />
          <span style={{ color: AppColors.textSecondary, fontSize: 13 }}>{approved.length > 0 ? `${average.toFixed(1)} (${approved.length} đánh giá)` : 'Chưa có đánh giá'}</span>
        </div>
        <Card style={{ paddingTop: 4, paddingBottom: 4 }}>
          {specs.map(([label, value], index) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderTop: index > 0 ? `1px solid ${AppColors.border}` : 'none' }}>
              <span style={{ color: AppColors.textSecondary, fontSize: 14 }}>{label}</span>
              <span style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{value || '—'}</span>
            </div>
          ))}
        </Card>
        <AppButton label="Viết đánh giá" icon={Edit3} onClick={() => navigate(`/feedback/create?productId=${productId}`)} />
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTitle title="Đánh giá của khách hàng" />
      {approved.length === 0 ? (
        <span style={{ color: AppColors.textSecondary, fontSize: 13, padding: `0 ${SCREEN_PADDING}px` }}>Chưa có đánh giá nào được hiển thị. Hãy là người đầu tiên chia sẻ trải nghiệm.</span>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, padding: `0 ${SCREEN_PADDING}px` }}>
          {approved.map((f) => (
            <Card key={f.feedbackId} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <RatingStars value={f.rating} size={14} />
                <span style={{ color: AppColors.textSecondary, fontSize: 12 }}>{formatDate(f.createdAt)}</span>
              </div>
              <span style={{ color: AppColors.textPrimary, fontSize: 15, fontWeight: 700 }}>{f.title}</span>
              <span style={{ color: AppColors.textSecondary, fontSize: 14, lineHeight: '20px' }}>{f.content}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  </div>
);
}
