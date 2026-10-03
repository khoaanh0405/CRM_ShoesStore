import { AuthBanner } from '@/components/AuthBanner';
import { AuthButton } from '@/components/AuthButton';
import { AuthTextField } from '@/components/AuthTextField';
import { AuthColors } from '@/constants/authTheme';
import { useCooldown } from '@/hooks/useCooldown';
import { getApiErrorMessage } from '@/services/api-client';
import { authService } from '@/services/auth.service';
import { normalizeEmail, validateEmail } from '@/utils/validation';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Quên mật khẩu — bước 1: nhập email đã đăng ký, hệ thống gửi mã OTP 6 số rồi chuyển sang trang nhập mã. */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { start: startCooldown } = useCooldown('otp-resend', 60);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const err = validateEmail(email);
    setError(err);
    if (err) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const normalized = normalizeEmail(email);
      await authService.forgotPassword(normalized);
      startCooldown(60);
      navigate('/auth/reset-password', { state: { email: normalized } });
    } catch (e) {
      setFormError(getApiErrorMessage(e, 'Không thể gửi mã OTP, vui lòng thử lại.'));
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
          <p style={{ color: AuthColors.textSecondary, fontSize: 13.5, marginTop: 4, lineHeight: '20px' }}>
            Nhập email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi mã OTP gồm 6 chữ số để bạn đặt lại mật khẩu.
          </p>
        </div>

        <AuthTextField label="Email đã đăng ký" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" maxLength={100}
          value={email} onChangeText={(v) => { setEmail(v); setError(null); }} error={error} />

        {formError ? <div style={{ color: AuthColors.danger, fontSize: 13 }}>{formError}</div> : null}

        <AuthButton label="Gửi mã OTP" type="submit" onClick={() => {}} loading={submitting} />
      </div>
    </form>
  );
}
