import { AppButton } from '@/components/app/app-button';
import { AppScreen } from '@/components/app/app-screen';
import { Chip } from '@/components/app/chip';
import { RatingStars } from '@/components/app/rating-stars';
import { ScreenHeader } from '@/components/app/screen-header';
import { EmptyView, ErrorView, LoadingView } from '@/components/app/state-views';
import { StatusBadge, type BadgeTone } from '@/components/app/status-badge';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { FEEDBACK_STATUS } from '@/constants/domain';
import { useApi } from '@/hooks/use-api';
import { useCustomerId } from '@/hooks/use-customer-id';
import { feedbackService } from '@/services/feedback.service';
import { productService } from '@/services/product.service';
import type { Feedback, FeedbackStatus } from '@/types/feedback';
import { formatDate } from '@/utils/format';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

const STATUS_META: Record<FeedbackStatus, { label: string; tone: BadgeTone }> = {
  Pending: { label: 'Chờ duyệt', tone: 'warning' },
  Approved: { label: 'Đã duyệt', tone: 'success' },
  Rejected: { label: 'Không được duyệt', tone: 'danger' },
};

type Filter = 'all' | FeedbackStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: FEEDBACK_STATUS.PENDING, label: STATUS_META.Pending.label },
  { key: FEEDBACK_STATUS.APPROVED, label: STATUS_META.Approved.label },
  { key: FEEDBACK_STATUS.REJECTED, label: STATUS_META.Rejected.label },
];

/**
 * Tab Đánh giá (mục 4.3.3): lịch sử phản hồi khách hàng đã gửi kèm trạng thái
 * xử lý của Admin, và lối vào màn viết đánh giá mới.
 */
export default function FeedbacksScreen() {
  const router = useRouter();
  const customerId = useCustomerId();
  const [filter, setFilter] = useState<Filter>('all');

  const { data, loading, refreshing, error, refresh, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    const [feedbacks, products] = await Promise.all([
      feedbackService.listByCustomer(customerId),
      productService.list().catch(() => []),
    ]);
    const productNames = new Map(products.map((p) => [p.productId, p.productName]));
    return { feedbacks, productNames };
  }, [customerId]);

  const items = (data?.feedbacks ?? []).filter((f) => filter === 'all' || f.status === filter);

  const openCreate = () => router.push('/feedback/create');

  return (
    <AppScreen>
      <ScreenHeader
        title="Đánh giá"
        subtitle={data ? `${data.feedbacks.length} phản hồi đã gửi` : undefined}
        right={<AppButton label="Viết đánh giá" icon="add" compact onPress={openCreate} />}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroller}
        contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      {loading && !data ? (
        <LoadingView />
      ) : !data ? (
        <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(f) => String(f.feedbackId)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={AppColors.accent} />
          }
          renderItem={({ item }) => (
            <FeedbackCard
              feedback={item}
              productName={data.productNames.get(item.productId) ?? `Sản phẩm #${item.productId}`}
              onOpenProduct={() =>
                router.push({ pathname: '/product/[id]', params: { id: String(item.productId) } })
              }
            />
          )}
          ListEmptyComponent={
            data.feedbacks.length === 0 ? (
              <EmptyView
                icon="chatbubble-ellipses-outline"
                title="Bạn chưa gửi đánh giá nào"
                message="Chia sẻ cảm nhận về đôi giày bạn đã mua để giúp người khác chọn tốt hơn."
                actionLabel="Viết đánh giá đầu tiên"
                onAction={openCreate}
              />
            ) : (
              <EmptyView icon="funnel-outline" title="Không có phản hồi nào ở trạng thái này" />
            )
          }
        />
      )}
    </AppScreen>
  );
}

function FeedbackCard({
  feedback,
  productName,
  onOpenProduct,
}: {
  feedback: Feedback;
  productName: string;
  onOpenProduct: () => void;
}) {
  const meta = STATUS_META[feedback.status] ?? STATUS_META.Pending;

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Pressable onPress={onOpenProduct} hitSlop={6} style={styles.productLink}>
          <Text style={styles.productName} numberOfLines={1}>
            {productName}
          </Text>
        </Pressable>
        <StatusBadge label={meta.label} tone={meta.tone} />
      </View>
      <View style={styles.ratingRow}>
        <RatingStars value={feedback.rating} size={14} />
        <Text style={styles.date}>{formatDate(feedback.createdAt)}</Text>
      </View>
      <Text style={styles.title}>{feedback.title}</Text>
      <Text style={styles.content} numberOfLines={4}>
        {feedback.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filterScroller: { flexGrow: 0 },
  filterRow: { gap: 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: 12 },
  listContent: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 24, gap: 12, flexGrow: 1 },
  card: {
    gap: 8,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  productLink: { flex: 1 },
  productName: { color: AppColors.accent, fontSize: 13, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { color: AppColors.textSecondary, fontSize: 12 },
  title: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '800' },
  content: { color: AppColors.textSecondary, fontSize: 14, lineHeight: 20 },
});
