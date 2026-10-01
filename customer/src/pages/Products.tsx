import { Chip } from '@/components/Chip';
import { Pagination } from '@/components/Pagination';
import { ProductGrid } from '@/components/ProductGrid';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { AppColors } from '@/constants/appTheme';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useCustomerId } from '@/hooks/useCustomerId';
import { customerService } from '@/services/customer.service';
import { productService } from '@/services/product.service';
import { surveyService } from '@/services/survey.service';
import type { CustomerPreference } from '@/types/customer';
import type { Product } from '@/types/product';
import type { SurveyTarget } from '@/types/survey';
import { categoryLabel } from '@/utils/category';
import { recommendProducts } from '@/utils/recommend';
import { Loader2, Lock, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Focus = 'all' | 'prefs' | 'survey';

const PAGE_SIZE = 12; // 4 cột × 3 hàng

/**
 * Trang Sản phẩm: thanh tab ngang (Tất cả | Hợp sở thích | Có khảo sát cần làm)
 * + nút "Bộ lọc nâng cao" (Danh mục, Thương hiệu) ở góc phải.
 */
export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { status } = useAuth();
  const customerId = useCustomerId();
  const signedIn = status === 'signedIn' && customerId != null;

  const [category, setCategory] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus>('all');
  const [advOpen, setAdvOpen] = useState(false);
  const [page, setPage] = useState(1);
  const advRef = useRef<HTMLDivElement>(null);

  // Từ khóa chỉ đến từ ô tìm kiếm trên header (?keyword=...)
  const keyword = (searchParams.get('keyword') ?? '').trim();

  useEffect(() => {
    setCategory(searchParams.get('category'));
  }, [searchParams]);

  // Đóng bảng bộ lọc nâng cao khi bấm ra ngoài / nhấn Esc
  useEffect(() => {
    if (!advOpen) return;
    const onDown = (e: MouseEvent) => { if (advRef.current && !advRef.current.contains(e.target as Node)) setAdvOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAdvOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [advOpen]);

  // Đổi bộ lọc / tab / từ khóa thì quay về trang 1
  useEffect(() => { setPage(1); }, [keyword, category, brand, focus]);

  const { data: allProducts } = useApi(() => productService.list(), []);
  const categories = uniqueSorted(allProducts?.map((p) => p.category));
  const brands = uniqueSorted(allProducts?.map((p) => p.brand));
  const countBy = (field: 'category' | 'brand', v: string) => allProducts?.filter((p) => p[field] === v).length ?? 0;

  const { data: personal } = useApi(async () => {
    if (!signedIn || customerId == null) return null;
    const [surveys, prefs] = await Promise.all([
      surveyService.listByCustomer(customerId).catch(() => [] as SurveyTarget[]),
      customerService.listPreferences(customerId).catch(() => [] as CustomerPreference[]),
    ]);
    const surveyIds = new Set<number>();
    surveys.forEach((t) => {
      const pid = t.survey.productId ?? t.survey.product?.productId;
      if (!t.isCompleted && t.survey.isActive && pid != null) surveyIds.add(pid);
    });
    return { surveyIds, tags: prefs.map((p) => p.preferenceTag) };
  }, [signedIn, customerId]);

  const surveyIds = personal?.surveyIds ?? new Set<number>();
  const prefIds = new Set(recommendProducts(allProducts ?? [], personal?.tags ?? []).map((p) => p.productId));

  const { data, loading, fetching, error, reload } = useApi(
    () => productService.search({
      keyword: keyword || undefined,
      category: category ?? undefined,
      brand: brand ?? undefined,
      sortBy: 'productId',
      sortOrder: 'desc',
    }),
    [keyword, category, brand],
  );

  const shown = data?.filter((p) => focus === 'all' || (focus === 'prefs' ? prefIds.has(p.productId) : surveyIds.has(p.productId)));
  const totalItems = shown?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = shown?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) ?? [];
  const goToPage = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const badgeIds = focus === 'prefs' ? prefIds : surveyIds;
  const badgeLabel = focus === 'prefs' ? 'Hợp sở thích' : 'Có khảo sát';

  const advCount = (category ? 1 : 0) + (brand ? 1 : 0);
  const activeFilterCount = advCount + (focus !== 'all' ? 1 : 0) + (keyword ? 1 : 0);

  const clearKeyword = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('keyword');
    setSearchParams(next, { replace: true });
  };
  const clearCategory = () => {
    setCategory(null);
    if (searchParams.has('category')) {
      const next = new URLSearchParams(searchParams);
      next.delete('category');
      setSearchParams(next, { replace: true });
    }
  };
  const clearAdvanced = () => { clearCategory(); setBrand(null); };
  const resetFilters = () => {
    setCategory(null); setBrand(null); setFocus('all');
    setSearchParams({}, { replace: true });
  };
  const openProduct = (p: Product) => navigate(`/product/${p.productId}`);

  const TABS: { key: Focus; label: string; count?: number; needLogin?: boolean }[] = [
    { key: 'all', label: 'Tất cả sản phẩm', count: allProducts?.length },
    { key: 'prefs', label: 'Hợp sở thích', count: signedIn ? prefIds.size : undefined, needLogin: true },
    { key: 'survey', label: 'Có khảo sát cần làm', count: signedIn ? surveyIds.size : undefined, needLogin: true },
  ];

  return (
    <div>
      <ScreenHeader title="Sản phẩm" right={fetching && data ? <Loader2 size={18} color={AppColors.accent} className="spin" /> : undefined} />

      <div className="pf-bar">
        <div className="pf-tabs" role="tablist" aria-label="Lọc sản phẩm theo nhu cầu">
          {TABS.map((t) => {
            const locked = !!t.needLogin && !signedIn;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={focus === t.key}
                className={`pf-tab${focus === t.key ? ' active' : ''}${locked ? ' locked' : ''}`}
                title={locked ? 'Đăng nhập để sử dụng' : undefined}
                onClick={() => (locked ? navigate('/auth/login') : setFocus(t.key))}
              >
                {locked ? <Lock size={14} /> : null}
                <span>{t.label}</span>
                {t.count !== undefined ? <span className="pf-count">{t.count}</span> : null}
              </button>
            );
          })}
        </div>

        <div className="pf-adv" ref={advRef}>
          <button className={`pf-adv-btn${advCount > 0 || advOpen ? ' on' : ''}`} onClick={() => setAdvOpen((v) => !v)} aria-expanded={advOpen}>
            <SlidersHorizontal size={17} />
            <span>Bộ lọc nâng cao</span>
            {advCount > 0 ? <span className="pf-badge">{advCount}</span> : null}
          </button>

          {advOpen ? (
            <div className="pf-pop" role="dialog" aria-label="Bộ lọc nâng cao">
              <div>
                <div className="pf-group-title">Danh mục</div>
                <div className="pf-wrap">
                  <Chip label="Tất cả" selected={category === null} onClick={clearCategory} />
                  {categories.map((c) => <Chip key={c} label={`${categoryLabel(c)} (${countBy('category', c)})`} selected={category === c} onClick={() => setCategory(c)} />)}
                </div>
              </div>
              <div>
                <div className="pf-group-title">Thương hiệu</div>
                <div className="pf-wrap">
                  <Chip label="Tất cả" selected={brand === null} onClick={() => setBrand(null)} />
                  {brands.map((b) => <Chip key={b} label={`${b} (${countBy('brand', b)})`} selected={brand === b} onClick={() => setBrand(b)} />)}
                </div>
              </div>
              <div className="pf-pop-foot">
                <button className="pf-link" onClick={clearAdvanced} disabled={advCount === 0} style={{ opacity: advCount === 0 ? 0.4 : 1 }}>Xóa bộ lọc</button>
                <button className="pf-adv-btn on" onClick={() => setAdvOpen(false)} style={{ height: 38 }}>Xem {shown ? shown.length : ''} sản phẩm</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {category || brand || keyword ? (
        <div className="pf-active">
          <span>Đang lọc:</span>
          {category ? <Chip label={`Danh mục: ${categoryLabel(category)}`} selected onClick={clearCategory} onRemove={clearCategory} /> : null}
          {brand ? <Chip label={`Thương hiệu: ${brand}`} selected onClick={() => setBrand(null)} onRemove={() => setBrand(null)} /> : null}
          {keyword ? <Chip label={`Từ khóa: “${keyword}”`} selected onClick={clearKeyword} onRemove={clearKeyword} /> : null}
        </div>
      ) : null}

      <div style={{ padding: '16px 20px 0' }}>
        {loading && !data ? <LoadingView /> : !shown ? <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} /> : (
          shown.length === 0 ? (
            <EmptyView icon={Search} title="Không tìm thấy sản phẩm" message="Thử đổi tab hoặc bỏ bớt bộ lọc."
              actionLabel={activeFilterCount > 0 ? 'Xóa tất cả bộ lọc' : undefined} onAction={resetFilters} />
          ) : (
            <>
              <ProductGrid products={pageItems} onOpen={openProduct} highlightIds={focus === 'all' ? undefined : badgeIds} highlightLabel={badgeLabel} />
              <Pagination page={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onChange={goToPage} />
            </>
          )
        )}
      </div>
    </div>
  );
}

function uniqueSorted(values?: (string | null | undefined)[]): string[] {
  if (!values) return [];
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b));
}
