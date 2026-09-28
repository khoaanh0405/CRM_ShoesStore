import { AppButton } from '@/components/AppButton';
import { Chip } from '@/components/Chip';
import { ProductCard } from '@/components/ProductCard';
import { RatingStars } from '@/components/RatingStars';
import { SectionTitle } from '@/components/SectionTitle';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { StatusBadge, type BadgeTone } from '@/components/StatusBadge';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { SITE } from '@/constants/site';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useCustomerId } from '@/hooks/useCustomerId';
import { customerService } from '@/services/customer.service';
import { feedbackService } from '@/services/feedback.service';
import { productService } from '@/services/product.service';
import { surveyService } from '@/services/survey.service';
import type { CustomerPreference } from '@/types/customer';
import type { Feedback, FeedbackStatus } from '@/types/feedback';
import type { Product } from '@/types/product';
import type { SurveyTarget } from '@/types/survey';
import { formatDate, givenNameOf, initialOf } from '@/utils/format';
import { recommendProducts } from '@/utils/recommend';
import { ChevronRight, ClipboardList, Heart } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerImg from '../../assets/images/banner.png';

const BANNER_IMG = BannerImg;

const STATUS_META: Record<FeedbackStatus, { label: string; tone: BadgeTone }> = {
  Pending: { label: 'Chờ duyệt', tone: 'warning' },
  Approved: { label: 'Đã duyệt', tone: 'success' },
  Rejected: { label: 'Không được duyệt', tone: 'danger' },
};

const cardBox = { borderRadius: Radius.lg, border: `1px solid ${AppColors.border}`, background: '#fff', overflow: 'hidden' } as const;
const clamp2 = { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any } as const;
const HOME_PRODUCTS = 6; // khớp 6 cột của lưới sản phẩm ở màn hình rộng, tránh dòng lẻ

