import type { Product } from '@/types/product';

/** Từ khóa tiếng Việt tương ứng với category (tiếng Anh) trong dữ liệu sản phẩm. */
const CATEGORY_ALIASES: Record<string, string> = {
  sneaker: 'sneaker thể thao',
  running: 'chạy bộ thể thao',
  basketball: 'bóng rổ thể thao',
  heels: 'cao gót',
  sandal: 'sandal dép',
};

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function productKeywords(p: Product): Set<string> {
  const category = (p.category ?? '').toLowerCase();
  return new Set(
    words(
      [p.category, CATEGORY_ALIASES[category], p.brand, p.material, p.productName]
        .filter(Boolean)
        .join(' ')
    )
  );
}

/** Sản phẩm có khớp với 1 sở thích (vd "Giày Chạy Bộ") không. */
export function matchesPreference(product: Product, tag: string): boolean {
  const tagWords = words(tag).filter((w) => w !== 'giày');
  if (tagWords.length === 0) return false;
  const keywords = productKeywords(product);
  return tagWords.every((w) => keywords.has(w));
}

/** Gợi ý theo sở thích: sản phẩm khớp nhiều sở thích nhất đứng trước. */
export function recommendProducts(products: Product[], tags: string[]): Product[] {
  if (tags.length === 0) return [];
  return products
    .map((p) => ({ p, score: tags.filter((t) => matchesPreference(p, t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.productId - a.p.productId)
    .map((x) => x.p);
}
