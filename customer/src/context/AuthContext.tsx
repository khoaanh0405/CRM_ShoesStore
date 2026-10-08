import { AUTH_ACCOUNT_KEY, AUTH_TOKEN_KEY } from '@/constants/config';
import { showAlert } from '@/lib/dialog';
import { ACCOUNT_LOCKED_EVENT, AUTH_EXPIRED_EVENT, ClientError, apiClient } from '@/services/api-client';
import { authService } from '@/services/auth.service';
import type { Account, LoginPayload, RegisterPayload } from '@/types/auth';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthContextValue {
  status: AuthStatus;
  account: Account | null;
  token: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const CUSTOMER_ROLE = 'Customer';

/** Web này chỉ dành cho khách hàng. Admin/Manager không có hồ sơ Customer nên sẽ bị 404 ở mọi API của khách. */
const isCustomerRole = (acc: Account | null | undefined) => acc?.role?.roleName === CUSTOMER_ROLE;

/** Phải đúng vai trò Customer VÀ có hồ sơ khách hàng (bảng customers), nếu không mọi API /customers/:id/... đều 404. */
const isCustomerAccount = (acc: Account | null | undefined) =>
  isCustomerRole(acc) && acc?.customer?.customerId != null;

// Đổi từ sessionStorage -> localStorage: khách đóng tab/tắt trình duyệt rồi
// mở lại vẫn còn đăng nhập, chỉ mất phiên khi bấm "Đăng xuất" tường minh.
function persistSession(token: string, account: Account) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify(account));
}

function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ACCOUNT_KEY);
}

/**
 * Quản lý phiên đăng nhập của khách hàng cho toàn app web (mục 4.3.1/4.3.2).
 * Token JWT + account lưu trong localStorage để giữ phiên xuyên suốt các lần
 * mở lại trình duyệt. Mất phiên khi gọi logout() tường minh HOẶC khi server
 * báo token sai/hết hạn (api-client phát AUTH_EXPIRED_EVENT).
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedAccount = localStorage.getItem(AUTH_ACCOUNT_KEY);
      if (storedToken && storedAccount) {
        const parsed = JSON.parse(storedAccount) as Account;
        // Phiên cũ của Admin/Manager còn sót lại -> xóa, tránh gọi API khách hàng bằng accountId không có hồ sơ.
        if (!isCustomerAccount(parsed)) {
          clearSession();
          setStatus('signedOut');
          return;
        }
        setToken(storedToken);
        setAccount(parsed);
        setStatus('signedIn');
      } else {
        setStatus('signedOut');
      }
    } catch {
      clearSession();
      setStatus('signedOut');
    }
  }, []);

  // Token hết hạn/không hợp lệ -> tự đăng xuất và báo cho khách đăng nhập lại.
  useEffect(() => {
    const onExpired = () => {
      clearSession();
      setToken(null);
      setAccount(null);
      setStatus('signedOut');
      void showAlert({ title: 'Phiên đăng nhập đã hết hạn', message: 'Vui lòng đăng nhập lại để tiếp tục.', tone: 'warning' });
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  // Đang đăng nhập mà bị khóa/xóa tài khoản -> báo lý do rồi đưa về trang chủ như người chưa đăng nhập.
  useEffect(() => {
    const onLocked = (e: Event) => {
      const message = (e as CustomEvent<{ message?: string }>).detail?.message
        || 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.';
      clearSession();
      setToken(null);
      setAccount(null);
      setStatus('signedOut');
      navigate('/tabs', { replace: true });
      void showAlert({ title: 'Tài khoản đã bị khóa', message, tone: 'error' });
    };
    window.addEventListener(ACCOUNT_LOCKED_EVENT, onLocked);
    return () => window.removeEventListener(ACCOUNT_LOCKED_EVENT, onLocked);
  }, [navigate]);

  // Kiểm tra định kỳ (10 giây) và khi quay lại tab: nếu tài khoản vừa bị khóa, server trả 401 ACCOUNT_LOCKED
  // và interceptor ở api-client sẽ phát sự kiện phía trên. Không cần chờ khách hàng bấm thao tác nào.
  useEffect(() => {
    if (status !== 'signedIn') return;
    const check = () => { if (!document.hidden) apiClient.get('/accounts/me').catch(() => {}); };
    const timer = setInterval(check, 10000);
    window.addEventListener('focus', check);
    return () => { clearInterval(timer); window.removeEventListener('focus', check); };
  }, [status]);

  const login = async (payload: LoginPayload) => {
    const { token: newToken, account: newAccount } = await authService.login(payload);
    if (!isCustomerRole(newAccount)) {
      throw new ClientError('Đây là tài khoản quản trị nên không thể đăng nhập vào trang khách hàng. Vui lòng dùng trang quản trị.');
    }
    if (!isCustomerAccount(newAccount)) {
      throw new ClientError('Tài khoản này chưa có hồ sơ khách hàng. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
    }
    persistSession(newToken, newAccount);
    setToken(newToken);
    setAccount(newAccount);
    setStatus('signedIn');
  };

  const register = async (payload: RegisterPayload) => {
    await authService.register(payload);
    await login({ username: payload.username, password: payload.password });
  };

  const logout = async () => {
    clearSession();
    setToken(null);
    setAccount(null);
    setStatus('signedOut');
  };

  const value = useMemo<AuthContextValue>(
    () => ({ status, account, token, login, register, logout }),
    [status, account, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() phải được gọi bên trong <AuthProvider>.');
  return ctx;
}
