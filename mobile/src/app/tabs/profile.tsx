import { AppButton } from '@/components/app/app-button';
import { AppScreen } from '@/components/app/app-screen';
import { AppTextField } from '@/components/app/app-text-field';
import { Card } from '@/components/app/card';
import { Chip } from '@/components/app/chip';
import { ScreenHeader } from '@/components/app/screen-header';
import { ErrorView, LoadingView } from '@/components/app/state-views';
import { AppColors, SCREEN_PADDING } from '@/constants/appTheme';
import { GENDER_OPTIONS, PREFERENCE_SUGGESTIONS } from '@/constants/domain';
import { useAuth } from '@/context/auth-context';
import { useApi } from '@/hooks/use-api';
import { useCustomerId } from '@/hooks/use-customer-id';
import { getApiErrorMessage } from '@/services/api-client';
import { customerService } from '@/services/customer.service';
import type { CustomerProfile } from '@/types/customer';
import { formatDateOnly, initialOf, toDateInput } from '@/utils/format';
import {
  validateDateOfBirth,
  validateFullName,
  validatePassword,
  validatePhone,
} from '@/utils/validation';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type ProfileForm = { fullName: string; dateOfBirth: string; gender: string; phone: string; address: string };
type FormErrors = Partial<Record<keyof ProfileForm, string | null>>;

const EMPTY_PASSWORD = { oldPassword: '', newPassword: '', confirm: '' };

/**
 * Tab Cá nhân: xem/sửa thông tin (mục 4.3.2), quản lý sở thích mua sắm
 * (CustomerPreference — dùng cho gợi ý ở Trang chủ), đổi mật khẩu, đăng xuất.
 */
