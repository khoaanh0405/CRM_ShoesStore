import { AuthBanner } from '@/components/AuthBanner';
import { AuthButton } from '@/components/AuthButton';
import { AuthSegmentedTabs } from '@/components/AuthSegmentedTabs';
import { AuthTextField } from '@/components/AuthTextField';
import { Chip } from '@/components/Chip';
import { AuthColors } from '@/constants/authTheme';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/services/api-client';
import { validateDateOfBirth, validateFullName, validatePassword, validatePhone, validateUsername } from '@/utils/validation';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];

type RegisterForm = { username: string; password: string; fullName: string; dateOfBirth: string; gender: string; phone: string; address: string; };
const INITIAL_FORM: RegisterForm = { username: '', password: '', fullName: '', dateOfBirth: '', gender: '', phone: '', address: '' };

/** Khách hàng tự đăng ký tài khoản (mục 4.3.1 Yeu_cau_do_an.docx). */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string | null>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setField = (field: keyof RegisterForm) => (value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setFormError(null);
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
      navigate('/tabs', { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Không thể tạo tài khoản, vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ flex: 1, background: AuthColors.background, display: 'flex', flexDirection: 'column' }}>
      <AuthBanner />
      <div style={{ padding: '24px 24px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <AuthSegmentedTabs active="register" />
        <div>
          <h1 style={{ color: AuthColors.textPrimary, fontSize: 28, fontWeight: 800, lineHeight: '34px' }}>Tạo tài khoản<br />mới.</h1>
          <p style={{ color: AuthColors.textSecondary, fontSize: 14, marginTop: 6 }}>Đăng ký để nhận ưu đãi và theo dõi đơn hàng.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AuthTextField label="Tên đăng nhập" placeholder="ten_dang_nhap" autoCapitalize="none" autoCorrect="off" value={form.username} onChangeText={setField('username')} error={errors.username} />
          <AuthTextField label="Mật khẩu" placeholder="Tối thiểu 6 ký tự" type="password" secureToggle value={form.password} onChangeText={setField('password')} error={errors.password} />
          <AuthTextField label="Họ và tên" placeholder="Nguyễn Văn A" value={form.fullName} onChangeText={setField('fullName')} error={errors.fullName} />
          <AuthTextField label="Ngày sinh" placeholder="YYYY-MM-DD (vd: 2003-05-20)" value={form.dateOfBirth} onChangeText={setField('dateOfBirth')} error={errors.dateOfBirth} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ color: AuthColors.textSecondary, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Giới tính (không bắt buộc)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {GENDER_OPTIONS.map((option) => (
                <Chip key={option} label={option} selected={form.gender === option} onClick={() => setField('gender')(form.gender === option ? '' : option)} />
              ))}
            </div>
          </div>

          <AuthTextField label="Số điện thoại (không bắt buộc)" placeholder="09xx xxx xxx" value={form.phone} onChangeText={setField('phone')} error={errors.phone} />
          <AuthTextField label="Địa chỉ (không bắt buộc)" placeholder="Số nhà, đường, quận/huyện..." value={form.address} onChangeText={setField('address')} />
        </div>

        {formError ? <div style={{ color: AuthColors.danger, fontSize: 13 }}>{formError}</div> : null}

        <AuthButton label="Tạo tài khoản" type="submit" onClick={() => {}} loading={submitting} />

        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
          <span style={{ color: AuthColors.textSecondary, fontSize: 13 }}>Đã có tài khoản? </span>
          <Link to="/auth/login" replace style={{ color: AuthColors.accent, fontSize: 13, fontWeight: 700, marginLeft: 4 }}>Đăng nhập</Link>
        </div>
      </div>
    </form>
  );
}
