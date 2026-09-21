import { AppButton } from '@/components/app/app-button';
import { AppScreen } from '@/components/app/app-screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/app/state-views';
import { ScreenHeader } from '@/components/app/screen-header';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { useApi } from '@/hooks/use-api';
import { useCustomerId } from '@/hooks/use-customer-id';
import { notificationService } from '@/services/notification.service';
import type { AppNotification, NotificationRefType } from '@/types/notification';
import { formatDate } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
const ICON_BY_TYPE: Record<AppNotification['type'], keyof typeof Ionicons.glyphMap> = {
  SURVEY_ASSIGNED: 'clipboard-outline',
  FEEDBACK_APPROVED: 'checkmark-circle-outline',
  FEEDBACK_REJECTED: 'close-circle-outline',
};
/**
 * Danh sách thông báo của khách hàng (Admin từ chối/duyệt phản hồi, gửi
 * khảo sát mới...). Mở từ chuông thông báo ở Trang chủ.
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const customerId = useCustomerId();
  const { data, loading, refreshing, error, refresh, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    return notificationService.listByCustomer(customerId);
  }, [customerId]);
  const openNotification = async (item: AppNotification) => {
    if (!item.isRead) {
      try {
        await notificationService.markRead(item.notificationId);
      } catch {
        // Không chặn điều hướng nếu đánh dấu đã đọc thất bại.
      }
    }
    if (item.refType === 'SURVEY' && item.refId) {
      router.push({ pathname: '/survey/[id]', params: { id: String(item.refId) } });
    } else if (item.refType === ('FEEDBACK' as NotificationRefType)) {
      router.push('/tabs/feedbacks');
    }
    reload();
  };
  const markAllRead = async () => {
    if (customerId == null) return;
    await notificationService.markAllRead(customerId);
    reload();
  };
  return (
    <AppScreen>
      <ScreenHeader
        title="Thông báo"
        onBack={() => router.back()}
        right={
          data?.some((n) => !n.isRead) ? (
            <AppButton label="Đánh dấu đã đọc" variant="secondary" compact onPress={markAllRead} />
          ) : undefined
        }
      />
      {loading && !data ? (
        <LoadingView />
      ) : !data ? (
        <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.notificationId)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={AppColors.accent} />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openNotification(item)}
              style={({ pressed }) => [styles.card, !item.isRead && styles.cardUnread, pressed && styles.pressed]}>
              <View style={styles.icon}>
                <Ionicons name={ICON_BY_TYPE[item.type] ?? 'notifications-outline'} size={20} color={AppColors.accentText} />
              </View>
              <View style={styles.texts}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemMessage} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
              {!item.isRead ? <View style={styles.dot} /> : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyView
              icon="notifications-off-outline"
              title="Chưa có thông báo nào"
              message="Thông báo về khảo sát mới hoặc kết quả duyệt phản hồi sẽ xuất hiện tại đây."
            />
          }
        />
      )}
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  listContent: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 24, gap: 10, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  cardUnread: { borderColor: AppColors.accent },
  pressed: { opacity: 0.85 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.accent,
  },
  texts: { flex: 1, gap: 3 },
  itemTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '800' },
  itemMessage: { color: AppColors.textSecondary, fontSize: 13, lineHeight: 18 },
  date: { color: AppColors.textSecondary, fontSize: 11, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: AppColors.accent, marginTop: 4 },
});
