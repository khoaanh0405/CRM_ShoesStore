import { AuthBanner } from '@/components/auth/auth-banner';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthSegmentedTabs } from '@/components/auth/auth-segmented-tabs';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { AuthColors } from '@/constants/authTheme';
import { useAuth } from '@/context/auth-context';
import { getApiErrorMessage } from '@/services/api-client';
import {
  validateDateOfBirth,
  validateFullName,
  validatePassword,
  validatePhone,
  validateUsername,
} from '@/utils/validation';
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

const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];

type RegisterForm = {
  username: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  address: string;
};

const INITIAL_FORM: RegisterForm = {
  username: '',
  password: '',
  fullName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  address: '',
};

/**
 * Khách hàng tự đăng ký tài khoản (mục 4.3.1 Yeu_cau_do_an.docx).
 * Gọi accountService.register qua context/auth-context.tsx
 * -> POST /api/accounts/register (tạo Account + Customer), sau đó tự đăng
 * nhập luôn để vào thẳng app (register() trong auth-context.tsx đã lo việc này).
 */
export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string | null>>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof RegisterForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    const nextErrors: Partial<Record<keyof RegisterForm, string | null>> = {
      username: validateUsername(form.username),
      password: validatePassword(form.password),
      fullName: validateFullName(form.fullName),
      dateOfBirth: validateDateOfBirth(form.dateOfBirth),
      phone: validatePhone(form.phone),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth.trim(),
        gender: form.gender || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      router.replace('/tabs');
    } catch (error) {
      Alert.alert('Đăng ký thất bại', getApiErrorMessage(error, 'Không thể tạo tài khoản, vui lòng thử lại.'));
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
          <AuthSegmentedTabs active="register" />

          <View style={styles.headerBlock}>
            <Text style={styles.title}>Tạo tài khoản{'\n'}mới.</Text>
            <Text style={styles.subtitle}>Đăng ký để nhận ưu đãi và theo dõi đơn hàng.</Text>
          </View>

          <View style={styles.form}>
            <AuthTextField
              label="Tên đăng nhập"
              placeholder="ten_dang_nhap"
              autoCapitalize="none"
              autoCorrect={false}
              value={form.username}
              onChangeText={setField('username')}
              error={errors.username}
            />
            <AuthTextField
              label="Mật khẩu"
              placeholder="Tối thiểu 6 ký tự"
              secureToggle
              secureTextEntry
              value={form.password}
              onChangeText={setField('password')}
              error={errors.password}
            />
            <AuthTextField
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChangeText={setField('fullName')}
              error={errors.fullName}
            />
            <AuthTextField
              label="Ngày sinh"
              placeholder="YYYY-MM-DD (vd: 2003-05-20)"
              keyboardType="numbers-and-punctuation"
              value={form.dateOfBirth}
              onChangeText={setField('dateOfBirth')}
              error={errors.dateOfBirth}
            />

            <View style={styles.genderWrapper}>
              <Text style={styles.genderLabel}>Giới tính (không bắt buộc)</Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map((option) => {
                  const active = form.gender === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setField('gender')(active ? '' : option)}
                      style={[styles.genderChip, active && styles.genderChipActive]}>
                      <Text style={[styles.genderChipLabel, active && styles.genderChipLabelActive]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <AuthTextField
              label="Số điện thoại (không bắt buộc)"
              placeholder="09xx xxx xxx"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={setField('phone')}
              error={errors.phone}
            />
            <AuthTextField
              label="Địa chỉ (không bắt buộc)"
              placeholder="Số nhà, đường, quận/huyện..."
              value={form.address}
              onChangeText={setField('address')}
            />
          </View>

          <AuthButton label="Tạo tài khoản" onPress={handleSubmit} loading={submitting} />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <Link href="/auth/login" replace asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.footerLink}>Đăng nhập</Text>
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
  body: { padding: 24, gap: 24, paddingBottom: 48 },
  headerBlock: { gap: 6 },
  title: {
    color: AuthColors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: { color: AuthColors.textSecondary, fontSize: 14 },
  form: { gap: 16 },
  genderWrapper: { gap: 8 },
  genderLabel: {
    color: AuthColors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AuthColors.surfaceBorder,
    backgroundColor: AuthColors.surface,
  },
  genderChipActive: { backgroundColor: AuthColors.accent, borderColor: AuthColors.accent },
  genderChipLabel: { color: AuthColors.textSecondary, fontSize: 13, fontWeight: '600' },
  genderChipLabelActive: { color: AuthColors.accentText },
  footerRow: { flexDirection: 'row', justifyContent: 'center', paddingTop: 4 },
  footerText: { color: AuthColors.textSecondary, fontSize: 13 },
  footerLink: { color: AuthColors.accent, fontSize: 13, fontWeight: '700' },
});
