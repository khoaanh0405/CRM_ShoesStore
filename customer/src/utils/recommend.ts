import type { Product } from '@/types/product';

export function matchesPreference(product: Product, tag: string): boolean {
  return !!product.category && product.category === tag;
}

export function recommendProducts(products: Product[], tags: string[]): Product[] {
  if (tags.length === 0) return [];
  return products
    .filter((p) => tags.some((t) => matchesPreference(p, t)))
    .sort((a, b) => b.productId - a.productId);
}
