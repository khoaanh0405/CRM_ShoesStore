import { useAuth } from '@/context/AuthContext';

/** customerId của người đang đăng nhập (customer.customerId === account.accountId). */
export function useCustomerId(): number | null {
  const { account } = useAuth();
  const acc = account as unknown as { accountId?: number; customer?: { customerId?: number } | null } | null;
  return acc?.customer?.customerId ?? acc?.accountId ?? null;
}
