import { AppColors, SCREEN_PADDING } from '@/constants/appTheme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionTitle({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: SCREEN_PADDING,
  },
  texts: { flex: 1, gap: 2 },
  title: { color: AppColors.textPrimary, fontSize: 18, fontWeight: '800' },
  subtitle: { color: AppColors.textSecondary, fontSize: 12 },
  action: { color: AppColors.accent, fontSize: 13, fontWeight: '700' },
});
