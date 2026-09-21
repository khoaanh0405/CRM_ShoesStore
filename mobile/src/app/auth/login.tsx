import { AuthBanner } from '@/components/auth/auth-banner';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthSegmentedTabs } from '@/components/auth/auth-segmented-tabs';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { AuthColors } from '@/constants/authTheme';
import { useAuth } from '@/context/auth-context';
import { getApiErrorMessage } from '@/services/api-client';
import { validatePassword, validateUsername } from '@/utils/validation';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * Đăng nhập khách hàng (mục 4.3.2 Yeu_cau_do_an.docx).
 * Gọi accountService.login qua context/auth-context.tsx -> POST /api/accounts/login.
 * Giao diện theo Login-Register_UI.png, banner đổi thành banner_Login-Register_UI.jpg.
 */
export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string | null; password?: string | null }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    setErrors({ username: usernameError, password: passwordError });
    if (usernameError || passwordError) return;

    setSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      router.replace('/tabs');
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', getApiErrorMessage(error, 'Sai tên đăng nhập hoặc mật khẩu.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <AuthBanner />

        <View style={styles.body}>
          <AuthSegmentedTabs active="login" />

          <View style={styles.headerBlock}>
            <Text style={styles.title}>Chào mừng{'\n'}trở lại.</Text>
            <Text style={styles.subtitle}>Đăng nhập để tiếp tục mua sắm.</Text>
          </View>

          <View style={styles.form}>
            <AuthTextField
              label="Tên đăng nhập"
              placeholder="ten_dang_nhap"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              error={errors.username}
            />
            <AuthTextField
              label="Mật khẩu"
              placeholder="••••••••"
              secureToggle
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              rightAction={{
                label: 'Quên?',
                onPress: () =>
                  Alert.alert(
                    'Quên mật khẩu?',
                    'Tính năng khôi phục mật khẩu đang được phát triển. Vui lòng liên hệ quản trị viên để được hỗ trợ đặt lại mật khẩu.'
                  ),
              }}
            />
          </View>

          <AuthButton label="Đăng nhập" onPress={handleSubmit} loading={submitting} />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <Link href="/auth/register" replace asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.footerLink}>Đăng ký</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AuthColors.background },
  scrollContent: { flexGrow: 1 },
  body: { padding: 24, gap: 24 },
  headerBlock: { gap: 6 },
  title: {
    color: AuthColors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  subtitle: { color: AuthColors.textSecondary, fontSize: 14 },
  form: { gap: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', paddingTop: 4 },
  footerText: { color: AuthColors.textSecondary, fontSize: 13 },
  footerLink: { color: AuthColors.accent, fontSize: 13, fontWeight: '700' },
});
