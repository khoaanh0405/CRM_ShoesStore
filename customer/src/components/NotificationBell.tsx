import { AppColors } from '@/constants/appTheme';
import { useCustomerId } from '@/hooks/useCustomerId';
import { notificationService } from '@/services/notification.service';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Chuông thông báo — đếm lại số chưa đọc mỗi khi tab được focus. */
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
    <button className="icon-btn" onClick={() => navigate('/notifications')} aria-label="Xem thông báo">
      <Bell size={22} />
      {unreadCount > 0 ? (
        <span style={{
          position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', background: AppColors.danger,
          border: '2px solid #fff', color: '#fff', fontSize: 10, fontWeight: 800,
        }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
      ) : null}
    </button>
  );
}
