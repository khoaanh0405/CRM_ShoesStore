import prisma from '../config/database.js';
import { TooManyRequestsError, ForbiddenError, ConflictError } from '../errors/AppError.js';
import { FEEDBACK_STATUS, ROLE_NAMES } from '../constants/index.js';

/** Rate limit in-memory theo accountId (fallback IP). */
export function rateLimit({ windowMs, max, message }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, arr] of hits) {
      const alive = arr.filter((t) => now - t < windowMs);
      alive.length ? hits.set(k, alive) : hits.delete(k);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.user?.accountId ?? req.ip;
    const now = Date.now();
    const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (arr.length >= max) {
      const retry = Math.ceil((windowMs - (now - arr[0])) / 1000);
      res.set('Retry-After', String(retry));
      return next(new TooManyRequestsError(`${message} Vui lòng thử lại sau ${retry} giây.`));
    }
    arr.push(now);
    hits.set(key, arr);
    next();
  };
}

/** Customer chỉ được gửi dữ liệu dưới customerId của chính mình. */
export function ownCustomerOnly(req, res, next) {
  if (req.user?.roleName === ROLE_NAMES.CUSTOMER && Number(req.body.customerId) !== req.user.customerId) {
    return next(new ForbiddenError('Bạn chỉ được gửi dữ liệu dưới tên của chính mình.'));
  }
  next();
}

const MIN_INTERVAL_MS = 60_000; // 1 phản hồi / 60s
const DAILY_LIMIT = 10;         // tối đa 10 phản hồi / 24h

/** Chống spam đánh giá: giãn cách, giới hạn ngày, không gửi trùng khi còn Pending. */
export async function feedbackSpamGuard(req, res, next) {
  try {
    const customerId = Number(req.body.customerId);
    const productId = Number(req.body.productId);
    const since = new Date(Date.now() - 24 * 3600 * 1000);

    const [last, dailyCount, pendingSame] = await Promise.all([
      prisma.feedback.findFirst({ where: { customerId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
      prisma.feedback.count({ where: { customerId, createdAt: { gte: since } } }),
      prisma.feedback.findFirst({ where: { customerId, productId, status: FEEDBACK_STATUS.PENDING }, select: { feedbackId: true } }),
    ]);

    if (last) {
      const wait = Math.ceil((MIN_INTERVAL_MS - (Date.now() - last.createdAt.getTime())) / 1000);
      if (wait > 0) {
        res.set('Retry-After', String(wait));
        throw new TooManyRequestsError(`Bạn gửi đánh giá quá nhanh. Vui lòng chờ ${wait} giây.`);
      }
    }
    if (dailyCount >= DAILY_LIMIT) {
      throw new TooManyRequestsError(`Bạn đã đạt giới hạn ${DAILY_LIMIT} đánh giá trong 24 giờ.`);
    }
    if (pendingSame) {
      throw new ConflictError('Bạn đã có một đánh giá đang chờ duyệt cho sản phẩm này.');
    }
    next();
  } catch (err) {
    next(err);
  }
}