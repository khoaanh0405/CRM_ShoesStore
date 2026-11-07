/**
 * Gửi email qua Resend hoặc Brevo (chọn bằng MAIL_PROVIDER trong .env) bằng
 * fetch có sẵn của Node 18+ — không cần cài thêm package.
 * Chưa có API key và không phải production => chỉ in nội dung ra console (tiện test).
 */
import { config } from '../config/env.js';
import { AppError } from '../errors/AppError.js';

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
