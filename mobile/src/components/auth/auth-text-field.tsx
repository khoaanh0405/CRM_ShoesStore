import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { AuthColors } from '@/constants/authTheme';

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  /** Hiện icon con mắt để bật/tắt hiện mật khẩu (dùng cho ô mật khẩu). */
  secureToggle?: boolean;
  /** Link nhỏ bên phải label, vd "Quên?" trên ô mật khẩu. */
  rightAction?: { label: string; onPress: () => void };
}

export function AuthTextField({
  label,
  error,
  secureToggle,
  rightAction,
  secureTextEntry,
  style,
  ...inputProps
}: AuthTextFieldProps) {
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {rightAction ? (
          <Pressable onPress={rightAction.onPress} hitSlop={8}>
            <Text style={styles.rightAction}>{rightAction.label}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <TextInput
          {...inputProps}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          placeholderTextColor={AuthColors.placeholder}
          style={[styles.input, style]}
        />
        {secureToggle ? (
          <Pressable onPress={() => setHidden((prev) => !prev)} hitSlop={8}>
            <Text style={styles.toggle}>{hidden ? '👁️' : '🙈'}</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: AuthColors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  rightAction: {
    color: AuthColors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuthColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AuthColors.surfaceBorder,
    paddingHorizontal: 16,
  },
  inputRowError: {
    borderColor: AuthColors.danger,
  },
  input: {
    flex: 1,
    color: AuthColors.textPrimary,
    fontSize: 15,
    paddingVertical: 14,
  },
  toggle: {
    fontSize: 16,
    paddingLeft: 8,
  },
  error: {
    color: AuthColors.danger,
    fontSize: 12,
  },
});
