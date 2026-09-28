import { AppButton } from '@/components/AppButton';
import { BannerCarousel } from '@/components/BannerCarousel';
import { Chip } from '@/components/Chip';
import { ProductCard } from '@/components/ProductCard';
import { SectionTitle } from '@/components/SectionTitle';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useCustomerId } from '@/hooks/useCustomerId';
import { customerService } from '@/services/customer.service';
import { productService } from '@/services/product.service';
import { surveyService } from '@/services/survey.service';
import type { CustomerPreference } from '@/types/customer';
import type { Product } from '@/types/product';
import type { SurveyTarget } from '@/types/survey';
import { formatDate } from '@/utils/format';
import { recommendProducts } from '@/utils/recommend';
import { ChevronRight, ClipboardList, Heart } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const cardBox = { borderRadius: Radius.lg, border: `1px solid ${AppColors.border}`, background: '#fff', overflow: 'hidden' } as const;
const clamp2 = { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any } as const;
const HOME_PRODUCTS = 6; // khớp 6 cột của lưới sản phẩm ở 1440px

export default function HomePage() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const customerId = useCustomerId();
  const signedIn = status === 'signedIn' && customerId != null;

  // Khách chưa đăng nhập chỉ tải sản phẩm (public); đã đăng nhập tải thêm khảo sát + sở thích.
  const { data, loading, error, reload } = useApi(async () => {
    const products = await productService.list();
    if (!signedIn || customerId == null) {
      return { products, surveys: [] as SurveyTarget[], preferences: [] as CustomerPreference[] };
    }
    const [surveys, preferences] = await Promise.all([
      surveyService.listByCustomer(customerId).catch(() => [] as SurveyTarget[]),
      customerService.listPreferences(customerId).catch(() => [] as CustomerPreference[]),
    ]);
    return { products, surveys, preferences };
  }, [customerId, signedIn]);

  if (loading && !data) return <LoadingView />;
  if (!data) return <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} />;

  const { products, surveys, preferences } = data;
  const tags = preferences.map((p) => p.preferenceTag);
  const pendingSurveys = surveys.filter((t) => !t.isCompleted && t.survey.isActive);
  const categories = Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c)));
  const recommended = signedIn ? recommendProducts(products, tags).slice(0, HOME_PRODUCTS) : [];
  // "Sản phẩm mới" bỏ các sản phẩm đã hiện ở "Gợi ý cho bạn" để không lặp
  const recommendedIds = new Set(recommended.map((p) => p.productId));
  const newest = [...products]
    .sort((a, b) => b.productId - a.productId)
    .filter((p) => !recommendedIds.has(p.productId))
    .slice(0, HOME_PRODUCTS);

  const openProduct = (p: Product) => navigate(`/product/${p.productId}`);
  const openCategory = (category: string) => navigate(`/tabs/products?category=${encodeURIComponent(category)}`);
  const pad = { padding: `0 ${SCREEN_PADDING}px` } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 32, paddingTop: 16 }}>
      <div style={pad}><BannerCarousel /></div>

      {/* Khảo sát cần làm */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...pad }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: AppColors.textPrimary, fontSize: 18, fontWeight: 800 }}>Khảo sát cần làm</div>
          {signedIn ? <button onClick={() => navigate('/tabs/surveys')} style={{ background: 'none', border: 'none', color: AppColors.textPrimary, fontSize: 13, fontWeight: 700, textDecoration: 'underline' }}>Xem tất cả</button> : null}
        </div>

        {!signedIn ? (
          <div style={{ ...cardBox, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ color: AppColors.textSecondary, fontSize: 14 }}>Đăng nhập để xem khảo sát, gửi đánh giá và nhận gợi ý sản phẩm riêng cho bạn.</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <AppButton label="Đăng nhập" compact onClick={() => navigate('/auth/login')} />
              <AppButton label="Đăng ký" compact variant="secondary" onClick={() => navigate('/auth/register')} />
            </div>
          </div>
        ) : pendingSurveys.length === 0 ? (
          <div style={cardBox}><EmptyText>Hiện không có khảo sát nào cần làm.</EmptyText></div>
        ) : (
          <div className="survey-grid">
            {pendingSurveys.map((t) => (
              <div key={t.surveyId} style={{ ...cardBox, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: Radius.md, background: AppColors.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ClipboardList size={22} color={AppColors.accent} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: AppColors.textPrimary, fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.survey.title}</div>
                  {t.survey.description ? <div style={{ color: AppColors.textSecondary, fontSize: 13, lineHeight: '18px', ...clamp2 }}>{t.survey.description}</div> : null}
                  <div style={{ color: AppColors.textSecondary, fontSize: 12, marginTop: 2 }}>Tạo ngày {formatDate(t.survey.createdAt)}</div>
                </div>
                <AppButton label="Bắt đầu" compact onClick={() => navigate(`/survey/${t.surveyId}`)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {categories.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionTitle title="Danh mục" />
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', ...pad }}>
            {categories.map((c) => <Chip key={c} label={c} onClick={() => openCategory(c)} />)}
          </div>
        </div>
      ) : null}

      {signedIn && recommended.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionTitle title="Gợi ý cho bạn" subtitle={`Theo sở thích: ${tags.slice(0, 3).join(', ')}`} actionLabel="Xem tất cả" onAction={() => navigate('/tabs/products')} />
          <ProductRow products={recommended} onOpen={openProduct} />
        </div>
      ) : signedIn ? (
        <div onClick={() => navigate('/tabs/profile?tab=prefs')} style={{
          display: 'flex', alignItems: 'center', gap: 12, margin: `0 ${SCREEN_PADDING}px`, padding: 14,
          borderRadius: Radius.lg, border: `1px dashed ${AppColors.border}`, background: '#fff', cursor: 'pointer',
        }}>
          <Heart size={22} color={AppColors.accent} />
          <div style={{ flex: 1 }}>
            <div style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: 700 }}>Chọn sở thích để nhận gợi ý</div>
            <div style={{ color: AppColors.textSecondary, fontSize: 12 }}>Chọn loại giày bạn thích trong hồ sơ người dùng.</div>
          </div>
          <ChevronRight size={18} color={AppColors.textSecondary} />
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionTitle title="Sản phẩm mới" actionLabel="Xem tất cả" onAction={() => navigate('/tabs/products')} />
        {newest.length > 0 ? <ProductRow products={newest} onOpen={openProduct} /> : (
          <span style={{ color: AppColors.textSecondary, fontSize: 13, ...pad }}>Cửa hàng chưa có sản phẩm nào.</span>
        )}
      </div>
    </div>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <div style={{ padding: 24, textAlign: 'center', color: AppColors.textSecondary, fontSize: 13 }}>{children}</div>;
}

function ProductRow({ products, onOpen }: { products: Product[]; onOpen: (p: Product) => void }) {
  return (
    <div className="product-grid" style={{ padding: `0 ${SCREEN_PADDING}px` }}>
      {products.map((p) => <ProductCard key={p.productId} product={p} width="100%" onClick={() => onOpen(p)} />)}
    </div>
  );
}