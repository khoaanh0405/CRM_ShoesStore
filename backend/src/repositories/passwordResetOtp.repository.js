/**
 * Repository cho model PasswordResetOtp (bảng password_reset_otps).
 * Mỗi lần yêu cầu mã mới, mã cũ chưa dùng bị vô hiệu (used_at) — chỉ mã mới nhất còn giá trị.
 */
import prisma from '../config/database.js';

export const passwordResetOtpRepository = {
  create({ accountId, otpHash, expiresAt }) {
    return prisma.passwordResetOtp.create({ data: { accountId, otpHash, expiresAt } });
  },

  /** Mã mới nhất (kể cả đã dùng/hết hạn) — dùng để giãn cách thời gian gửi lại. */
  findLatest(accountId) {
    return prisma.passwordResetOtp.findFirst({ where: { accountId }, orderBy: { createdAt: 'desc' } });
  },

  /** Mã mới nhất chưa dùng (có thể đã hết hạn — Service tự kiểm tra expiresAt). */
  findLatestUnused(accountId) {
    return prisma.passwordResetOtp.findFirst({
      where: { accountId, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  },

  invalidateAll(accountId) {
    return prisma.passwordResetOtp.updateMany({
      where: { accountId, usedAt: null },
      data: { usedAt: new Date() },
    });
  },

  incrementAttempts(otpId) {
    return prisma.passwordResetOtp.update({ where: { otpId }, data: { attempts: { increment: 1 } } });
  },

  markUsed(otpId) {
    return prisma.passwordResetOtp.update({ where: { otpId }, data: { usedAt: new Date() } });
  },

  remove(otpId) {
    return prisma.passwordResetOtp.delete({ where: { otpId } });
  },

  /** Dọn các mã đã hết hạn hơn 1 ngày. */
  deleteStale() {
    return prisma.passwordResetOtp.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } });
  },
};

export default passwordResetOtpRepository;
