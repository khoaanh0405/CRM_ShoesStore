import { AppScreen } from '@/components/app/app-screen';
import { Chip } from '@/components/app/chip';
import { ProductCard } from '@/components/app/product-card';
import { SectionTitle } from '@/components/app/section-title';
import { ErrorView, LoadingView } from '@/components/app/state-views';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { useAuth } from '@/context/auth-context';
import { useApi } from '@/hooks/use-api';
import { useCustomerId } from '@/hooks/use-customer-id';
import { customerService } from '@/services/customer.service';
import { productService } from '@/services/product.service';
import { surveyService } from '@/services/survey.service';
import type { CustomerPreference } from '@/types/customer';
import type { Product } from '@/types/product';
import type { SurveyTarget } from '@/types/survey';
import type { IconName } from '@/types/ui';
import { givenNameOf, initialOf } from '@/utils/format';
import { recommendProducts } from '@/utils/recommend';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

const BANNER = require('../../../assets/images/banner_Login-Register_UI.jpg');

const QUICK_ACTIONS: { label: string; icon: IconName; href: Href }[] = [
  { label: 'Sản phẩm', icon: 'grid-outline', href: '/tabs/products' },
  { label: 'Khảo sát', icon: 'clipboard-outline', href: '/tabs/surveys' },
  { label: 'Gửi đánh giá', icon: 'create-outline', href: '/feedback/create' },
  { label: 'Hồ sơ', icon: 'person-outline', href: '/tabs/profile' },
];

