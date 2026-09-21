import { AppColors } from '@/constants/appTheme';
import { useCustomerId } from '@/hooks/use-customer-id';
import { notificationService } from '@/services/notification.service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
/**
 * Chuông thông báo hiển thị ở Trang chủ khách hàng (góc trên, cạnh avatar).
 * Đếm số thông báo CHƯA ĐỌC mỗi khi màn hình được focus (đổi tab, quay lại
 * từ màn "Thông báo") — cùng cách làm với useApi ở hooks/use-api.ts nhưng
 * chỉ cần 1 con số nên không dùng chung hook đó.
 */
export function NotificationBell() {
  const router = useRouter();
  const customerId = useCustomerId();
  const [unreadCount, setUnreadCount] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (customerId == null) return;
      let active = true;
      notificationService
        .countUnread(customerId)
        .then((count) => {
          if (active) setUnreadCount(count);
        })
        .catch(() => {
          // Im lặng bỏ qua lỗi đếm thông báo — không chặn Trang chủ vì lỗi phụ này.
        });
      return () => {
        active = false;
      };
    }, [customerId])
  );
  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      hitSlop={8}
      style={styles.button}
      accessibilityLabel="Xem thông báo">
      <Ionicons name="notifications-outline" size={22} color={AppColors.textPrimary} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.danger,
    borderWidth: 1,
    borderColor: AppColors.background,
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
});