export default function ProfileScreen() {
  const { logout } = useAuth();
  const customerId = useCustomerId();

  const { data, loading, refreshing, error, refresh, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    const [profile, preferences] = await Promise.all([
      customerService.getProfile(customerId),
      customerService.listPreferences(customerId),
    ]);
    return { profile, preferences };
  }, [customerId]);

  // Chỉnh sửa thông tin
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({ fullName: '', dateOfBirth: '', gender: '', phone: '', address: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Sở thích
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  // Đổi mật khẩu
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState(EMPTY_PASSWORD);
  const [pwErrors, setPwErrors] = useState<Partial<Record<keyof typeof EMPTY_PASSWORD, string | null>>>({});
  const [pwSaving, setPwSaving] = useState(false);

  if (loading && !data) {
    return (
      <AppScreen>
        <LoadingView />
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen>
        <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} />
      </AppScreen>
    );
  }

  const { profile, preferences } = data;

  const startEditing = (p: CustomerProfile) => {
    setForm({
      fullName: p.fullName,
      dateOfBirth: toDateInput(p.dateOfBirth),
      gender: p.gender ?? '',
      phone: p.phone ?? '',
      address: p.address ?? '',
    });
    setErrors({});
    setEditing(true);
  };

  const setField = (field: keyof ProfileForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const saveProfile = async () => {
    if (customerId == null) return;
    const next: FormErrors = {
      fullName: validateFullName(form.fullName),
      dateOfBirth: validateDateOfBirth(form.dateOfBirth),
      phone: validatePhone(form.phone),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSaving(true);
    try {
      await customerService.updateProfile(customerId, {
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth.trim(),
        gender: form.gender || undefined,
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      setEditing(false);
      await reload();
      Alert.alert('Đã lưu', 'Thông tin cá nhân của bạn đã được cập nhật.');
    } catch (e) {
      Alert.alert('Không lưu được', getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally {
      setSaving(false);
    }
  };

  const addTag = async (raw: string) => {
    if (customerId == null) return;
    const tag = raw.trim();
    if (!tag) return;
    if (tag.length > 100) {
      Alert.alert('Sở thích quá dài', 'Tối đa 100 ký tự.');
      return;
    }
    if (preferences.some((p) => p.preferenceTag.toLowerCase() === tag.toLowerCase())) {
      Alert.alert('Đã có sở thích này', `"${tag}" đã nằm trong danh sách của bạn.`);
      return;
    }
    setAddingTag(true);
    try {
      await customerService.addPreference(customerId, tag);
      setNewTag('');
      await reload();
    } catch (e) {
      Alert.alert('Không thêm được sở thích', getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally {
      setAddingTag(false);
    }
  };

  const removeTag = async (preferenceId: number) => {
    try {
      await customerService.removePreference(preferenceId);
      await reload();
    } catch (e) {
      Alert.alert('Không xóa được sở thích', getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    }
  };

  const changePassword = async () => {
    if (customerId == null) return;
    const next = {
      oldPassword: pw.oldPassword ? null : 'Vui lòng nhập mật khẩu hiện tại.',
      newPassword: validatePassword(pw.newPassword),
      confirm: pw.confirm !== pw.newPassword ? 'Mật khẩu nhập lại không khớp.' : null,
    };
    setPwErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setPwSaving(true);
    try {
      await customerService.changePassword(customerId, {
        oldPassword: pw.oldPassword,
        newPassword: pw.newPassword,
      });
      setPw(EMPTY_PASSWORD);
      setPwOpen(false);
      Alert.alert('Đã đổi mật khẩu', 'Lần đăng nhập sau hãy dùng mật khẩu mới.');
    } catch (e) {
      Alert.alert('Không đổi được mật khẩu', getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () =>
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);

  const availableSuggestions = PREFERENCE_SUGGESTIONS.filter(
    (s) => !preferences.some((p) => p.preferenceTag.toLowerCase() === s.toLowerCase())
  );

  return (
    <AppScreen>
      <ScreenHeader title="Cá nhân" />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={AppColors.accent} />
          }>
          {/* Thẻ hồ sơ */}
          <Card style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialOf(profile.fullName)}</Text>
            </View>
            <View style={styles.profileTexts}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile.fullName}
              </Text>
              <Text style={styles.profileUser}>@{profile.username}</Text>
            </View>
          </Card>

          {/* Thông tin cá nhân */}
          <Card style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
              {!editing ? (
                <AppButton label="Chỉnh sửa" icon="create-outline" variant="secondary" compact onPress={() => startEditing(profile)} />
              ) : null}
            </View>

            {editing ? (
              <View style={styles.form}>
                <AppTextField
                  label="Họ và tên"
                  value={form.fullName}
                  onChangeText={setField('fullName')}
                  error={errors.fullName}
                />
                <AppTextField
                  label="Ngày sinh"
                  placeholder="YYYY-MM-DD (vd: 2003-05-20)"
                  keyboardType="numbers-and-punctuation"
                  value={form.dateOfBirth}
                  onChangeText={setField('dateOfBirth')}
                  error={errors.dateOfBirth}
                />
                <View style={styles.genderBlock}>
                  <Text style={styles.fieldLabel}>Giới tính</Text>
                  <View style={styles.chipWrap}>
                    {GENDER_OPTIONS.map((g) => (
                      <Chip
                        key={g}
                        label={g}
                        selected={form.gender === g}
                        onPress={() => setField('gender')(form.gender === g ? '' : g)}
                      />
                    ))}
                  </View>
                </View>
                <AppTextField
                  label="Số điện thoại"
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={setField('phone')}
                  error={errors.phone}
                />
                <AppTextField label="Địa chỉ" value={form.address} onChangeText={setField('address')} />
                <View style={styles.buttonRow}>
                  <AppButton label="Hủy" variant="secondary" style={styles.flex} onPress={() => setEditing(false)} />
                  <AppButton label="Lưu thay đổi" style={styles.flex} onPress={saveProfile} loading={saving} />
                </View>
              </View>
            ) : (
              <View style={styles.infoList}>
                <InfoRow label="Họ và tên" value={profile.fullName} />
                <InfoRow label="Ngày sinh" value={formatDateOnly(profile.dateOfBirth)} />
                <InfoRow label="Giới tính" value={profile.gender} />
                <InfoRow label="Số điện thoại" value={profile.phone} />
                <InfoRow label="Địa chỉ" value={profile.address} />
              </View>
            )}
          </Card>

          {/* Sở thích */}
          <Card style={styles.section}>
            <View>
              <Text style={styles.sectionTitle}>Sở thích mua sắm</Text>
              <Text style={styles.sectionHint}>Dùng để gợi ý sản phẩm phù hợp ở Trang chủ.</Text>
            </View>

            {preferences.length > 0 ? (
              <View style={styles.chipWrap}>
                {preferences.map((p) => (
                  <Chip
                    key={p.preferenceId}
                    label={p.preferenceTag}
                    selected
                    onRemove={() => removeTag(p.preferenceId)}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.sectionHint}>Bạn chưa chọn sở thích nào.</Text>
            )}

            {availableSuggestions.length > 0 ? (
              <View style={styles.suggestBlock}>
                <Text style={styles.fieldLabel}>Gợi ý nhanh</Text>
                <View style={styles.chipWrap}>
                  {availableSuggestions.map((s) => (
                    <Chip key={s} label={`+ ${s}`} onPress={() => addTag(s)} />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.addRow}>
              <View style={styles.flex}>
                <AppTextField
                  placeholder="Nhập sở thích khác"
                  value={newTag}
                  onChangeText={setNewTag}
                  maxLength={100}
                  returnKeyType="done"
                  onSubmitEditing={() => addTag(newTag)}
                />
              </View>
              <AppButton label="Thêm" compact onPress={() => addTag(newTag)} loading={addingTag} disabled={!newTag.trim()} />
            </View>
          </Card>

          {/* Bảo mật */}
          <Card style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Mật khẩu</Text>
              {!pwOpen ? (
                <AppButton label="Đổi mật khẩu" icon="key-outline" variant="secondary" compact onPress={() => setPwOpen(true)} />
              ) : null}
            </View>
            {pwOpen ? (
              <View style={styles.form}>
                <AppTextField
                  label="Mật khẩu hiện tại"
                  secureTextEntry
                  autoCapitalize="none"
                  value={pw.oldPassword}
                  onChangeText={(v) => setPw((prev) => ({ ...prev, oldPassword: v }))}
                  error={pwErrors.oldPassword}
                />
                <AppTextField
                  label="Mật khẩu mới"
                  placeholder="Tối thiểu 6 ký tự"
                  secureTextEntry
                  autoCapitalize="none"
                  value={pw.newPassword}
                  onChangeText={(v) => setPw((prev) => ({ ...prev, newPassword: v }))}
                  error={pwErrors.newPassword}
                />
                <AppTextField
                  label="Nhập lại mật khẩu mới"
                  secureTextEntry
                  autoCapitalize="none"
                  value={pw.confirm}
                  onChangeText={(v) => setPw((prev) => ({ ...prev, confirm: v }))}
                  error={pwErrors.confirm}
                />
                <View style={styles.buttonRow}>
                  <AppButton
                    label="Hủy"
                    variant="secondary"
                    style={styles.flex}
                    onPress={() => {
                      setPwOpen(false);
                      setPw(EMPTY_PASSWORD);
                      setPwErrors({});
                    }}
                  />
                  <AppButton label="Cập nhật" style={styles.flex} onPress={changePassword} loading={pwSaving} />
                </View>
              </View>
            ) : null}
          </Card>

          <AppButton label="Đăng xuất" icon="log-out-outline" variant="danger" onPress={handleLogout} />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 32, gap: 16 },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.accent,
  },
  avatarText: { color: AppColors.accentText, fontSize: 24, fontWeight: '800' },
  profileTexts: { flex: 1, gap: 2 },
  profileName: { color: AppColors.textPrimary, fontSize: 20, fontWeight: '800' },
  profileUser: { color: AppColors.textSecondary, fontSize: 13 },

  section: { gap: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: AppColors.textPrimary, fontSize: 17, fontWeight: '800' },
  sectionHint: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },

  infoList: { gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  infoLabel: { color: AppColors.textSecondary, fontSize: 14 },
  infoValue: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },

  form: { gap: 14 },
  fieldLabel: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  genderBlock: { gap: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  buttonRow: { flexDirection: 'row', gap: 12 },

  suggestBlock: { gap: 8 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