export default function HomePage() {
  const navigate = useNavigate();
  const { account, status } = useAuth();
  const customerId = useCustomerId();
  const signedIn = status === 'signedIn' && customerId != null;

  // Khách chưa đăng nhập chỉ tải danh sách sản phẩm (public).
  // Đã đăng nhập tải thêm hồ sơ, khảo sát, sở thích và đánh giá đã gửi.
  const { data, loading, error, reload } = useApi(async () => {
    const products = await productService.list();
    if (!signedIn || customerId == null) {
      return {
        products, profile: null,
        surveys: [] as SurveyTarget[], preferences: [] as CustomerPreference[], feedbacks: [] as Feedback[],
      };
    }
    const [profile, surveys, preferences, feedbacks] = await Promise.all([
      customerService.getProfile(customerId).catch(() => null),
      surveyService.listByCustomer(customerId).catch(() => [] as SurveyTarget[]),
      customerService.listPreferences(customerId).catch(() => [] as CustomerPreference[]),
      feedbackService.listByCustomer(customerId).catch(() => [] as Feedback[]),
    ]);
    return { products, profile, surveys, preferences, feedbacks };
  }, [customerId, signedIn]);

  if (loading && !data) return <LoadingView />;
  if (!data) return <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} />;

  const { products, profile, surveys, preferences, feedbacks } = data;
  const fullName = profile?.fullName ?? account?.customer?.fullName ?? account?.username ?? '';
  const tags = preferences.map((p) => p.preferenceTag);
  const pendingSurveys = surveys.filter((t) => !t.isCompleted && t.survey.isActive);
  const completedSurveys = surveys.filter((t) => t.isCompleted).length;
  const approvedCount = feedbacks.filter((f) => f.status === 'Approved').length;
  const categories = Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c)));
  const recommended = signedIn ? recommendProducts(products, tags).slice(0, HOME_PRODUCTS) : [];
  // "Sản phẩm mới" loại các sản phẩm đã hiện ở "Gợi ý cho bạn" để không lặp
  const recommendedIds = new Set(recommended.map((p) => p.productId));
  const newest = [...products]
    .sort((a, b) => b.productId - a.productId)
    .filter((p) => !recommendedIds.has(p.productId))
    .slice(0, HOME_PRODUCTS);
  const productNames = new Map(products.map((p) => [p.productId, p.productName]));
  const recentFeedbacks = [...feedbacks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  const openProduct = (p: Product) => navigate(`/product/${p.productId}`);
  const openCategory = (category: string) => navigate(`/tabs/products?category=${encodeURIComponent(category)}`);
  const pad = { padding: `0 ${SCREEN_PADDING}px` } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 32, paddingTop: 16 }}>
      {/* ================= BANNER (full-width) ================= */}
      <div style={pad}>
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 24, minHeight: 260,
          background: `linear-gradient(120deg, ${AppColors.accentHover} 0%, ${AppColors.accent} 55%, #A79CF0 100%)`,
        }}>
          <img
            src={BANNER_IMG}
            alt=""
            className="home-banner-img"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            style={{
              position: 'absolute', right: 0, top: 0, height: '100%', objectFit: 'cover',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 45%)',
              maskImage: 'linear-gradient(to right, transparent 0%, #000 45%)',
            }}
          />
          <div style={{ position: 'relative', padding: '40px 44px', maxWidth: 640, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ color: '#fff', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, lineHeight: 1.15 }}>Bộ sưu tập giày mới</div>
            <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: 15, lineHeight: '22px', maxWidth: 480 }}>
              Khám phá các mẫu giày đang có tại cửa hàng và tìm đôi phù hợp với bạn.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Pill>{products.length} sản phẩm</Pill>
              <Pill>{categories.length} danh mục</Pill>
            </div>
            <AppButton label="Xem sản phẩm" compact onClick={() => navigate('/tabs/products')} style={{ background: '#fff', color: AppColors.accentHover, border: '1px solid #fff', marginTop: 4 }} />
          </div>
        </div>
      </div>

      {/* ================= KHỐI THÔNG TIN: chính + bên cạnh ================= */}
      <div className={`home-layout${signedIn ? '' : ' single'}`} style={pad}>
        <div className="home-main">
          {/* Welcome */}
          <div style={{ ...cardBox, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            {signedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: AppColors.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
                  {initialOf(fullName)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: AppColors.textSecondary, fontSize: 13 }}>Xin chào,</div>
                  <div style={{ color: AppColors.textPrimary, fontSize: 22, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{givenNameOf(fullName) || 'bạn'}</div>
                  {profile?.username ? <div style={{ color: AppColors.textSecondary, fontSize: 12.5 }}>@{profile.username}</div> : null}
                </div>
              </div>
            ) : (
              <>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: AppColors.textSecondary, fontSize: 13 }}>Chào mừng đến với</div>
                  <div style={{ color: AppColors.textPrimary, fontSize: 22, fontWeight: 800 }}>{SITE.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <AppButton label="Đăng nhập" compact onClick={() => navigate('/auth/login')} />
                  <AppButton label="Đăng ký" compact variant="secondary" onClick={() => navigate('/auth/register')} />
                </div>
              </>
            )}
          </div>

          {/* Khảo sát cần làm */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: AppColors.textPrimary, fontSize: 18, fontWeight: 800 }}>Khảo sát cần làm</div>
              {signedIn ? <button onClick={() => navigate('/tabs/surveys')} style={{ background: 'none', border: 'none', color: AppColors.accent, fontSize: 13, fontWeight: 700 }}>Xem tất cả</button> : null}
            </div>
            {!signedIn ? (
              <div style={cardBox}><EmptyText>Đăng nhập để xem các khảo sát dành cho bạn.</EmptyText></div>
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
        </div>

        {/* Cột bên cạnh (chỉ khi đã đăng nhập) */}
        {signedIn ? (
          <aside className="home-side">
            <div style={cardBox}>
              <SideHeader title="Phản hồi gần đây" onAction={() => navigate('/tabs/feedbacks')} />
              {recentFeedbacks.length === 0 ? (
                <EmptyText>Bạn chưa gửi đánh giá nào.</EmptyText>
              ) : recentFeedbacks.map((f) => {
                const meta = STATUS_META[f.status] ?? STATUS_META.Pending;
                return (
                  <div key={f.feedbackId} style={{ padding: '12px 16px', borderTop: `1px solid ${AppColors.border}`, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {productNames.get(f.productId) ?? `Sản phẩm #${f.productId}`}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <RatingStars value={f.rating} size={13} />
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={cardBox}>
              <SideHeader title="Thống kê của bạn" />
              <StatRow label="Đánh giá đã gửi" value={feedbacks.length} />
              <StatRow label="Đánh giá đã được duyệt" value={approvedCount} />
              <StatRow label="Khảo sát đã hoàn thành" value={completedSurveys} />
              <StatRow label="Sở thích đã chọn" value={preferences.length} />
            </div>
          </aside>
        ) : null}
      </div>

      {/* ================= KHỐI SẢN PHẨM (tách riêng, full-width) ================= */}
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

function Pill({ children }: { children: ReactNode }) {
  return (
    <span style={{ padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 13, fontWeight: 700 }}>
      {children}
    </span>
  );
}

function SideHeader({ title, onAction }: { title: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
      <div style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: 800 }}>{title}</div>
      {onAction ? <button onClick={onAction} style={{ background: 'none', border: 'none', color: AppColors.accent, fontSize: 12.5, fontWeight: 700 }}>Xem tất cả</button> : null}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderTop: `1px solid ${AppColors.border}` }}>
      <span style={{ color: AppColors.textSecondary, fontSize: 13.5 }}>{label}</span>
      <span style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: 800 }}>{value}</span>
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