import { useAuthStore } from '../../store/useAuthStore';
import { ROLE_NAMES } from '../../config/constants';
import AdminDashboard from '../admin/Dashboard';
import ManagerDashboard from '../manager/Dashboard';

const RoleDashboard = () => {
  const roleName = useAuthStore((s) => s.roleName);
  return roleName === ROLE_NAMES.MANAGER ? <ManagerDashboard /> : <AdminDashboard />;
};

export default RoleDashboard;