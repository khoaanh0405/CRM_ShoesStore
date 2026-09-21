import { AppColors, Radius } from '@/constants/appTheme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 16,
  },
});
