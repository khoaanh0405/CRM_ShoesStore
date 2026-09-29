/**
 * Theo dõi số người ĐANG ONLINE theo thời gian thực bằng heartbeat, áp dụng
 * cho CẢ khách đã đăng nhập lẫn khách đang ở trang login/register (chưa có
 * customerId):
 * - Khách đã đăng nhập -> định danh theo "c:<customerId>" (dedupe nhiều tab
 *   của cùng 1 khách hàng vẫn chỉ tính 1 người).
 * - Khách chưa đăng nhập (ví dụ đang ở trang đăng nhập/đăng ký) -> định danh
 *   theo "g:<visitorId>" — visitorId là ID ngẫu nhiên lưu ở localStorage
 *   phía client (bền qua nhiều tab), KHÔNG phải sessionId theo từng tab.
 * - Mỗi tab gửi heartbeat kèm sessionId riêng (mỗi ~15s); đóng tab/logout sẽ
 *   gọi /presence/offline để trừ ngay; nếu quá SESSION_TTL_MS không heartbeat
 *   (mất mạng, sập trình duyệt...) thì tự động bị coi là offline.
 */
const SESSION_TTL_MS = 40_000;
const online = new Map(); // identityKey -> Map(sessionId -> lastBeat)

function prune(now = Date.now()) {
  for (const [key, sessions] of online) {
    for (const [sid, ts] of sessions) {
      if (now - ts > SESSION_TTL_MS) sessions.delete(sid);
    }
    if (sessions.size === 0) online.delete(key);
  }
}

/** Xác định danh tính presence từ request: ưu tiên customerId, không thì dùng visitorId (khách vãng lai). */
function identityOf(req) {
  const sessionId = String(req.body?.sessionId ?? '').slice(0, 64);
  if (!sessionId) return null;

  if (req.user?.customerId) {
    return { key: `c:${req.user.customerId}`, sessionId };
  }
  const visitorId = String(req.body?.visitorId ?? '').slice(0, 64) || sessionId;
  return { key: `g:${visitorId}`, sessionId };
}

/** Giữ lại để tương thích app.js — không còn ghi nhận presence theo mỗi request nữa. */
export function softIdentify(req, res, next) {
  next();
}

/** POST /api/presence/heartbeat — body { sessionId, visitorId? }. Không bắt buộc đăng nhập. */
export function heartbeat(req, res) {
  const identity = identityOf(req);
  if (identity) {
    if (!online.has(identity.key)) online.set(identity.key, new Map());
    online.get(identity.key).set(identity.sessionId, Date.now());
  }
  res.status(204).send();
}

/** POST /api/presence/offline — body { sessionId, visitorId? }. */
export function markOffline(req, res) {
  const identity = identityOf(req);
  if (!identity) return res.status(204).send();
  const sessions = online.get(identity.key);
  if (sessions) {
    sessions.delete(identity.sessionId);
    if (sessions.size === 0) online.delete(identity.key);
  }
  res.status(204).send();
}

/** Tổng số người đang online (gồm cả khách hàng đã đăng nhập và khách vãng lai ở trang login/register). */
export function countOnlineCustomers() {
  prune();
  return online.size;
}
