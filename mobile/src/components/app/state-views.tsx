import { AppColors } from '@/constants/appTheme';
import type { IconName } from '@/types/ui';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from './app-button';

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={AppColors.accent} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={40} color={AppColors.textSecondary} />
      <Text style={styles.title}>Không tải được dữ liệu</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <AppButton label="Thử lại" variant="secondary" compact onPress={onRetry} /> : null}
    </View>
  );
}

type EmptyProps = {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyView({ icon = 'file-tray-outline', title, message, actionLabel, onAction }: EmptyProps) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={40} color={AppColors.textSecondary} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? <AppButton label={actionLabel} compact onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  title: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  message: { color: AppColors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
