import { AuthColors } from '@/constants/authTheme';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HIGHLIGHTS = [
  'Xem sản phẩm & tìm giày phù hợp',
  'Gửi đánh giá & tham gia khảo sát',
  'Quản lý thông tin cá nhân dễ dàng',
];

/**
 * Banner/thẻ ảnh bên trái màn Login/Register — nền gradient tối trừu tượng,
 * bo góc, badge thương hiệu góc trên, tên/mô tả góc dưới (theo bố cục "card
 * nổi" của ảnh mẫu tham khảo). Thuần trình bày — không đụng logic đăng nhập.
 */
export function AuthBanner() {
  return (
    <div style={{
      position: 'relative', height: '100%', minHeight: 320,
      background: `radial-gradient(120% 100% at 20% 0%, #4B3FA8 0%, #241D4D 55%, #14102B 100%)`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,111,232,0.5), transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: -40, width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)',
      }} />

      <div style={{ position: 'relative', padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13,
          }}>C</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>CRM ShoesStore</span>
        </div>
        <span style={{
          padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600,
        }}>Bộ sưu tập mới</span>
      </div>

      <div style={{ position: 'relative', padding: '0 24px 22px' }}>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: '28px', marginBottom: 8 }}>
          Mua sắm — Đánh giá<br />— Đồng hành.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12.5, lineHeight: '18px', marginBottom: 14 }}>
          Khám phá sản phẩm, chia sẻ trải nghiệm và nhận ưu đãi dành riêng cho bạn.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
          {HIGHLIGHTS.map((h) => (
            <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: AuthColors.accent, flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{h}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 15, background: AuthColors.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12,
            }}>👟</div>
            <div>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>CRM ShoesStore</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10.5 }}>Since 2026</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 26, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={14} color="#fff" />
            </span>
            <span style={{ width: 26, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={14} color="#fff" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}