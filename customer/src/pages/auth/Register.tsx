import { AuthBanner } from '@/components/AuthBanner';
import { AuthButton } from '@/components/AuthButton';
import { AuthSegmentedTabs } from '@/components/AuthSegmentedTabs';
import { AuthTextField } from '@/components/AuthTextField';
import { Chip } from '@/components/Chip';
import { AuthColors } from '@/constants/authTheme';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/services/api-client';
import {
  normalizeEmail, normalizePhone, normalizeSpaces, validateAddress, validateConfirmPassword, validateDateOfBirth,
  validateEmail, validateFullName, validateNewPassword, validateNewUsername, validatePhone,
} from '@/utils/validation';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];

type RegisterForm = { username: string; email: string; password: string; confirm: string; fullName: string; dateOfBirth: string; gender: string; phone: string; address: string; };
type Errors = Partial<Record<keyof RegisterForm, string | null>>;
const INITIAL_FORM: RegisterForm = { username: '', email: '', password: '', confirm: '', fullName: '', dateOfBirth: '', gender: '', phone: '', address: '' };

const VALIDATORS: Record<keyof RegisterForm, (f: RegisterForm) => string | null> = {
  fullName: (f) => validateFullName(f.fullName),
  dateOfBirth: (f) => validateDateOfBirth(f.dateOfBirth),
  username: (f) => validateNewUsername(f.username),
  email: (f) => validateEmail(f.email),
  password: (f) => validateNewPassword(f.password, f.username),
  confirm: (f) => validateConfirmPassword(f.password, f.confirm),
  phone: (f) => validatePhone(f.phone),
  address: (f) => validateAddress(f.address),
  gender: () => null,
};

/** Khách hàng tự đăng ký tài khoản (mục 4.3.1 Yeu_cau_do_an.docx). Email dùng để lấy lại mật khẩu bằng OTP. */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setField = (field: keyof RegisterForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const blur = (field: keyof RegisterForm) => () => {
    setErrors((prev) => {
      const next = { ...prev, [field]: VALIDATORS[field](form) };
      if (field === 'password' && form.confirm) next.confirm = VALIDATORS.confirm(form);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const nextErrors = (Object.keys(VALIDATORS) as (keyof RegisterForm)[]).reduce<Errors>((acc, k) => {
      acc[k] = VALIDATORS[k](form);
      return acc;
    }, {});
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await register({
        username: form.username.trim(),
        email: normalizeEmail(form.email),
        password: form.password,
        fullName: normalizeSpaces(form.fullName),
        dateOfBirth: form.dateOfBirth.trim(),
        gender: form.gender || undefined,
        phone: normalizePhone(form.phone) || undefined,
        address: normalizeSpaces(form.address) || undefined,
      });
      navigate('/tabs', { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Không thể tạo tài khoản, vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="auth-form" style={{ background: AuthColors.background }}>
      <AuthBanner />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
        <AuthSegmentedTabs active="register" />
        <div>
          <h1 style={{ color: AuthColors.textPrimary, fontSize: 26, fontWeight: 800, lineHeight: '32px' }}>Tạo tài khoản mới.</h1>
          <p style={{ color: AuthColors.textSecondary, fontSize: 13.5, marginTop: 4 }}>Đăng ký để tham gia khảo sát và gửi đánh giá sản phẩm.</p>
        </div>

        <div className="auth-grid">
          <AuthTextField label="Họ và tên" placeholder="Nguyễn Văn A" maxLength={100} value={form.fullName} onChangeText={setField('fullName')} onBlur={blur('fullName')} error={errors.fullName} />
          <AuthTextField label="Ngày sinh" type="date" min="1900-01-01" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChangeText={setField('dateOfBirth')} onBlur={blur('dateOfBirth')} error={errors.dateOfBirth} />

          <AuthTextField label="Tên đăng nhập" placeholder="ten_dang_nhap" autoCapitalize="none" autoCorrect="off" maxLength={50} value={form.username} onChangeText={setField('username')} onBlur={blur('username')} error={errors.username} />
          <AuthTextField label="Email" placeholder="ten@gmail.com" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" maxLength={100} value={form.email} onChangeText={setField('email')} onBlur={blur('email')} error={errors.email} />

          <AuthTextField label="Mật khẩu" placeholder="Tối thiểu 6 ký tự, có chữ hoa, số, ký tự đặc biệt" type="password" secureToggle maxLength={50} value={form.password} onChangeText={setField('password')} onBlur={blur('password')} error={errors.password} />
          <AuthTextField label="Nhập lại mật khẩu" placeholder="Nhập lại mật khẩu" type="password" secureToggle maxLength={50} value={form.confirm} onChangeText={setField('confirm')} onBlur={blur('confirm')} error={errors.confirm} />

          <AuthTextField label="Số điện thoại" placeholder="Không bắt buộc" inputMode="tel" maxLength={15} value={form.phone} onChangeText={setField('phone')} onBlur={blur('phone')} error={errors.phone} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: AuthColors.textSecondary, fontSize: 13, fontWeight: 600 }}>Giới tính</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 46 }}>
              {GENDER_OPTIONS.map((option) => (
                <Chip key={option} label={option} selected={form.gender === option} onClick={() => setField('gender')(form.gender === option ? '' : option)} />
              ))}
            </div>
          </div>

          <div className="full">
            <AuthTextField label="Địa chỉ" placeholder="Không bắt buộc (số nhà, đường, quận/huyện...)" maxLength={255} value={form.address} onChangeText={setField('address')} onBlur={blur('address')} error={errors.address} />
          </div>
        </div>

        {formError ? <div style={{ color: AuthColors.danger, fontSize: 13 }}>{formError}</div> : null}

        <AuthButton label="Tạo tài khoản" type="submit" onClick={() => {}} loading={submitting} />
      </div>
    </form>
  );
}
