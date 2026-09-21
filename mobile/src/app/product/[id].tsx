import { AppButton } from '@/components/app/app-button';
import { Card } from '@/components/app/card';
import { RatingStars } from '@/components/app/rating-stars';
import { SectionTitle } from '@/components/app/section-title';
import { ErrorView, LoadingView } from '@/components/app/state-views';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { FEEDBACK_STATUS } from '@/constants/domain';
import { useApi } from '@/hooks/use-api';
import { productService } from '@/services/product.service';
import { formatDate, formatPrice } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Chi tiết sản phẩm + đánh giá của khách hàng khác (chỉ hiện đánh giá đã được
 * Admin duyệt) + nút "Viết đánh giá" (mục 4.3.3).
 */
export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);

  const { data, loading, error, reload } = useApi(async () => {
    const [product, feedbacks] = await Promise.all([
      productService.getById(productId),
      productService.listFeedbacks(productId).catch(() => []),
    ]);
    return { product, feedbacks };
  }, [productId]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/tabs/products'));

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.root}>
        <LoadingView />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.root}>
        <ErrorView message={error ?? 'Không tìm thấy sản phẩm.'} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const { product } = data;
  const approved = data.feedbacks.filter((f) => f.status === FEEDBACK_STATUS.APPROVED);
  const average = approved.length > 0 ? approved.reduce((sum, f) => sum + f.rating, 0) / approved.length : 0;
  const soldOut = product.stockQuantity <= 0;

  const specs: [string, string | null][] = [
    ['Thương hiệu', product.brand],
    ['Danh mục', product.category],
    ['Kích cỡ', product.size],
    ['Màu sắc', product.color],
    ['Chất liệu', product.material],
    ['Tình trạng', soldOut ? 'Hết hàng' : `Còn ${product.stockQuantity} sản phẩm`],
  ];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Ảnh + nút quay lại */}
        <View style={[styles.hero, { width, height: width }]}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Ionicons name="image-outline" size={48} color={AppColors.textSecondary} />
          )}
          <Pressable
            onPress={goBack}
            hitSlop={8}
            accessibilityLabel="Quay lại"
            style={[styles.backButton, { top: insets.top + 8 }]}>
            <Ionicons name="chevron-back" size={22} color={AppColors.textPrimary} />
          </Pressable>
        </View>

        {/* Thông tin chính */}
        <View style={styles.main}>
          <Text style={styles.name}>{product.productName}</Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <View style={styles.ratingRow}>
            <RatingStars value={average} size={16} />
            <Text style={styles.ratingText}>
              {approved.length > 0 ? `${average.toFixed(1)} (${approved.length} đánh giá)` : 'Chưa có đánh giá'}
            </Text>
          </View>
        </View>

        {/* Thông số */}
        <View style={styles.block}>
          <SectionTitle title="Thông số" />
          <Card style={styles.specCard}>
            {specs.map(([label, value], index) => (
              <View key={label} style={[styles.specRow, index > 0 && styles.specDivider]}>
                <Text style={styles.specLabel}>{label}</Text>
                <Text style={styles.specValue}>{value || '—'}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Đánh giá */}
        <View style={styles.block}>
          <SectionTitle title="Đánh giá của khách hàng" />
          {approved.length === 0 ? (
            <Text style={styles.emptyReviews}>
              Chưa có đánh giá nào được hiển thị. Hãy là người đầu tiên chia sẻ trải nghiệm.
            </Text>
          ) : (
            <View style={styles.reviewList}>
              {approved.map((f) => (
                <Card key={f.feedbackId} style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <RatingStars value={f.rating} size={14} />
                    <Text style={styles.reviewDate}>{formatDate(f.createdAt)}</Text>
                  </View>
                  <Text style={styles.reviewTitle}>{f.title}</Text>
                  <Text style={styles.reviewContent}>{f.content}</Text>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Thanh hành động cố định phía dưới */}
      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <AppButton
          label="Viết đánh giá"
          icon="create-outline"
          onPress={() => router.push({ pathname: '/feedback/create', params: { productId: String(productId) } })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background },
  content: { paddingBottom: 24, gap: 24 },
  hero: { alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.surface },
  backButton: {
    position: 'absolute',
    left: SCREEN_PADDING,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.overlay,
  },
  main: { gap: 6, paddingHorizontal: SCREEN_PADDING },
  name: { color: AppColors.textPrimary, fontSize: 26, fontWeight: '800', lineHeight: 32 },
  price: { color: AppColors.accent, fontSize: 22, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  ratingText: { color: AppColors.textSecondary, fontSize: 13 },
  block: { gap: 12 },
  specCard: { marginHorizontal: SCREEN_PADDING, paddingVertical: 4 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 12 },
  specDivider: { borderTopWidth: 1, borderTopColor: AppColors.border },
  specLabel: { color: AppColors.textSecondary, fontSize: 14 },
  specValue: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  emptyReviews: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: SCREEN_PADDING,
  },
  reviewList: { gap: 10, paddingHorizontal: SCREEN_PADDING },
  reviewCard: { gap: 6, borderRadius: Radius.md },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewDate: { color: AppColors.textSecondary, fontSize: 12 },
  reviewTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700' },
  reviewContent: { color: AppColors.textSecondary, fontSize: 14, lineHeight: 20 },
  actionBar: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
});
