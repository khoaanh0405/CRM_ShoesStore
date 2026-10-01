import { AuthBanner } from '@/components/AuthBanner';
import { AuthButton } from '@/components/AuthButton';
import { AuthTextField } from '@/components/AuthTextField';
import { AuthColors } from '@/constants/authTheme';
import { getApiErrorMessage } from '@/services/api-client';
import { authService } from '@/services/auth.service';
import { normalizePhone, validateConfirmPassword, validateDateOfBirth, validateNewPassword, validatePhone, validateUsername } from '@/utils/validation';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Form = { username: string; dateOfBirth: string; phone: string; newPassword: string; confirm: string };
const INITIAL: Form = { username: '', dateOfBirth: '', phone: '', newPassword: '', confirm: '' };

/** Quên mật khẩu: xác minh bằng tên đăng nhập + ngày sinh + số điện thoại đã đăng ký, rồi đặt mật khẩu mới. */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string | null>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setField = (field: keyof Form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const next: Partial<Record<keyof Form, string | null>> = {
      username: validateUsername(form.username),
      dateOfBirth: validateDateOfBirth(form.dateOfBirth),
      phone: form.phone.trim() ? validatePhone(form.phone) : 'Vui lòng nhập số điện thoại đã đăng ký.',
      newPassword: validateNewPassword(form.newPassword, form.username),
      confirm: validateConfirmPassword(form.newPassword, form.confirm),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await authService.forgotPassword({
        username: form.username.trim(),
        dateOfBirth: form.dateOfBirth.trim(),
        phone: normalizePhone(form.phone),
        newPassword: form.newPassword,
      });
      alert('Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.');
      navigate('/auth/login', { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Không thể đặt lại mật khẩu, vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="auth-form" style={{ background: AuthColors.background }}>
      <AuthBanner />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
        <button type="button" onClick={() => navigate('/auth/login', { replace: true })}
          style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, color: AuthColors.textSecondary, fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </button>
        <div>
          <h1 style={{ color: AuthColors.textPrimary, fontSize: 28, fontWeight: 800, lineHeight: '34px' }}>Quên mật khẩu?</h1>
          <p style={{ color: AuthColors.textSecondary, fontSize: 13.5, marginTop: 4 }}>Xác minh thông tin bạn đã đăng ký để đặt mật khẩu mới.</p>
        </div>

        <div className="auth-grid">
          <div className="full">
            <AuthTextField label="Tên đăng nhập" placeholder="ten_dang_nhap" autoCapitalize="none" autoCorrect="off" maxLength={50} value={form.username} onChangeText={setField('username')} error={errors.username} />
          </div>
          <AuthTextField label="Ngày sinh" type="date" min="1900-01-01" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChangeText={setField('dateOfBirth')} error={errors.dateOfBirth} />
          <AuthTextField label="Số điện thoại đã đăng ký" placeholder="09xx xxx xxx" inputMode="tel" maxLength={15} value={form.phone} onChangeText={setField('phone')} error={errors.phone} />
          <AuthTextField label="Mật khẩu mới" placeholder="Tối thiểu 6 ký tự, có chữ hoa, số, ký tự đặc biệt" type="password" secureToggle maxLength={50} value={form.newPassword} onChangeText={setField('newPassword')} error={errors.newPassword} />
          <AuthTextField label="Nhập lại mật khẩu mới" placeholder="Nhập lại mật khẩu" type="password" secureToggle maxLength={50} value={form.confirm} onChangeText={setField('confirm')} error={errors.confirm} />
        </div>

        {formError ? <div style={{ color: AuthColors.danger, fontSize: 13 }}>{formError}</div> : null}

        <AuthButton label="Đặt lại mật khẩu" type="submit" onClick={() => {}} loading={submitting} />
      </div>
    </form>
  );
}
