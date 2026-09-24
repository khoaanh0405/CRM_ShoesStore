import { AuthColors } from '@/constants/authTheme';
import { useNavigate } from 'react-router-dom';

export function AuthSegmentedTabs({ active }: { active: 'login' | 'register' }) {
  const navigate = useNavigate();
  const item = (key: 'login' | 'register', label: string) => {
    const isActive = active === key;
    return (
      <button
        onClick={() => navigate(`/auth/${key}`, { replace: true })}
        style={{
          flex: 1, padding: '10px 0', borderRadius: 999, border: 'none',
          background: isActive ? AuthColors.accent : 'transparent',
          color: isActive ? AuthColors.accentText : AuthColors.textSecondary,
          fontWeight: 600, fontSize: 13,
        }}>
        {label}
      </button>
    );
  };
  return (
    <div style={{ display: 'flex', background: AuthColors.surface, borderRadius: 999, padding: 4, gap: 4 }}>
      {item('login', 'Đăng nhập')}
      {item('register', 'Tạo tài khoản')}
    </div>
  );
}
