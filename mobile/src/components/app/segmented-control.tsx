import { AppColors, Radius } from '@/constants/appTheme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Option<K extends string> = { key: K; label: string; count?: number };

type Props<K extends string> = {
  options: Option<K>[];
  value: K;
  onChange: (key: K) => void;
};

export function SegmentedControl<K extends string>({ options, value, onChange }: Props<K>) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={[styles.segment, active && styles.active]}
            accessibilityState={{ selected: active }}>
            <Text style={[styles.label, active && styles.labelActive]}>
              {option.label}
              {option.count !== undefined ? ` (${option.count})` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.md,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.sm },
  active: { backgroundColor: AppColors.accent },
  label: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '700' },
  labelActive: { color: AppColors.accentText },
});
