import { AppButton } from '@/components/AppButton';
import { LogIn, Lock, UserPlus, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Props = { title?: string; message: string; icon?: LucideIcon };

/** Khối thông báo "cần đăng nhập" cho các trang khảo sát / đánh giá khi khách chưa đăng nhập. */
export function LoginRequired({ title = 'Bạn cần đăng nhập để sử dụng chức năng này', message, icon: Icon = Lock }: Props) {
  const navigate = useNavigate();
  return (
    <div className="lr-wrap">
      <div className="lr-card">
        <div className="lr-icon"><Icon size={34} /></div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="lr-actions">
          <AppButton label="Đăng nhập" icon={LogIn} onClick={() => navigate('/auth/login')} />
          <AppButton label="Tạo tài khoản" icon={UserPlus} variant="secondary" onClick={() => navigate('/auth/register')} />
        </div>
      </div>
    </div>
  );
}
