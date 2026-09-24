import { AUTH_ACCOUNT_KEY, AUTH_TOKEN_KEY } from '@/constants/config';
import { authService } from '@/services/auth.service';
import type { Account, LoginPayload, RegisterPayload } from '@/types/auth';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

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
 * Token JWT + account lưu trong localStorage (thay cho expo-secure-store ở
 * bản mobile) — services/api-client.ts tự đọc token gắn vào header Authorization.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedAccount = localStorage.getItem(AUTH_ACCOUNT_KEY);
      if (storedToken && storedAccount) {
        setToken(storedToken);
        setAccount(JSON.parse(storedAccount) as Account);
        setStatus('signedIn');
      } else {
        setStatus('signedOut');
      }
    } catch {
      setStatus('signedOut');
    }
  }, []);

  const login = async (payload: LoginPayload) => {
    const { token: newToken, account: newAccount } = await authService.login(payload);
    persistSession(newToken, newAccount);
    setToken(newToken);
    setAccount(newAccount);
    setStatus('signedIn');
  };

  const register = async (payload: RegisterPayload) => {
    // POST /accounts/register chỉ tạo tài khoản, không trả token -> đăng nhập
    // luôn bằng username/password vừa nhập để vào thẳng app.
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