/**
 * Trang chủ khách hàng: lời chào, khảo sát đang chờ, lối tắt, danh mục,
 * gợi ý theo sở thích (CustomerPreference) và sản phẩm mới.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { account } = useAuth();
  const customerId = useCustomerId();

  const { data, loading, refreshing, error, refresh, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    const [products, profile, surveys, preferences] = await Promise.all([
      productService.list(),
      customerService.getProfile(customerId).catch(() => null),
      surveyService.listByCustomer(customerId).catch(() => [] as SurveyTarget[]),
      customerService.listPreferences(customerId).catch(() => [] as CustomerPreference[]),
    ]);
    return { products, profile, surveys, preferences };
  }, [customerId]);

  if (loading && !data) {
    return (
      <AppScreen>
        <LoadingView />
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen>
        <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} />
      </AppScreen>
    );
  }

  const { products, profile, surveys, preferences } = data;
  const fullName = profile?.fullName ?? account?.customer?.fullName ?? account?.username ?? '';
  const tags = preferences.map((p) => p.preferenceTag);

  const pendingSurveys = surveys.filter((t) => !t.isCompleted && t.survey.isActive);
  const categories = Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c)));
  const recommended = recommendProducts(products, tags).slice(0, 8);
  const newest = [...products].sort((a, b) => b.productId - a.productId).slice(0, 8);

  const openProduct = (p: Product) =>
    router.push({ pathname: '/product/[id]', params: { id: String(p.productId) } });

  const openCategory = (category: string) =>
    router.push({ pathname: '/tabs/products', params: { category, t: String(Date.now()) } });

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={AppColors.accent} />
        }>
        {/* Lời chào */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingTexts}>
            <Text style={styles.greetingSmall}>Xin chào,</Text>
            <Text style={styles.greetingName} numberOfLines={1}>
              {givenNameOf(fullName) || 'bạn'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/tabs/profile')}
            style={styles.avatar}
            accessibilityLabel="Mở trang cá nhân">
            <Text style={styles.avatarText}>{initialOf(fullName)}</Text>
          </Pressable>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <Image source={BANNER} style={StyleSheet.absoluteFill} contentFit="cover" />
        </View>

        {/* Khảo sát đang chờ */}
        <Pressable
          onPress={() => router.push('/tabs/surveys')}
          style={({ pressed }) => [styles.surveyCard, pressed && styles.pressed]}>
          <View style={styles.surveyIcon}>
            <Ionicons name="clipboard" size={22} color={AppColors.accentText} />
          </View>
          <View style={styles.surveyTexts}>
            <Text style={styles.surveyTitle}>
              {pendingSurveys.length > 0
                ? `Bạn có ${pendingSurveys.length} khảo sát đang chờ`
                : 'Bạn đã hoàn thành mọi khảo sát'}
            </Text>
            <Text style={styles.surveySub} numberOfLines={1}>
              {pendingSurveys.length > 0
                ? pendingSurveys[0].survey.title
                : 'Khảo sát mới sẽ xuất hiện tại đây.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={AppColors.textSecondary} />
        </Pressable>

        {/* Lối tắt */}
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.href)}
              style={({ pressed }) => [styles.quickItem, pressed && styles.pressed]}>
              <View style={styles.quickIcon}>
                <Ionicons name={action.icon} size={22} color={AppColors.accent} />
              </View>
              <Text style={styles.quickLabel} numberOfLines={1}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Danh mục */}
        {categories.length > 0 ? (
          <View style={styles.section}>
            <SectionTitle title="Danh mục" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {categories.map((c) => (
                <Chip key={c} label={c} onPress={() => openCategory(c)} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Gợi ý theo sở thích */}
        {recommended.length > 0 ? (
          <View style={styles.section}>
            <SectionTitle
              title="Gợi ý cho bạn"
              subtitle={`Theo sở thích: ${tags.slice(0, 3).join(', ')}`}
              actionLabel="Xem tất cả"
              onAction={() => router.push('/tabs/products')}
            />
            <ProductRow products={recommended} onOpen={openProduct} />
          </View>
        ) : (
          <Pressable
            onPress={() => router.push('/tabs/profile')}
            style={({ pressed }) => [styles.hintCard, pressed && styles.pressed]}>
            <Ionicons name="heart-outline" size={22} color={AppColors.accent} />
            <View style={styles.hintTexts}>
              <Text style={styles.hintTitle}>Chọn sở thích để nhận gợi ý</Text>
              <Text style={styles.hintSub}>Thêm loại giày bạn thích trong trang cá nhân.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
          </Pressable>
        )}

        {/* Sản phẩm mới */}
        <View style={styles.section}>
          <SectionTitle
            title="Sản phẩm mới"
            actionLabel="Xem tất cả"
            onAction={() => router.push('/tabs/products')}
          />
          {newest.length > 0 ? (
            <ProductRow products={newest} onOpen={openProduct} />
          ) : (
            <Text style={styles.emptyText}>Cửa hàng chưa có sản phẩm nào.</Text>
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function ProductRow({ products, onOpen }: { products: Product[]; onOpen: (p: Product) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.productRow}>
      {products.map((p) => (
        <ProductCard key={p.productId} product={p} width={160} onPress={() => onOpen(p)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32, gap: 24 },
  pressed: { opacity: 0.85 },

  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
  },
  greetingTexts: { flex: 1, gap: 2 },
  greetingSmall: { color: AppColors.textSecondary, fontSize: 14 },
  greetingName: { color: AppColors.textPrimary, fontSize: 30, fontWeight: '800' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.accent,
  },
  avatarText: { color: AppColors.accentText, fontSize: 18, fontWeight: '800' },

  banner: {
    height: 150,
    marginHorizontal: SCREEN_PADDING,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },

  surveyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: SCREEN_PADDING,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  surveyIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.accent,
  },
  surveyTexts: { flex: 1, gap: 2 },
  surveyTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700' },
  surveySub: { color: AppColors.textSecondary, fontSize: 13 },

  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
  },
  quickItem: { flex: 1, alignItems: 'center', gap: 8 },
  quickIcon: {
    width: 54,
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  quickLabel: { color: AppColors.textPrimary, fontSize: 12, fontWeight: '600' },

  section: { gap: 12 },
  chipRow: { gap: 8, paddingHorizontal: SCREEN_PADDING },
  productRow: { gap: 12, paddingHorizontal: SCREEN_PADDING },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, paddingHorizontal: SCREEN_PADDING },

  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: SCREEN_PADDING,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: AppColors.border,
  },
  hintTexts: { flex: 1, gap: 2 },
  hintTitle: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  hintSub: { color: AppColors.textSecondary, fontSize: 12 },
});
