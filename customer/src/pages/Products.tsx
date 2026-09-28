import { ProductGrid } from '@/components/ProductGrid';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { AppColors, Radius } from '@/constants/appTheme';
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

/** Trang Sản phẩm: sidebar bộ lọc cố định bên trái + lưới sản phẩm (GET /products/search). */
export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [priceKey, setPriceKey] = useState('all');
  const [sortKey, setSortKey] = useState('new');
  const [showFilters, setShowFilters] = useState(false); // chỉ dùng trên màn hình hẹp

  useEffect(() => {
    setCategory(searchParams.get('category'));
    setKeyword(searchParams.get('keyword') ?? '');
  }, [searchParams]);

  const debouncedKeyword = useDebouncedValue(keyword.trim(), 350);

  const { data: allProducts } = useApi(() => productService.list(), []);
  const categories = uniqueSorted(allProducts?.map((p) => p.category));
  const brands = uniqueSorted(allProducts?.map((p) => p.brand));
  const countBy = (field: 'category' | 'brand', v: string) => allProducts?.filter((p) => p[field] === v).length ?? 0;

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

  const activeFilterCount = (category ? 1 : 0) + (brand ? 1 : 0) + (priceKey !== 'all' ? 1 : 0) + (sortKey !== 'new' ? 1 : 0);
  const resetFilters = () => { setCategory(null); setBrand(null); setPriceKey('all'); setSortKey('new'); };
  const openProduct = (p: Product) => navigate(`/product/${p.productId}`);

  return (
    <div>
      <ScreenHeader title="Sản phẩm" subtitle={data ? `${data.length} sản phẩm` : undefined} right={fetching && data ? <Loader2 size={18} color={AppColors.accent} className="spin" /> : undefined} />

      <div className="shop-layout">
        <aside className={`shop-side${showFilters ? ' open' : ''}`}>
          <SideGroup title="Danh mục">
            <Opt label="Tất cả" active={category === null} onClick={() => setCategory(null)} count={allProducts?.length} />
            {categories.map((c) => <Opt key={c} label={c} active={category === c} onClick={() => setCategory(c)} count={countBy('category', c)} />)}
          </SideGroup>
          <SideGroup title="Thương hiệu">
            <Opt label="Tất cả" active={brand === null} onClick={() => setBrand(null)} />
            {brands.map((b) => <Opt key={b} label={b} active={brand === b} onClick={() => setBrand(b)} count={countBy('brand', b)} />)}
          </SideGroup>
          <SideGroup title="Khoảng giá">
            {PRICE_RANGES.map((r) => <Opt key={r.key} label={r.label} active={priceKey === r.key} onClick={() => setPriceKey(r.key)} />)}
          </SideGroup>
          <SideGroup title="Sắp xếp">
            {SORTS.map((s) => <Opt key={s.key} label={s.label} active={sortKey === s.key} onClick={() => setSortKey(s.key)} />)}
          </SideGroup>
          {activeFilterCount > 0 ? <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: AppColors.accent, fontSize: 13, fontWeight: 700, textDecoration: 'underline' }}>Xóa bộ lọc</button> : null}
        </aside>

        <div style={{ minWidth: 0 }}>
          <div className="shop-toolbar">
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRadius: Radius.md, border: `1px solid ${AppColors.border}`, background: AppColors.surface }}>
              <Search size={18} color={AppColors.textSecondary} />
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm tên giày..." style={{ flex: 1, minHeight: 50, background: 'transparent', border: 'none', outline: 'none', color: AppColors.textPrimary, fontSize: 15 }} />
              {keyword ? <button onClick={() => setKeyword('')} aria-label="Xóa từ khóa" style={{ background: 'none', border: 'none', display: 'flex' }}><X size={18} color={AppColors.textSecondary} /></button> : null}
            </div>
            <button className="filter-toggle" onClick={() => setShowFilters((v) => !v)} aria-label="Bộ lọc" style={{ background: showFilters || activeFilterCount > 0 ? AppColors.accent : AppColors.surface }}>
              <SlidersHorizontal size={20} color={showFilters || activeFilterCount > 0 ? AppColors.accentText : AppColors.textPrimary} />
              {activeFilterCount > 0 ? <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, background: AppColors.danger, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilterCount}</span> : null}
            </button>
          </div>

          {loading && !data ? <LoadingView /> : !data ? <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} /> : (
            data.length === 0 ? (
              <EmptyView icon={Search} title="Không tìm thấy sản phẩm" message="Thử đổi từ khóa hoặc bỏ bớt bộ lọc."
                actionLabel={keyword || activeFilterCount > 0 ? 'Xóa tất cả bộ lọc' : undefined}
                onAction={() => { setKeyword(''); resetFilters(); }} />
            ) : (
              <ProductGrid products={data} onOpen={openProduct} />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function SideGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="side-title">{title}</div>
      <div className="opt-list">{children}</div>
    </div>
  );
}

function Opt({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button className={`opt${active ? ' active' : ''}`} onClick={onClick}>
      <span>{label}</span>{count !== undefined ? <small>{count}</small> : null}
    </button>
  );
}

function uniqueSorted(values?: (string | null | undefined)[]): string[] {
  if (!values) return [];
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b));
}
