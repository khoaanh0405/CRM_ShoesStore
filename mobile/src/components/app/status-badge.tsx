import { AppColors, Radius } from '@/constants/appTheme';
import { StyleSheet, Text, View } from 'react-native';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

const TONE_COLOR: Record<BadgeTone, string> = {
  success: AppColors.success,
  warning: AppColors.warning,
  danger: AppColors.danger,
  neutral: AppColors.textSecondary,
};

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const color = TONE_COLOR[tone];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '700' },
});
