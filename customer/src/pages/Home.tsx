import { AppButton } from '@/components/AppButton';
import { BannerCarousel } from '@/components/BannerCarousel';
import { ProductGrid } from '@/components/ProductGrid';
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
import { ChevronRight, ClipboardList, Footprints, Heart } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const cardBox = { borderRadius: Radius.lg, border: `1px solid ${AppColors.border}`, background: '#fff', overflow: 'hidden' } as const;
const clamp2 = { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any } as const;
const HOME_PRODUCTS = 8;

export default function HomePage() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const customerId = useCustomerId();
  const signedIn = status === 'signedIn' && customerId != null;

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
  const categories = Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c)))
    .map((name) => ({ name, count: products.filter((p) => p.category === name).length }));
  const recommended = signedIn ? recommendProducts(products, tags).slice(0, HOME_PRODUCTS) : [];
  const recommendedIds = new Set(recommended.map((p) => p.productId));
  // Một danh sách duy nhất: sản phẩm hợp sở thích lên đầu (gắn nhãn), còn lại theo mới nhất
  const featured = [
    ...recommended,
    ...[...products].sort((a, b) => b.productId - a.productId).filter((p) => !recommendedIds.has(p.productId)),
  ].slice(0, HOME_PRODUCTS);

  const openProduct = (p: Product) => navigate(`/product/${p.productId}`);
  const openCategory = (category: string) => navigate(`/tabs/products?category=${encodeURIComponent(category)}`);
  const pad = { padding: `0 ${SCREEN_PADDING}px` } as const;

  // Thẻ CTA lấp chỗ trống khi ít sản phẩm — gắn với mục tiêu "thăm dò trước khi ra mắt sản phẩm mới"
  const launchCta = {
    title: 'Sắp ra mắt sản phẩm mới',
    text: 'Chia sẻ ý kiến qua khảo sát để cùng hoàn thiện mẫu giày tiếp theo của cửa hàng.',
    label: signedIn ? 'Tham gia khảo sát' : 'Đăng ký tham gia',
    onClick: () => navigate(signedIn ? '/tabs/surveys' : '/auth/register'),
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 32, paddingTop: 16 }}>
      <div style={pad}><BannerCarousel /></div>

      {/* Khảo sát cần làm */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...pad }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: AppColors.textPrimary, fontSize: 20, fontWeight: 800 }}>Khảo sát cần làm</div>
          {signedIn ? <button onClick={() => navigate('/tabs/surveys')} style={{ background: 'none', border: 'none', color: AppColors.textPrimary, fontSize: 14, fontWeight: 700, textDecoration: 'underline' }}>Xem tất cả</button> : null}
        </div>

        {!signedIn ? (
          <div style={{ ...cardBox, padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ color: AppColors.textSecondary, fontSize: 15 }}>Đăng nhập để xem khảo sát, gửi đánh giá và nhận gợi ý sản phẩm riêng cho bạn.</span>
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
              <div key={t.surveyId} style={{ ...cardBox, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: Radius.md, background: AppColors.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ClipboardList size={24} color={AppColors.accent} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.survey.title}</div>
                  {t.survey.description ? <div style={{ color: AppColors.textSecondary, fontSize: 13, lineHeight: '18px', ...clamp2 }}>{t.survey.description}</div> : null}
                  <div style={{ color: AppColors.textSecondary, fontSize: 12, marginTop: 2 }}>Tạo ngày {formatDate(t.survey.createdAt)}</div>
                </div>
                <AppButton label="Bắt đầu" compact onClick={() => navigate(`/survey/${t.surveyId}`)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danh mục dạng ô, tự giãn kín chiều ngang */}
      {categories.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionTitle title="Danh mục" subtitle="Chọn loại giày bạn quan tâm" />
          <div className="cat-grid" style={pad}>
            {categories.map((c) => (
              <button key={c.name} className="cat-tile" onClick={() => openCategory(c.name)}>
                <span className="cat-icon"><Footprints size={24} /></span>
                <span><b>{c.name}</b><small>{c.count} sản phẩm</small></span>
                <ChevronRight size={18} color={AppColors.textSecondary} style={{ marginLeft: 'auto' }} />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {signedIn && recommended.length === 0 ? (
        <div onClick={() => navigate('/tabs/profile?tab=prefs')} style={{
          display: 'flex', alignItems: 'center', gap: 12, margin: `0 ${SCREEN_PADDING}px`, padding: 18,
          borderRadius: Radius.lg, border: `1px dashed ${AppColors.border}`, background: '#fff', cursor: 'pointer',
        }}>
          <Heart size={24} color={AppColors.accent} />
          <div style={{ flex: 1 }}>
            <div style={{ color: AppColors.textPrimary, fontSize: 15, fontWeight: 700 }}>Chọn sở thích để nhận gợi ý</div>
            <div style={{ color: AppColors.textSecondary, fontSize: 13 }}>Chọn loại giày bạn thích trong hồ sơ người dùng.</div>
          </div>
          <ChevronRight size={18} color={AppColors.textSecondary} />
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionTitle
          title="Sản phẩm nổi bật"
          subtitle={recommended.length > 0 ? `Ưu tiên theo sở thích: ${tags.slice(0, 3).join(', ')}` : undefined}
          actionLabel="Xem tất cả" onAction={() => navigate('/tabs/products')} />
        {featured.length > 0 ? (
          <div style={pad}><ProductGrid products={featured} onOpen={openProduct} highlightIds={recommendedIds} cta={launchCta} /></div>
        ) : (
          <span style={{ color: AppColors.textSecondary, fontSize: 13, ...pad }}>Cửa hàng chưa có sản phẩm nào.</span>
        )}
      </div>
    </div>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <div style={{ padding: 24, textAlign: 'center', color: AppColors.textSecondary, fontSize: 14 }}>{children}</div>;
}
