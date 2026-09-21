import { AppColors, Radius } from '@/constants/appTheme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Có onRemove thì hiện thêm nút × (dùng cho thẻ sở thích). */
  onRemove?: () => void;
};

export function Chip({ label, selected = false, onPress, onRemove }: Props) {
  const fg = selected ? AppColors.accentText : AppColors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, selected && styles.selected]}
      accessibilityState={{ selected }}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel={`Xóa ${label}`}>
          <Ionicons name="close" size={14} color={fg} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  selected: { backgroundColor: AppColors.accent, borderColor: AppColors.accent },
  label: { fontSize: 13, fontWeight: '600' },
});
