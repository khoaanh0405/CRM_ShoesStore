import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Logo } from './Logo';

const HIGHLIGHTS = [
  'Xem sản phẩm & tìm giày phù hợp',
  'Gửi đánh giá & tham gia khảo sát',
  'Quản lý thông tin cá nhân dễ dàng',
];

/** Banner bên trái màn Login/Register. Thuần trình bày. */
export function AuthBanner() {
  return (
    <div style={{
      position: 'relative', height: '100%', minHeight: 320,
      background: `radial-gradient(120% 100% at 20% 0%, #3F3F46 0%, #1C1C1F 55%, #0B0B0C 100%)`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)' }} />

      <div style={{ position: 'relative', padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '6px 10px' }}><Logo height={48} /></div>
        <span style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600 }}>Bộ sưu tập mới</span>
      </div>

      <div style={{ position: 'relative', padding: '0 24px 22px' }}>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: '28px', marginBottom: 8 }}>Mua sắm — Đánh giá<br />— Đồng hành.</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12.5, lineHeight: '18px', marginBottom: 14 }}>Khám phá sản phẩm, chia sẻ trải nghiệm và nhận ưu đãi dành riêng cho bạn.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
          {HIGHLIGHTS.map((h) => (
            <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: '#fff', flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{h}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>Since 2026</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[ChevronLeft, ChevronRight].map((Icon, i) => (
              <span key={i} style={{ width: 26, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={14} color="#fff" /></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
