import { AppButton } from '@/components/AppButton';
import { AppTextField } from '@/components/AppTextField';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { AppColors, SCREEN_PADDING } from '@/constants/appTheme';
import { GENDER_OPTIONS, PREFERENCE_SUGGESTIONS } from '@/constants/domain';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useCustomerId } from '@/hooks/useCustomerId';
import { getApiErrorMessage } from '@/services/api-client';
import { customerService } from '@/services/customer.service';
import type { CustomerProfile } from '@/types/customer';
import { formatDateOnly, initialOf, toDateInput } from '@/utils/format';
import { validateDateOfBirth, validateFullName, validatePassword, validatePhone } from '@/utils/validation';
import { Edit3, Key, LogOut } from 'lucide-react';
import { useState } from 'react';

type ProfileForm = { fullName: string; dateOfBirth: string; gender: string; phone: string; address: string };
type FormErrors = Partial<Record<keyof ProfileForm, string | null>>;
const EMPTY_PASSWORD = { oldPassword: '', newPassword: '', confirm: '' };

/** Tab Cá nhân: xem/sửa thông tin, sở thích mua sắm, đổi mật khẩu, đăng xuất. */
export default function ProfilePage() {
  const { logout } = useAuth();
  const customerId = useCustomerId();

  const { data, loading, error, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    const [profile, preferences] = await Promise.all([customerService.getProfile(customerId), customerService.listPreferences(customerId)]);
    return { profile, preferences };
  }, [customerId]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({ fullName: '', dateOfBirth: '', gender: '', phone: '', address: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState(EMPTY_PASSWORD);
  const [pwErrors, setPwErrors] = useState<Partial<Record<keyof typeof EMPTY_PASSWORD, string | null>>>({});
  const [pwSaving, setPwSaving] = useState(false);

  if (loading && !data) return <LoadingView />;
  if (!data) return <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} />;

  const { profile, preferences } = data;

  const startEditing = (p: CustomerProfile) => {
    setForm({ fullName: p.fullName, dateOfBirth: toDateInput(p.dateOfBirth), gender: p.gender ?? '', phone: p.phone ?? '', address: p.address ?? '' });
    setErrors({});
    setEditing(true);
  };
  const setField = (field: keyof ProfileForm) => (value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const saveProfile = async () => {
    if (customerId == null) return;
    const next: FormErrors = { fullName: validateFullName(form.fullName), dateOfBirth: validateDateOfBirth(form.dateOfBirth), phone: validatePhone(form.phone) };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSaving(true);
    try {
      await customerService.updateProfile(customerId, { fullName: form.fullName.trim(), dateOfBirth: form.dateOfBirth.trim(), gender: form.gender || undefined, phone: form.phone.trim(), address: form.address.trim() });
      setEditing(false);
      await reload();
      alert('Đã lưu. Thông tin cá nhân của bạn đã được cập nhật.');
    } catch (e) {
      alert('Không lưu được: ' + getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally { setSaving(false); }
  };

  const addTag = async (raw: string) => {
    if (customerId == null) return;
    const tag = raw.trim();
    if (!tag) return;
    if (tag.length > 100) { alert('Sở thích quá dài. Tối đa 100 ký tự.'); return; }
    if (preferences.some((p) => p.preferenceTag.toLowerCase() === tag.toLowerCase())) { alert(`"${tag}" đã nằm trong danh sách của bạn.`); return; }
    setAddingTag(true);
    try { await customerService.addPreference(customerId, tag); setNewTag(''); await reload(); }
    catch (e) { alert('Không thêm được sở thích: ' + getApiErrorMessage(e, 'Vui lòng thử lại sau.')); }
    finally { setAddingTag(false); }
  };

  const removeTag = async (preferenceId: number) => {
    try { await customerService.removePreference(preferenceId); await reload(); }
    catch (e) { alert('Không xóa được sở thích: ' + getApiErrorMessage(e, 'Vui lòng thử lại sau.')); }
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
      await customerService.changePassword(customerId, { oldPassword: pw.oldPassword, newPassword: pw.newPassword });
      setPw(EMPTY_PASSWORD);
      setPwOpen(false);
      alert('Đã đổi mật khẩu. Lần đăng nhập sau hãy dùng mật khẩu mới.');
    } catch (e) {
      alert('Không đổi được mật khẩu: ' + getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally { setPwSaving(false); }
  };

  const handleLogout = () => { if (confirm('Bạn có chắc muốn đăng xuất?')) logout(); };

  const availableSuggestions = PREFERENCE_SUGGESTIONS.filter((s) => !preferences.some((p) => p.preferenceTag.toLowerCase() === s.toLowerCase()));

  return (
    <div>
      <ScreenHeader title="Cá nhân" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: `0 ${SCREEN_PADDING}px 32px` }}>
        <Card style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: AppColors.accent, flexShrink: 0 }}>
            <span style={{ color: AppColors.accentText, fontSize: 24, fontWeight: 800 }}>{initialOf(profile.fullName)}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: AppColors.textPrimary, fontSize: 20, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.fullName}</div>
            <div style={{ color: AppColors.textSecondary, fontSize: 13 }}>@{profile.username}</div>
          </div>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: AppColors.textPrimary, fontSize: 17, fontWeight: 800 }}>Thông tin cá nhân</span>
            {!editing ? <AppButton label="Chỉnh sửa" icon={Edit3} variant="secondary" compact onClick={() => startEditing(profile)} /> : null}
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AppTextField label="Họ và tên" value={form.fullName} onChangeText={setField('fullName')} error={errors.fullName} />
              <AppTextField label="Ngày sinh" placeholder="YYYY-MM-DD (vd: 2003-05-20)" value={form.dateOfBirth} onChangeText={setField('dateOfBirth')} error={errors.dateOfBirth} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: 600 }}>Giới tính</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {GENDER_OPTIONS.map((g) => <Chip key={g} label={g} selected={form.gender === g} onClick={() => setField('gender')(form.gender === g ? '' : g)} />)}
                </div>
              </div>
              <AppTextField label="Số điện thoại" value={form.phone} onChangeText={setField('phone')} error={errors.phone} />
              <AppTextField label="Địa chỉ" value={form.address} onChangeText={setField('address')} />
              <div style={{ display: 'flex', gap: 12 }}>
                <AppButton label="Hủy" variant="secondary" style={{ flex: 1 }} onClick={() => setEditing(false)} />
                <AppButton label="Lưu thay đổi" style={{ flex: 1 }} onClick={saveProfile} loading={saving} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow label="Họ và tên" value={profile.fullName} />
              <InfoRow label="Ngày sinh" value={formatDateOnly(profile.dateOfBirth)} />
              <InfoRow label="Giới tính" value={profile.gender} />
              <InfoRow label="Số điện thoại" value={profile.phone} />
              <InfoRow label="Địa chỉ" value={profile.address} />
            </div>
          )}
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <span style={{ color: AppColors.textPrimary, fontSize: 17, fontWeight: 800 }}>Sở thích mua sắm</span>
            <div style={{ color: AppColors.textSecondary, fontSize: 12, marginTop: 2 }}>Dùng để gợi ý sản phẩm phù hợp ở Trang chủ.</div>
          </div>

          {preferences.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {preferences.map((p) => <Chip key={p.preferenceId} label={p.preferenceTag} selected onRemove={() => removeTag(p.preferenceId)} />)}
            </div>
          ) : <span style={{ color: AppColors.textSecondary, fontSize: 12 }}>Bạn chưa chọn sở thích nào.</span>}

          {availableSuggestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: 600 }}>Gợi ý nhanh</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {availableSuggestions.map((s) => <Chip key={s} label={`+ ${s}`} onClick={() => addTag(s)} />)}
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <AppTextField placeholder="Nhập sở thích khác" value={newTag} onChangeText={setNewTag} maxLength={100} onKeyDown={(e: any) => { if (e.key === 'Enter') { e.preventDefault(); addTag(newTag); } }} />
            </div>
            <AppButton label="Thêm" compact onClick={() => addTag(newTag)} loading={addingTag} disabled={!newTag.trim()} />
          </div>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: AppColors.textPrimary, fontSize: 17, fontWeight: 800 }}>Mật khẩu</span>
            {!pwOpen ? <AppButton label="Đổi mật khẩu" icon={Key} variant="secondary" compact onClick={() => setPwOpen(true)} /> : null}
          </div>
          {pwOpen ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AppTextField label="Mật khẩu hiện tại" type="password" value={pw.oldPassword} onChangeText={(v) => setPw((prev) => ({ ...prev, oldPassword: v }))} error={pwErrors.oldPassword} />
              <AppTextField label="Mật khẩu mới" placeholder="Tối thiểu 6 ký tự" type="password" value={pw.newPassword} onChangeText={(v) => setPw((prev) => ({ ...prev, newPassword: v }))} error={pwErrors.newPassword} />
              <AppTextField label="Nhập lại mật khẩu mới" type="password" value={pw.confirm} onChangeText={(v) => setPw((prev) => ({ ...prev, confirm: v }))} error={pwErrors.confirm} />
              <div style={{ display: 'flex', gap: 12 }}>
                <AppButton label="Hủy" variant="secondary" style={{ flex: 1 }} onClick={() => { setPwOpen(false); setPw(EMPTY_PASSWORD); setPwErrors({}); }} />
                <AppButton label="Cập nhật" style={{ flex: 1 }} onClick={changePassword} loading={pwSaving} />
              </div>
            </div>
          ) : null}
        </Card>

        <AppButton label="Đăng xuất" icon={LogOut} variant="danger" onClick={handleLogout} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ color: AppColors.textSecondary, fontSize: 14 }}>{label}</span>
      <span style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}
