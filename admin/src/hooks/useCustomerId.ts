import { useAuth } from '@/context/AuthContext';

/**
 * customerId của người đang đăng nhập (customer.customerId === account.accountId).
 * Chỉ tài khoản có vai trò Customer mới có hồ sơ khách hàng; Admin/Manager trả về null
 * để các trang không gọi nhầm API /customers/:id/... bằng accountId (gây lỗi 404).
 */
export function useCustomerId(): number | null {
  const { account } = useAuth();
  if (!account || account.role?.roleName !== 'Customer') return null;
  return account.customer?.customerId ?? account.accountId ?? null;
}
