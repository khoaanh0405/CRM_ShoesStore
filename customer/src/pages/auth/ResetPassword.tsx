import { AuthBanner } from '@/components/AuthBanner';
import { AuthButton } from '@/components/AuthButton';
import { AuthTextField } from '@/components/AuthTextField';
import { AuthColors } from '@/constants/authTheme';
import { useCooldown } from '@/hooks/useCooldown';
import { getApiErrorMessage } from '@/services/api-client';
import { authService } from '@/services/auth.service';
import { maskEmail, OTP_LENGTH, validateConfirmPassword, validateNewPassword, validateOtp } from '@/utils/validation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

type Step = 'otp' | 'password';

/**
 * Quên mật khẩu — 2 bước trên cùng một trang:
 *  1) Chỉ hiện ô nhập mã OTP (server kiểm tra mã).
 *  2) Mã đúng mới hiện form nhập mật khẩu mới + xác nhận.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;
  const { remaining, start: startCooldown } = useCooldown('otp-resend', 60);

  const [step, setStep] = useState<Step>('otp');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ otp?: string | null; newPassword?: string | null; confirm?: string | null }>({});
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Vào thẳng trang này mà chưa qua bước nhập email -> quay lại bước 1.
  if (!email) return <Navigate to="/auth/forgot-password" replace />;

  const resetMessages = () => { setFormError(null); setInfo(null); };

  /** Bước 1: xác minh OTP. */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const err = validateOtp(otp);
    setErrors({ otp: err });
    if (err) return;

    setSubmitting(true);
    resetMessages();
    try {
      await authService.verifyOtp({ email, otp: otp.trim() });
      setStep('password');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Không thể xác minh mã OTP, vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  /** Bước 2: đặt mật khẩu mới (server kiểm tra lại OTP một lần nữa). */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const next = {
      newPassword: validateNewPassword(newPassword),
      confirm: validateConfirmPassword(newPassword, confirm),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    resetMessages();
    try {
      await authService.resetPassword({ email, otp: otp.trim(), newPassword });
      alert('Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.');
      navigate('/auth/login', { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể đặt lại mật khẩu, vui lòng thử lại.');
      setFormError(message);
      // Mã đã hết hạn/bị hủy -> quay về bước nhập mã để gửi lại.
      if (/OTP/i.test(message)) { setStep('otp'); setOtp(''); }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (remaining > 0 || resending) return;
    setResending(true);
    resetMessages();
    try {
      await authService.forgotPassword(email);
      startCooldown(60);
      setOtp('');
      setInfo('Đã gửi lại mã OTP. Vui lòng kiểm tra hộp thư (kể cả mục Spam).');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Không thể gửi lại mã, vui lòng thử lại.'));
    } finally {
      setResending(false);
    }
  };

  const linkBtn = { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, color: AuthColors.textSecondary, fontSize: 13, fontWeight: 600 } as const;
  const stepLabel = <span style={{ color: AuthColors.textSecondary, fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Bước {step === 'otp' ? 1 : 2}/2</span>;

  return (
    <form onSubmit={step === 'otp' ? handleVerifyOtp : handleResetPassword} noValidate className="auth-form" style={{ background: AuthColors.background }}>
      <AuthBanner />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
        {step === 'otp' ? (
          <>
            <button type="button" onClick={() => navigate('/auth/forgot-password', { replace: true })} style={linkBtn}>
              <ArrowLeft size={16} /> Đổi email khác
            </button>
            <div>
              {stepLabel}
              <h1 style={{ color: AuthColors.textPrimary, fontSize: 28, fontWeight: 800, lineHeight: '34px', marginTop: 4 }}>Nhập mã xác nhận</h1>
              <p style={{ color: AuthColors.textSecondary, fontSize: 13.5, marginTop: 4, lineHeight: '20px' }}>
                Chúng tôi đã gửi mã OTP gồm {OTP_LENGTH} chữ số tới <b style={{ color: AuthColors.textPrimary, wordBreak: 'break-all' }}>{maskEmail(email)}</b>. Mã có hiệu lực trong 10 phút.
              </p>
            </div>

            <AuthTextField label="Mã OTP" placeholder="------" inputMode="numeric" autoComplete="one-time-code" maxLength={OTP_LENGTH}
              value={otp} onChangeText={(v) => { setOtp(v.replace(/\D/g, '').slice(0, OTP_LENGTH)); setErrors({}); }} error={errors.otp} />

            {formError ? <div style={{ color: AuthColors.danger, fontSize: 13 }}>{formError}</div> : null}
            {info ? <div style={{ color: '#2E9E6B', fontSize: 13 }}>{info}</div> : null}

            <AuthButton label="Xác nhận mã" type="submit" onClick={() => {}} loading={submitting} />

            <div style={{ textAlign: 'center', fontSize: 13.5, color: AuthColors.textSecondary }}>
              Chưa nhận được mã?{' '}
              <button type="button" onClick={handleResend} disabled={remaining > 0 || resending}
                style={{ background: 'none', border: 'none', padding: 0, fontSize: 13.5, fontWeight: 700, color: remaining > 0 ? AuthColors.textSecondary : AuthColors.accent, textDecoration: remaining > 0 ? 'none' : 'underline', textUnderlineOffset: 3, opacity: resending ? 0.6 : 1, cursor: remaining > 0 ? 'default' : 'pointer' }}>
                {remaining > 0 ? `Gửi lại sau ${remaining}s` : resending ? 'Đang gửi...' : 'Gửi lại mã'}
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={() => { setStep('otp'); resetMessages(); setErrors({}); }} style={linkBtn}>
              <ArrowLeft size={16} /> Nhập lại mã
            </button>
            <div>
              {stepLabel}
              <h1 style={{ color: AuthColors.textPrimary, fontSize: 28, fontWeight: 800, lineHeight: '34px', marginTop: 4 }}>Tạo mật khẩu mới</h1>
              <p style={{ color: '#2E9E6B', fontSize: 13.5, marginTop: 4, lineHeight: '20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Mã OTP hợp lệ. Hãy đặt mật khẩu mới cho tài khoản của bạn.
              </p>
            </div>

            <div className="auth-grid">
              <AuthTextField label="Mật khẩu mới" placeholder="Tối thiểu 6 ký tự, có chữ hoa, số, ký tự đặc biệt" type="password" secureToggle maxLength={50}
                value={newPassword} onChangeText={(v) => { setNewPassword(v); setErrors((p) => ({ ...p, newPassword: null })); }} error={errors.newPassword} />
              <AuthTextField label="Nhập lại mật khẩu mới" placeholder="Nhập lại mật khẩu" type="password" secureToggle maxLength={50}
                value={confirm} onChangeText={(v) => { setConfirm(v); setErrors((p) => ({ ...p, confirm: null })); }} error={errors.confirm} />
            </div>

            {formError ? <div style={{ color: AuthColors.danger, fontSize: 13 }}>{formError}</div> : null}

            <AuthButton label="Xác nhận đổi mật khẩu" type="submit" onClick={() => {}} loading={submitting} />
          </>
        )}
      </div>
    </form>
  );
}
