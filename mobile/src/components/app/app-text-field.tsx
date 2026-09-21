import { AppColors, Radius } from '@/constants/appTheme';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  hint?: string;
};

export function AppTextField({ label, error, hint, style, multiline, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={AppColors.textSecondary}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          !!error && styles.errorBorder,
          style,
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  input: {
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    color: AppColors.textPrimary,
    fontSize: 15,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  focused: { borderColor: AppColors.accent },
  errorBorder: { borderColor: AppColors.danger },
  error: { color: AppColors.danger, fontSize: 12 },
  hint: { color: AppColors.textSecondary, fontSize: 12 },
});
