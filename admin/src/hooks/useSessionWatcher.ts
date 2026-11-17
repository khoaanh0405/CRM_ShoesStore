import { useCallback, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useAutoRefresh } from './useAutoRefresh';
import { ACCOUNT_BLOCKED_MESSAGE, ROLE_CHANGED_MESSAGE, isAccountBlockedError } from '../utils/accountStatus';
import { forceLogout } from '../utils/forceLogout';

const CHECK_INTERVAL_MS = 10000;

/**
 * Theo dõi phiên của nhân viên đang online (gắn ở layout chung):
 *  - khóa/xóa tài khoản  -> alert + đăng xuất
 *  - bị đổi vai trò      -> alert + đăng xuất
 * Dùng useAutoRefresh (tạm dừng khi ẩn tab, không chồng request) gọi GET /employees/me
 * rồi so roleName với roleName trong store.
 */
export const useSessionWatcher = () => {
  const roleName = useAuthStore((s) => s.roleName);
  const roleRef = useRef(roleName);
  useEffect(() => { roleRef.current = roleName; }, [roleName]);

  const check = useCallback(async () => {
    if (!roleRef.current) return;
    try {
      const res = await api.get('/employees/me');
      const data = res.data?.data ?? res.data;
      if (data?.isLocked) return forceLogout(ACCOUNT_BLOCKED_MESSAGE);
      if (data?.roleName && data.roleName !== roleRef.current) forceLogout(ROLE_CHANGED_MESSAGE);
    } catch (err: any) {
      // Mã ACCOUNT_LOCKED / ROLE_CHANGED đã được interceptor trong api.ts xử lý.
      // Ở đây bắt thêm: 404 (tài khoản bị xóa) và các lỗi khóa khác.
      if (err?.response?.status === 404 || isAccountBlockedError(err)) forceLogout(ACCOUNT_BLOCKED_MESSAGE);
    }
  }, []);

  useEffect(() => { if (roleName) check(); }, [roleName, check]); // kiểm tra ngay khi mount
  useAutoRefresh(check, CHECK_INTERVAL_MS, !!roleName);
};
