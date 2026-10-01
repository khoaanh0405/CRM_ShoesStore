import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';

type Crumb = { label: string; to?: string };

const HOME: Crumb = { label: 'Trang chủ', to: '/tabs' };

/** Suy ra đường dẫn breadcrumb từ URL hiện tại. Trang chủ không hiển thị breadcrumb. */
function getTrail(pathname: string): Crumb[] {
  if (pathname === '/tabs') return [];
  if (pathname === '/tabs/products') return [HOME, { label: 'Sản phẩm' }];
  if (pathname.startsWith('/product/')) return [HOME, { label: 'Sản phẩm', to: '/tabs/products' }, { label: 'Chi tiết sản phẩm' }];
  if (pathname === '/tabs/surveys') return [HOME, { label: 'Khảo sát' }];
  if (pathname.startsWith('/survey/')) return [HOME, { label: 'Khảo sát', to: '/tabs/surveys' }, { label: 'Làm khảo sát' }];
  if (pathname === '/tabs/feedbacks') return [HOME, { label: 'Đánh giá' }];
  if (pathname === '/feedback/create') return [HOME, { label: 'Đánh giá', to: '/tabs/feedbacks' }, { label: 'Viết đánh giá' }];
  if (pathname === '/tabs/profile') return [HOME, { label: 'Cá nhân' }];
  if (pathname === '/notifications') return [HOME, { label: 'Thông báo' }];
  if (pathname === '/auth/login') return [HOME, { label: 'Đăng nhập' }];
  if (pathname === '/auth/register') return [HOME, { label: 'Đăng ký' }];
  if (pathname === '/auth/forgot-password') return [HOME, { label: 'Đăng nhập', to: '/auth/login' }, { label: 'Quên mật khẩu' }];
  return [];
}

export function Breadcrumb() {
  const { pathname } = useLocation();
  const trail = getTrail(pathname);
  if (trail.length === 0) return null;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {trail.map((crumb, i) => {
        const last = i === trail.length - 1;
        return (
          <Fragment key={crumb.label}>
            {crumb.to && !last ? (
              <Link to={crumb.to} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {i === 0 ? <Home size={14} /> : null}{crumb.label}
              </Link>
            ) : (
              <span className="current">{crumb.label}</span>
            )}
            {!last ? <ChevronRight size={14} /> : null}
          </Fragment>
        );
      })}
    </nav>
  );
}
