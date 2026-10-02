import { AuthBanner } from '@/components/AuthBanner';
import { AuthButton } from '@/components/AuthButton';
import { AuthTextField } from '@/components/AuthTextField';
import { AuthColors } from '@/constants/authTheme';
import { useCooldown } from '@/hooks/useCooldown';
import { getApiErrorMessage } from '@/services/api-client';
import { authService } from '@/services/auth.service';
import { maskEmail, OTP_LENGTH, validateConfirmPassword, validateNewPassword, validateOtp } from '@/utils/validation';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

type Form = { otp: string; newPassword: string; confirm: string };
type Errors = Partial<Record<keyof Form, string | null>>;

/** Quên mật khẩu — bước 2: nhập mã OTP nhận qua email + mật khẩu mới. */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;
  const { remaining, start: startCooldown } = useCooldown('otp-resend', 60);

  const [form, setForm] = useState<Form>({ otp: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Vào thẳng trang này mà chưa qua bước nhập email -> quay lại bước 1.
  if (!email) return <Navigate to="/auth/forgot-password" replace />;

  const setField = (field: keyof Form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: field === 'otp' ? value.replace(/\D/g, '').slice(0, OTP_LENGTH) : value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const next: Errors = {
      otp: validateOtp(form.otp),
      newPassword: validateNewPassword(form.newPassword),
      confirm: validateConfirmPassword(form.newPassword, form.confirm),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    setFormError(null);
    setInfo(null);
    try {
      await authService.resetPassword({ email, otp: form.otp.trim(), newPassword: form.newPassword });
      alert('Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.');
      navigate('/auth/login', { replace: true });
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Không thể đặt lại mật khẩu, vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (remaining > 0 || resending) return;
    setResending(true);
    setFormError(null);
    setInfo(null);
    try {
      await authService.forgotPassword(email);
      startCooldown(60);
      setInfo('Đã gửi lại mã OTP. Vui lòng kiểm tra hộp thư (kể cả mục Spam).');
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Không thể gửi lại mã, vui lòng thử lại.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="auth-form" style={{ background: AuthColors.background }}>
      <AuthBanner />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
        <button type="button" onClick={() => navigate('/auth/forgot-password', { replace: true })}
          style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, color: AuthColors.textSecondary, fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Đổi email khác
        </button>
        <div>
          <h1 style={{ color: AuthColors.textPrimary, fontSize: 28, fontWeight: 800, lineHeight: '34px' }}>Nhập mã xác nhận</h1>
          <p style={{ color: AuthColors.textSecondary, fontSize: 13.5, marginTop: 4, lineHeight: '20px' }}>
            Chúng tôi đã gửi mã OTP gồm {OTP_LENGTH} chữ số tới <b style={{ color: AuthColors.textPrimary }}>{maskEmail(email)}</b>. Mã có hiệu lực trong 10 phút.
          </p>
        </div>

        <div className="auth-grid">
          <div className="full">
            <AuthTextField label="Mã OTP" placeholder="------" inputMode="numeric" autoComplete="one-time-code" maxLength={OTP_LENGTH}
              value={form.otp} onChangeText={setField('otp')} error={errors.otp} />
          </div>
          <AuthTextField label="Mật khẩu mới" placeholder="Tối thiểu 6 ký tự, có chữ hoa, số, ký tự đặc biệt" type="password" secureToggle maxLength={50}
            value={form.newPassword} onChangeText={setField('newPassword')} error={errors.newPassword} />
          <AuthTextField label="Nhập lại mật khẩu mới" placeholder="Nhập lại mật khẩu" type="password" secureToggle maxLength={50}
            value={form.confirm} onChangeText={setField('confirm')} error={errors.confirm} />
        </div>

        {formError ? <div style={{ color: AuthColors.danger, fontSize: 13 }}>{formError}</div> : null}
        {info ? <div style={{ color: '#2E9E6B', fontSize: 13 }}>{info}</div> : null}

        <AuthButton label="Xác nhận đổi mật khẩu" type="submit" onClick={() => {}} loading={submitting} />

        <div style={{ textAlign: 'center', fontSize: 13.5, color: AuthColors.textSecondary }}>
          Chưa nhận được mã?{' '}
          <button type="button" onClick={handleResend} disabled={remaining > 0 || resending}
            style={{ background: 'none', border: 'none', padding: 0, fontSize: 13.5, fontWeight: 700, color: remaining > 0 ? AuthColors.textSecondary : AuthColors.accent, textDecoration: remaining > 0 ? 'none' : 'underline', textUnderlineOffset: 3, opacity: resending ? 0.6 : 1, cursor: remaining > 0 ? 'default' : 'pointer' }}>
            {remaining > 0 ? `Gửi lại sau ${remaining}s` : resending ? 'Đang gửi...' : 'Gửi lại mã'}
          </button>
        </div>
      </div>
    </form>
  );
}
