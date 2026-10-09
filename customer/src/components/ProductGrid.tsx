import type { Product } from '@/types/product';
import { Sparkles } from 'lucide-react';
import { AppButton } from './AppButton';
import { ProductCard } from './ProductCard';

export type GridCta = { title: string; text: string; label: string; onClick: () => void };

/**
 * Lưới sản phẩm cố định số cột. Khi có ít sản phẩm, thẻ CTA (nếu truyền) sẽ
 * chiếm hết phần trống cuối hàng để bố cục không bị hụt.
 */
export function ProductGrid({ products, onOpen, cta, cols3 = false, highlightIds, highlightLabel = 'Gợi ý cho bạn' }: { products: Product[]; onOpen: (p: Product) => void; cta?: GridCta; cols3?: boolean; highlightIds?: Set<number>; highlightLabel?: string }) {
  return (
    <div className={`product-grid${cols3 ? ' cols-3' : ''}`}>
      {products.map((p) => <ProductCard key={p.productId} product={p} width="100%" onClick={() => onOpen(p)} badge={highlightIds?.has(p.productId) ? highlightLabel : undefined} />)}
      {cta ? (
        <div className="cta-card">
          <span className="cta-icon"><Sparkles size={22} /></span>
          <h3>{cta.title}</h3>
          <p>{cta.text}</p>
          <AppButton label={cta.label} variant="secondary" compact onClick={cta.onClick} />
        </div>
      ) : null}
    </div>
  );
}
