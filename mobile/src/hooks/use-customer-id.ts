import { useAuth } from '@/context/auth-context';

/**
 * customerId của người đang đăng nhập. Theo thiết kế DB,
 * customer.customerId === account.accountId nên có thể dùng làm dự phòng.
 */
export function useCustomerId(): number | null {
  const { account } = useAuth();
  const acc = account as unknown as {
    accountId?: number;
    customer?: { customerId?: number } | null;
  } | null;
  return acc?.customer?.customerId ?? acc?.accountId ?? null;
}
