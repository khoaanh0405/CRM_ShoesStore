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

const WINDOW_MS = 30 * 60 * 1000; // 30 phút
const WINDOW_LIMIT = 5;           // tối đa 5 đánh giá / 30 phút / khách

/**
 * Chống spam đánh giá: tối đa 5 đánh giá trong 30 phút (tính cả đánh giá đã thu hồi để không lách luật),
 * và không gửi trùng khi còn một đánh giá Pending cho cùng sản phẩm.
 */
export async function feedbackSpamGuard(req, res, next) {
  try {
    const customerId = Number(req.body.customerId);
    const productId = Number(req.body.productId);
    const since = new Date(Date.now() - WINDOW_MS);

    const [recent, pendingSame] = await Promise.all([
      prisma.feedback.findMany({
        where: { customerId, createdAt: { gte: since } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      prisma.feedback.findFirst({
        where: { customerId, productId, status: FEEDBACK_STATUS.PENDING, isDeleted: false },
        select: { feedbackId: true },
      }),
    ]);

    if (recent.length >= WINDOW_LIMIT) {
      const unlockAt = recent[recent.length - WINDOW_LIMIT].createdAt.getTime() + WINDOW_MS;
      const waitSec = Math.max(1, Math.ceil((unlockAt - Date.now()) / 1000));
      res.set('Retry-After', String(waitSec));
      throw new TooManyRequestsError(
        `Bạn chỉ được gửi tối đa ${WINDOW_LIMIT} đánh giá trong 30 phút. Vui lòng thử lại sau ${Math.ceil(waitSec / 60)} phút.`
      );
    }
    if (pendingSame) throw new ConflictError('Bạn đã có một đánh giá đang chờ duyệt cho sản phẩm này.');
    next();
  } catch (err) {
    next(err);
  }
}
