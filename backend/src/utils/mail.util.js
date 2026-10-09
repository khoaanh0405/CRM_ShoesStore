/**
 * Gửi email qua Resend hoặc Brevo (chọn bằng MAIL_PROVIDER trong .env) bằng
 * fetch có sẵn của Node 18+ — không cần cài thêm package.
 * Chưa có API key và không phải production => chỉ in nội dung ra console (tiện test).
 */
import { config } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { OTP_TTL_MINUTES } from '../constants/auth.constant.js';

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.mail.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `${config.mail.fromName} <${config.mail.fromEmail}>`, to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

async function sendViaBrevo({ to, subject, html, text }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': config.mail.apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: config.mail.fromName, email: config.mail.fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
}

export async function sendMail({ to, subject, html, text }) {
  if (!config.mail.apiKey) {
    if (config.nodeEnv === 'production') throw new AppError('Hệ thống chưa cấu hình gửi email.', 503, 'MAIL_NOT_CONFIGURED');
    console.warn(`[MAIL:DEV] Chưa có API key — không gửi thật.\n  Tới: ${to}\n  Tiêu đề: ${subject}\n  ${text}`);
    return;
  }
  try {
    if (config.mail.provider === 'brevo') await sendViaBrevo({ to, subject, html, text });
    else await sendViaResend({ to, subject, html, text });
  } catch (err) {
    console.error('[MAIL ERROR]', err.message);
    throw new AppError('Không gửi được email lúc này. Vui lòng thử lại sau.', 503, 'MAIL_FAILED');
  }
}

/** Email chứa mã OTP đặt lại mật khẩu. */
export function sendPasswordResetOtpMail({ to, fullName, otp }) {
  const name = escapeHtml(fullName || 'bạn');
  const text = `Xin chào ${fullName || 'bạn'}, mã xác nhận đặt lại mật khẩu Ouran của bạn là ${otp}. Mã có hiệu lực ${OTP_TTL_MINUTES} phút. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.`;
  const html = `
  <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #E4E4E7;border-radius:16px">
    <h2 style="margin:0 0 8px;color:#18181B">Đặt lại mật khẩu Ouran</h2>
    <p style="color:#52525B;font-size:14px;line-height:21px">Xin chào ${name}, đây là mã xác nhận để đặt lại mật khẩu của bạn:</p>
    <div style="font-size:34px;font-weight:800;letter-spacing:10px;text-align:center;background:#F4F4F5;border-radius:12px;padding:16px;margin:18px 0;color:#18181B">${otp}</div>
    <p style="color:#52525B;font-size:13px;line-height:20px">Mã có hiệu lực trong <b>${OTP_TTL_MINUTES} phút</b>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.<br/>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
  </div>`;
  return sendMail({ to, subject: `Mã xác nhận đặt lại mật khẩu Ouran: ${otp}`, html, text });
}
