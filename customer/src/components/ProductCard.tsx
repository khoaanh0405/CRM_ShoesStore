import { AppColors, Radius } from '@/constants/appTheme';
import type { Product } from '@/types/product';
import { formatPrice } from '@/utils/format';
import { ImageOff } from 'lucide-react';

type Props = { product: Product; width: number | string; onClick: () => void; };

export function ProductCard({ product, width, onClick }: Props) {
  const soldOut = product.stockQuantity <= 0;
  const fixed = typeof width === 'number';
  return (
    <div onClick={onClick} style={{ width, borderRadius: Radius.lg, border: `1px solid ${AppColors.border}`, background: AppColors.surface, overflow: 'hidden', cursor: 'pointer', flexShrink: fixed ? 0 : undefined }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: AppColors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <ImageOff size={32} color={AppColors.textSecondary} />
        )}
        {soldOut ? (
          <span style={{ position: 'absolute', left: 8, top: 8, padding: '3px 8px', borderRadius: Radius.pill, background: AppColors.overlay, color: AppColors.textPrimary, fontSize: 11, fontWeight: 700 }}>Hết hàng</span>
        ) : null}
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {product.brand ? <span style={{ color: AppColors.textSecondary, fontSize: 12 }}>{product.brand}</span> : null}
        <span style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: 700, minHeight: 36, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{product.productName}</span>
        <span style={{ color: AppColors.accent, fontSize: 15, fontWeight: 800, marginTop: 2 }}>{formatPrice(product.price)}</span>
      </div>
    </div>
  );
}
