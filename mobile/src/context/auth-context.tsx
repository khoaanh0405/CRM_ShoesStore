import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AUTH_ACCOUNT_KEY, AUTH_TOKEN_KEY } from '@/constants/config';
import { authService } from '@/services/auth.service';
import type { Account, LoginPayload, RegisterPayload } from '@/types/auth';

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

async function persistSession(token: string, account: Account) {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  await SecureStore.setItemAsync(AUTH_ACCOUNT_KEY, JSON.stringify(account));
}

async function clearSession() {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(AUTH_ACCOUNT_KEY);
}

/**
 * Quản lý phiên đăng nhập của khách hàng cho toàn app (mục 4.3.1/4.3.2).
 * Token JWT + thông tin account được lưu trong expo-secure-store (mã hoá ở
 * tầng hệ điều hành) để mở lại app không phải đăng nhập lại, và để
 * services/api-client.ts tự đọc token gắn vào header Authorization.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Khôi phục phiên đã lưu khi mở app lại.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [storedToken, storedAccount] = await Promise.all([
          SecureStore.getItemAsync(AUTH_TOKEN_KEY),
          SecureStore.getItemAsync(AUTH_ACCOUNT_KEY),
        ]);
        if (cancelled) return;

        if (storedToken && storedAccount) {
          setToken(storedToken);
          setAccount(JSON.parse(storedAccount) as Account);
          setStatus('signedIn');
        } else {
          setStatus('signedOut');
        }
      } catch {
        if (!cancelled) setStatus('signedOut');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    const { token: newToken, account: newAccount } = await authService.login(payload);
    await persistSession(newToken, newAccount);
    setToken(newToken);
    setAccount(newAccount);
    setStatus('signedIn');
  };

  const register = async (payload: RegisterPayload) => {
    // POST /accounts/register chỉ tạo tài khoản, KHÔNG trả token
    // (account.controller.js#register chỉ res.status(201).json(account)).
    // Đăng nhập luôn bằng đúng username/password vừa nhập để vào thẳng app,
    // đúng trải nghiệm "đăng ký xong là dùng được ngay".
    await authService.register(payload);
    await login({ username: payload.username, password: payload.password });
  };

  const logout = async () => {
    await clearSession();
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
