import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Stub màn Home sau khi đăng nhập/đăng ký thành công. Mục đích: chứng minh
 * luồng auth hoạt động đầu-cuối (token lưu được, route guard hoạt động,
 * đăng xuất quay lại được màn login). Nội dung đầy đủ của Tab 1 (Bảng tin,
 * Gợi ý theo sở thích...) nằm ngoài phạm vi phần đăng nhập/đăng ký này,
 * sẽ được xây dựng theo MOBILE_APP_UI_DESIGN.md ở bước sau.
 */
export default function HomeScreen() {
  const { account, logout } = useAuth();
  const customerName = account?.customer?.fullName ?? account?.username ?? '';

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="subtitle">Xin chào, {customerName} 👋</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Đăng nhập thành công với tên đăng nhập "{account?.username}".
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.infoCard}>
            <InfoRow label="Họ tên" value={account?.customer?.fullName} />
            <InfoRow label="Ngày sinh" value={account?.customer?.dateOfBirth?.slice(0, 10)} />
            <InfoRow label="Giới tính" value={account?.customer?.gender} />
            <InfoRow label="Điện thoại" value={account?.customer?.phone} />
            <InfoRow label="Địa chỉ" value={account?.customer?.address} />
          </ThemedView>

          <ThemedText type="link" themeColor="text" onPress={handleLogout} style={styles.logout}>
            Đăng xuất
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <ThemedView style={styles.infoRow}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {value || '—'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.four },
  infoCard: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.two },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  logout: { marginTop: Spacing.four, textAlign: 'center' },
});
