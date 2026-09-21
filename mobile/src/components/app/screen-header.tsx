import { AppColors, SCREEN_PADDING } from '@/constants/appTheme';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, onBack, right }: Props) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} style={styles.backButton} accessibilityLabel="Quay lại">
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
      ) : null}
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  texts: { flex: 1, gap: 2 },
  title: { color: AppColors.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { color: AppColors.textSecondary, fontSize: 13 },
});
