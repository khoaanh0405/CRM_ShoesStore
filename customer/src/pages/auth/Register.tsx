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
import { useNavigate } from 'react-router-dom';

const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];

type RegisterForm = { username: string; password: string; fullName: string; dateOfBirth: string; gender: string; phone: string; address: string; };
const INITIAL_FORM: RegisterForm = { username: '', password: '', fullName: '', dateOfBirth: '', gender: '', phone: '', address: '' };

/** Khách hàng tự đăng ký tài khoản (mục 4.3.1 Yeu_cau_do_an.docx). Form 2 cột để vừa một màn hình. */
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
    <form onSubmit={handleSubmit} className="auth-form" style={{ background: AuthColors.background }}>
      <AuthBanner />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
        <AuthSegmentedTabs active="register" />
        <div>
          <h1 style={{ color: AuthColors.textPrimary, fontSize: 26, fontWeight: 800, lineHeight: '32px' }}>Tạo tài khoản mới.</h1>
          <p style={{ color: AuthColors.textSecondary, fontSize: 13.5, marginTop: 4 }}>Đăng ký để tham gia khảo sát và gửi đánh giá sản phẩm.</p>
        </div>

        <div className="auth-grid">
          <AuthTextField label="Họ và tên" placeholder="Nguyễn Văn A" value={form.fullName} onChangeText={setField('fullName')} error={errors.fullName} />
          <AuthTextField label="Ngày sinh" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChangeText={setField('dateOfBirth')} error={errors.dateOfBirth} />

          <AuthTextField label="Tên đăng nhập" placeholder="ten_dang_nhap" autoCapitalize="none" autoCorrect="off" value={form.username} onChangeText={setField('username')} error={errors.username} />
          <AuthTextField label="Mật khẩu" placeholder="Tối thiểu 6 ký tự" type="password" secureToggle value={form.password} onChangeText={setField('password')} error={errors.password} />

          <AuthTextField label="Số điện thoại" placeholder="Không bắt buộc" value={form.phone} onChangeText={setField('phone')} error={errors.phone} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: AuthColors.textSecondary, fontSize: 13, fontWeight: 600 }}>Giới tính</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 46 }}>
              {GENDER_OPTIONS.map((option) => (
                <Chip key={option} label={option} selected={form.gender === option} onClick={() => setField('gender')(form.gender === option ? '' : option)} />
              ))}
            </div>
          </div>

          <div className="full">
            <AuthTextField label="Địa chỉ" placeholder="Không bắt buộc (số nhà, đường, quận/huyện...)" value={form.address} onChangeText={setField('address')} />
          </div>
        </div>

        {formError ? <div style={{ color: AuthColors.danger, fontSize: 13 }}>{formError}</div> : null}

        <AuthButton label="Tạo tài khoản" type="submit" onClick={() => {}} loading={submitting} />
      </div>
    </form>
  );
}
