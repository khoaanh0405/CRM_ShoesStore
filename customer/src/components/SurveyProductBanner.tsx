import { AppColors, Radius } from '@/constants/appTheme';
import type { SurveyProduct } from '@/types/survey';
import { formatPrice } from '@/utils/format';
import { ChevronRight, ImageOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/** Thẻ sản phẩm hiển thị trong khảo sát gắn với 1 mẫu giày cụ thể. */
export function SurveyProductBanner({ product, compact = false }: { product: SurveyProduct; compact?: boolean }) {
  const navigate = useNavigate();
  const size = compact ? 44 : 72;
  return (
    <div
      onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.productId}`); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: compact ? 8 : 12, cursor: 'pointer',
        borderRadius: Radius.md, border: `1px solid ${AppColors.border}`, background: AppColors.background,
      }}
    >
      <div style={{ width: size, height: size, borderRadius: Radius.sm, overflow: 'hidden', flexShrink: 0, background: AppColors.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {product.imageUrl ? <img src={product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageOff size={20} color={AppColors.textSecondary} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: AppColors.textSecondary, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Khảo sát về sản phẩm</div>
        <div style={{ color: AppColors.textPrimary, fontSize: compact ? 14 : 16, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.productName}</div>
        <div style={{ color: AppColors.textSecondary, fontSize: 12.5 }}>{[product.brand, formatPrice(product.price)].filter(Boolean).join(' • ')}</div>
      </div>
      {!compact ? <ChevronRight size={18} color={AppColors.textSecondary} /> : null}
    </div>
  );
}
