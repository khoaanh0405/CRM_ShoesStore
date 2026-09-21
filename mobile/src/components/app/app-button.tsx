import { AppColors, Radius } from '@/constants/appTheme';
import type { IconName } from '@/types/ui';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

const PALETTE: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: AppColors.accent, fg: AppColors.accentText, border: AppColors.accent },
  secondary: { bg: AppColors.surface, fg: AppColors.textPrimary, border: AppColors.border },
  danger: { bg: 'transparent', fg: AppColors.danger, border: AppColors.danger },
  ghost: { bg: 'transparent', fg: AppColors.accent, border: 'transparent' },
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  compact = false,
  style,
}: Props) {
  const colors = PALETTE[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: colors.bg, borderColor: colors.border },
        (pressed || inactive) && styles.dimmed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={compact ? 16 : 18} color={colors.fg} /> : null}
          <Text style={[styles.label, compact && styles.labelCompact, { color: colors.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  compact: { minHeight: 38, paddingHorizontal: 14, borderRadius: Radius.pill },
  dimmed: { opacity: 0.6 },
  label: { fontSize: 15, fontWeight: '700' },
  labelCompact: { fontSize: 13 },
});
