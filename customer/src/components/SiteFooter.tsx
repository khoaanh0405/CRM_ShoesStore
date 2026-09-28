import { SITE } from '@/constants/site';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{SITE.name}</div>
          <p style={{ fontSize: 13.5, lineHeight: '21px', maxWidth: 300 }}>
            Cửa hàng giày chính hãng — khám phá sản phẩm, chia sẻ trải nghiệm và nhận ưu đãi dành riêng cho bạn.
          </p>
        </div>

        <div>
          <h4>Khám phá</h4>
          <ul className="footer-list">
            <li><Link to="/tabs">Trang chủ</Link></li>
            <li><Link to="/tabs/products">Sản phẩm</Link></li>
            <li><Link to="/tabs/surveys">Khảo sát</Link></li>
            <li><Link to="/tabs/feedbacks">Đánh giá</Link></li>
          </ul>
        </div>

        <div>
          <h4>Tài khoản</h4>
          <ul className="footer-list">
            <li><Link to="/tabs/profile">Hồ sơ cá nhân</Link></li>
            <li><Link to="/notifications">Thông báo</Link></li>
            <li><Link to="/auth/login">Đăng nhập</Link></li>
            <li><Link to="/auth/register">Đăng ký</Link></li>
          </ul>
        </div>

        <div>
          <h4>Liên hệ</h4>
          <ul className="footer-list footer-contact">
            <li><Phone size={16} /><span>Hotline: <a href={`tel:${SITE.hotlineRaw}`}>{SITE.hotline}</a></span></li>
            <li><Mail size={16} /><span>{SITE.email}</span></li>
            <li><MapPin size={16} /><span>{SITE.address}</span></li>
            <li><Clock size={16} /><span>{SITE.hours}</span></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">© 2026 {SITE.name}. Bảo lưu mọi quyền.</div>
    </footer>
  );
}