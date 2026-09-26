import { verifyToken } from '../utils/index.js';

const ONLINE_WINDOW_MS = 5 * 60 * 1000; // coi là "online" nếu có request trong 5 phút gần nhất
const lastSeen = new Map(); // customerId -> timestamp

/** Giải mã token nếu có, KHÔNG throw nếu thiếu/sai — chỉ để ghi nhận presence, không thay authenticate(). */
export function softIdentify(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(header.slice('Bearer '.length).trim());
      if (payload.customerId) lastSeen.set(payload.customerId, Date.now());
    } catch {
      // token hỏng/hết hạn -> bỏ qua, không chặn request
    }
  }
  next();
}

export function countOnlineCustomers() {
  const now = Date.now();
  let count = 0;
  for (const ts of lastSeen.values()) {
    if (now - ts <= ONLINE_WINDOW_MS) count++;
  }
  return count;
}