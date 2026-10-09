import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

const HEARTBEAT_MS = 15000;
const SESSION_KEY = 'crm_shoesstore.presence_session'; // riêng theo từng tab
const VISITOR_KEY = 'crm_shoesstore.presence_visitor';  // bền theo trình duyệt, dùng khi CHƯA đăng nhập

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Mỗi tab 1 sessionId riêng để server tính đúng khi khách mở nhiều tab. */
function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = randomId();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** ID khách vãng lai (chưa đăng nhập) — bền qua nhiều tab/lần mở lại trình duyệt. */
function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = randomId();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function send(path: 'heartbeat' | 'offline', token: string | null, sessionId: string, visitorId: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  // keepalive: request vẫn được gửi đi khi tab đang đóng.
  return fetch(`${API_BASE_URL}/presence/${path}`, {
    method: 'POST',
    keepalive: true,
    headers,
    body: JSON.stringify({ sessionId, visitorId }),
  }).catch(() => {});
}

/**
 * Báo cho server biết đang có người online (heartbeat) và khi rời web
 * (offline). Chạy cho CẢ khách đã đăng nhập lẫn khách đang ở trang đăng
 * nhập/đăng ký (chưa có token) — chỉ tạm dừng khi AuthProvider còn đang
 * kiểm tra phiên đăng nhập (status === 'loading').
 */
export function usePresence() {
  const { status, token } = useAuth();

  useEffect(() => {
    if (status === 'loading') return;

    const sessionId = getSessionId();
    const visitorId = getVisitorId();
    const currentToken = status === 'signedIn' ? token : null;

    const beat = () => { send('heartbeat', currentToken, sessionId, visitorId); };
    const onVisible = () => { if (document.visibilityState === 'visible') beat(); };
    const onLeave = () => { send('offline', currentToken, sessionId, visitorId); };

    beat(); // báo online ngay khi vào web / đổi trạng thái đăng nhập, không cần reload
    const timer = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', beat);
    window.addEventListener('pagehide', onLeave);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', beat);
      window.removeEventListener('pagehide', onLeave);
      onLeave(); // rời trang / đổi trạng thái đăng nhập (vd. vừa đăng xuất) => offline ngay
    };
  }, [status, token]);
}
