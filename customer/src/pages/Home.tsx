import { NotificationBell } from '@/components/NotificationBell';
import { ProductCard } from '@/components/ProductCard';
import { SectionTitle } from '@/components/SectionTitle';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Chip } from '@/components/Chip';
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
import { givenNameOf, initialOf } from '@/utils/format';
import { recommendProducts } from '@/utils/recommend';
import { ClipboardList, ChevronRight, Grid, Edit3, User, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QUICK_ACTIONS = [
  { label: 'Sản phẩm', icon: Grid, href: '/tabs/products' },
  { label: 'Khảo sát', icon: ClipboardList, href: '/tabs/surveys' },
  { label: 'Gửi đánh giá', icon: Edit3, href: '/feedback/create' },
  { label: 'Hồ sơ', icon: User, href: '/tabs/profile' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const customerId = useCustomerId();

  const { data, loading, error, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    const [products, profile, surveys, preferences] = await Promise.all([
      productService.list(),
      customerService.getProfile(customerId).catch(() => null),
      surveyService.listByCustomer(customerId).catch(() => [] as SurveyTarget[]),
      customerService.listPreferences(customerId).catch(() => [] as CustomerPreference[]),
    ]);
    return { products, profile, surveys, preferences };
  }, [customerId]);

  if (loading && !data) return <LoadingView />;
  if (!data) return <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} />;

  const { products, profile, surveys, preferences } = data;
  const fullName = profile?.fullName ?? account?.customer?.fullName ?? account?.username ?? '';
  const tags = preferences.map((p) => p.preferenceTag);
  const pendingSurveys = surveys.filter((t) => !t.isCompleted && t.survey.isActive);
  const categories = Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c)));
  const recommended = recommendProducts(products, tags).slice(0, 8);
  const newest = [...products].sort((a, b) => b.productId - a.productId).slice(0, 8);
  const openProduct = (p: Product) => navigate(`/product/${p.productId}`);
  const openCategory = (category: string) => navigate(`/tabs/products?category=${encodeURIComponent(category)}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `12px ${SCREEN_PADDING}px 0` }}>
        <div>
          <div style={{ color: AppColors.textSecondary, fontSize: 14 }}>Xin chào,</div>
          <div style={{ color: AppColors.textPrimary, fontSize: 30, fontWeight: 800 }}>{givenNameOf(fullName) || 'bạn'}</div>
        </div>
      </div>

      <div onClick={() => navigate('/tabs/surveys')} style={{
        display: 'flex', alignItems: 'center', gap: 12, margin: `0 ${SCREEN_PADDING}px`, padding: 14,
        borderRadius: Radius.lg, background: AppColors.surface, border: `1px solid ${AppColors.border}`, cursor: 'pointer',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: Radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', background: AppColors.accent }}>
          <ClipboardList size={22} color={AppColors.accentText} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: AppColors.textPrimary, fontSize: 15, fontWeight: 700 }}>
            {pendingSurveys.length > 0 ? `Bạn có ${pendingSurveys.length} khảo sát đang chờ` : 'Bạn đã hoàn thành mọi khảo sát'}
          </div>
          <div style={{ color: AppColors.textSecondary, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pendingSurveys.length > 0 ? pendingSurveys[0].survey.title : 'Khảo sát mới sẽ xuất hiện tại đây.'}
          </div>
        </div>
        <ChevronRight size={20} color={AppColors.textSecondary} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: `0 ${SCREEN_PADDING}px` }}>
        {QUICK_ACTIONS.map((action) => (
          <button key={action.label} onClick={() => navigate(action.href)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none' }}>
            <div style={{ width: 54, height: 54, borderRadius: Radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', background: AppColors.surface, border: `1px solid ${AppColors.border}` }}>
              <action.icon size={22} color={AppColors.accent} />
            </div>
            <span style={{ color: AppColors.textPrimary, fontSize: 12, fontWeight: 600 }}>{action.label}</span>
          </button>
        ))}
      </div>

      {categories.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionTitle title="Danh mục" />
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: `0 ${SCREEN_PADDING}px` }}>
            {categories.map((c) => <Chip key={c} label={c} onClick={() => openCategory(c)} />)}
          </div>
        </div>
      ) : null}

      {recommended.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionTitle title="Gợi ý cho bạn" subtitle={`Theo sở thích: ${tags.slice(0, 3).join(', ')}`} actionLabel="Xem tất cả" onAction={() => navigate('/tabs/products')} />
          <ProductRow products={recommended} onOpen={openProduct} />
        </div>
      ) : (
        <div onClick={() => navigate('/tabs/profile')} style={{
          display: 'flex', alignItems: 'center', gap: 12, margin: `0 ${SCREEN_PADDING}px`, padding: 14,
          borderRadius: Radius.lg, border: `1px dashed ${AppColors.border}`, cursor: 'pointer',
        }}>
          <Heart size={22} color={AppColors.accent} />
          <div style={{ flex: 1 }}>
            <div style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: 700 }}>Chọn sở thích để nhận gợi ý</div>
            <div style={{ color: AppColors.textSecondary, fontSize: 12 }}>Thêm loại giày bạn thích trong trang cá nhân.</div>
          </div>
          <ChevronRight size={18} color={AppColors.textSecondary} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionTitle title="Sản phẩm mới" actionLabel="Xem tất cả" onAction={() => navigate('/tabs/products')} />
        {newest.length > 0 ? <ProductRow products={newest} onOpen={openProduct} /> : (
          <span style={{ color: AppColors.textSecondary, fontSize: 13, padding: `0 ${SCREEN_PADDING}px` }}>Cửa hàng chưa có sản phẩm nào.</span>
        )}
      </div>
    </div>
  );
}

function ProductRow({ products, onOpen }: { products: Product[]; onOpen: (p: Product) => void }) {
  return (
    <div className="product-grid" style={{ padding: `0 ${SCREEN_PADDING}px` }}>
      {products.map((p) => <ProductCard key={p.productId} product={p} width="100%" onClick={() => onOpen(p)} />)}
    </div>
  );
}
