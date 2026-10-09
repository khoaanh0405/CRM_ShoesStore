import { useAuth } from '@/context/AuthContext';

/**
 * customerId của người đang đăng nhập (customer.customerId === account.accountId).
 * Chỉ lấy từ hồ sơ khách hàng thật sự; tuyệt đối không suy ra từ accountId, vì tài khoản
 * Admin/Manager (hoặc tài khoản chưa có hồ sơ) sẽ làm mọi API /customers/:id/... trả 404.
 */
export function useCustomerId(): number | null {
  const { account } = useAuth();
  if (!account || account.role?.roleName !== 'Customer') return null;
  return account.customer?.customerId ?? null;
}
