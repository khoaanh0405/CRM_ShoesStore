import { useAuthStore } from '../../store/useAuthStore';
import { ROLE_NAMES } from '../../config/constants';
import AdminDashboard from '../admin/Dashboard';
import ManagerDashboard from '../manager/Dashboard';
import { useSessionWatcher } from '../../hooks/useSessionWatcher';

const RoleDashboard = () => {
  const roleName = useAuthStore((s) => s.roleName);
  useSessionWatcher(); // khóa/xóa tài khoản hoặc đổi vai trò -> alert + đăng xuất
  return roleName === ROLE_NAMES.MANAGER ? <ManagerDashboard /> : <AdminDashboard />;
};

export default RoleDashboard;