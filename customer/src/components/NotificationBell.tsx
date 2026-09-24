import { AppColors } from '@/constants/appTheme';
import { useCustomerId } from '@/hooks/useCustomerId';
import { notificationService } from '@/services/notification.service';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Chuông thông báo ở Trang chủ — đếm lại số chưa đọc mỗi khi tab được focus. */
export function NotificationBell() {
  const navigate = useNavigate();
  const customerId = useCustomerId();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (customerId == null) return;
    let active = true;
    const load = () => {
      notificationService.countUnread(customerId).then((count) => { if (active) setUnreadCount(count); }).catch(() => {});
    };
    load();
    window.addEventListener('focus', load);
    return () => { active = false; window.removeEventListener('focus', load); };
  }, [customerId]);

  return (
    <button onClick={() => navigate('/notifications')} aria-label="Xem thông báo" style={{
      position: 'relative', width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: AppColors.surface, border: `1px solid ${AppColors.border}`,
    }}>
      <Bell size={22} color={AppColors.textPrimary} />
      {unreadCount > 0 ? (
        <span style={{
          position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, padding: '0 3px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', background: AppColors.danger,
          border: `1px solid ${AppColors.background}`, color: '#fff', fontSize: 9, fontWeight: 800,
        }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
      ) : null}
    </button>
  );
}
