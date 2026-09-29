import { useEffect, useRef } from 'react';

/**
 * Tự động gọi lại `fn` theo chu kỳ (mặc định 5 giây) để dữ liệu "gần real-time"
 * mà KHÔNG cần sửa backend (backend chưa có WebSocket/SSE).
 *
 * - Tạm dừng khi tab bị ẩn, và gọi ngay 1 lần khi quay lại tab / focus cửa sổ.
 * - Không chồng request: nếu lần trước chưa xong thì bỏ qua tick hiện tại.
 * - Tự dọn timer khi component bị unmount.
 * - `fn` nên là hàm "silent" (không bật spinner toàn trang) để UI không nháy.
 */
export function useAutoRefresh(
  fn: () => void | Promise<unknown>,
  intervalMs = 5000,
  enabled = true,
) {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    if (!enabled) return;
    let busy = false;

    const tick = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        await fnRef.current();
      } catch {
        /* lỗi mạng tạm thời: bỏ qua, lần tick sau sẽ thử lại */
      } finally {
        busy = false;
      }
    };

    const timer = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [intervalMs, enabled]);
}
