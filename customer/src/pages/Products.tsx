import { ProductCard } from '@/components/ProductCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Chip } from '@/components/Chip';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { useApi } from '@/hooks/useApi';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { productService } from '@/services/product.service';
import type { Product, ProductSortBy } from '@/types/product';
import { Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SORTS: { key: string; label: string; sortBy: ProductSortBy; sortOrder: 'asc' | 'desc' }[] = [
  { key: 'new', label: 'Mới nhất', sortBy: 'productId', sortOrder: 'desc' },
  { key: 'priceAsc', label: 'Giá tăng dần', sortBy: 'price', sortOrder: 'asc' },
  { key: 'priceDesc', label: 'Giá giảm dần', sortBy: 'price', sortOrder: 'desc' },
  { key: 'name', label: 'Tên A-Z', sortBy: 'productName', sortOrder: 'asc' },
];

const PRICE_RANGES: { key: string; label: string; min?: number; max?: number }[] = [
  { key: 'all', label: 'Mọi mức giá' },
  { key: 'u500', label: 'Dưới 500K', max: 500_000 },
  { key: '500-1m', label: '500K - 1 triệu', min: 500_000, max: 1_000_000 },
  { key: '1m-2m', label: '1 - 2 triệu', min: 1_000_000, max: 2_000_000 },
  { key: 'o2m', label: 'Trên 2 triệu', min: 2_000_000 },
];

/** Tab Sản phẩm: tìm kiếm/lọc/sắp xếp — gọi GET /products/search (mục II.2). */
export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [priceKey, setPriceKey] = useState('all');
  const [sortKey, setSortKey] = useState('new');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const c = searchParams.get('category');
    if (c) setCategory(c);
  }, [searchParams]);

  const debouncedKeyword = useDebouncedValue(keyword.trim(), 350);

  const { data: allProducts } = useApi(() => productService.list(), []);
  const categories = uniqueSorted(allProducts?.map((p) => p.category));
  const brands = uniqueSorted(allProducts?.map((p) => p.brand));

  const { data, loading, fetching, error, reload } = useApi(() => {
    const price = PRICE_RANGES.find((r) => r.key === priceKey);
    const sort = SORTS.find((s) => s.key === sortKey) ?? SORTS[0];
    return productService.search({
      keyword: debouncedKeyword || undefined,
      category: category ?? undefined,
      brand: brand ?? undefined,
      minPrice: price?.min,
      maxPrice: price?.max,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    });
  }, [debouncedKeyword, category, brand, priceKey, sortKey]);

  const activeFilterCount = (brand ? 1 : 0) + (priceKey !== 'all' ? 1 : 0) + (sortKey !== 'new' ? 1 : 0);

  const resetFilters = () => { setBrand(null); setPriceKey('all'); setSortKey('new'); };
  const openProduct = (p: Product) => navigate(`/product/${p.productId}`);

  return (
    <div>
      <ScreenHeader title="Sản phẩm" subtitle={data ? `${data.length} sản phẩm` : undefined} right={fetching && data ? <Loader2 size={18} color={AppColors.accent} className="spin" /> : undefined} />

      <div style={{ display: 'flex', gap: 10, padding: `0 ${SCREEN_PADDING}px 12px` }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderRadius: Radius.md, border: `1px solid ${AppColors.border}`, background: AppColors.surface }}>
          <Search size={18} color={AppColors.textSecondary} />
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm tên giày..." style={{ flex: 1, minHeight: 48, background: 'transparent', border: 'none', outline: 'none', color: AppColors.textPrimary, fontSize: 15 }} />
          {keyword ? <button onClick={() => setKeyword('')} aria-label="Xóa từ khóa" style={{ background: 'none', border: 'none', display: 'flex' }}><X size={18} color={AppColors.textSecondary} /></button> : null}
        </div>
        <button onClick={() => setShowFilters((v) => !v)} aria-label="Bộ lọc" style={{
          position: 'relative', width: 48, height: 48, borderRadius: Radius.md, border: `1px solid ${AppColors.border}`,
          background: showFilters || activeFilterCount > 0 ? AppColors.accent : AppColors.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SlidersHorizontal size={20} color={showFilters || activeFilterCount > 0 ? AppColors.accentText : AppColors.textPrimary} />
          {activeFilterCount > 0 ? (
            <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, background: AppColors.danger, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilterCount}</span>
          ) : null}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: `0 ${SCREEN_PADDING}px 12px` }}>
        <Chip label="Tất cả" selected={category === null} onClick={() => setCategory(null)} />
        {categories.map((c) => <Chip key={c} label={c} selected={category === c} onClick={() => setCategory(c)} />)}
      </div>

      {showFilters ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: `0 ${SCREEN_PADDING}px 12px`, padding: 14, borderRadius: Radius.lg, border: `1px solid ${AppColors.border}`, background: AppColors.surface }}>
          <FilterGroup title="Thương hiệu">
            <Chip label="Tất cả" selected={brand === null} onClick={() => setBrand(null)} />
            {brands.map((b) => <Chip key={b} label={b} selected={brand === b} onClick={() => setBrand(b)} />)}
          </FilterGroup>
          <FilterGroup title="Khoảng giá">
            {PRICE_RANGES.map((r) => <Chip key={r.key} label={r.label} selected={priceKey === r.key} onClick={() => setPriceKey(r.key)} />)}
          </FilterGroup>
          <FilterGroup title="Sắp xếp">
            {SORTS.map((s) => <Chip key={s.key} label={s.label} selected={sortKey === s.key} onClick={() => setSortKey(s.key)} />)}
          </FilterGroup>
          {activeFilterCount > 0 ? <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: AppColors.accent, fontSize: 13, fontWeight: 700 }}>Xóa bộ lọc</button> : null}
        </div>
      ) : null}

      {loading && !data ? <LoadingView /> : !data ? <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} /> : (
        data.length === 0 ? (
          <EmptyView icon={Search} title="Không tìm thấy sản phẩm" message="Thử đổi từ khóa hoặc bỏ bớt bộ lọc."
            actionLabel={keyword || category || activeFilterCount > 0 ? 'Xóa tất cả bộ lọc' : undefined}
            onAction={() => { setKeyword(''); setCategory(null); resetFilters(); }} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: `0 ${SCREEN_PADDING}px 24px` }}>
            {data.map((p) => <ProductCard key={p.productId} product={p} width="100%" onClick={() => openProduct(p)} />)}
          </div>
        )
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ color: AppColors.textSecondary, fontSize: 12, fontWeight: 700 }}>{title}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </div>
  );
}

function uniqueSorted(values?: (string | null | undefined)[]): string[] {
  if (!values) return [];
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b));
}
