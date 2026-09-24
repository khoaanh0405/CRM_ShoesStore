import { AuthColors } from '@/constants/authTheme';

/**
 * Banner trên cùng màn Login/Register. Bản mobile dùng ảnh tĩnh
 * assets/images/banner_Login-Register_UI.jpg — đặt file ảnh đó vào
 * customer-web/src/assets/banner.jpg rồi đổi div bên dưới thành
 * <img src={banner} .../> nếu muốn dùng đúng ảnh gốc. Tạm thời dùng
 * gradient để không phụ thuộc asset khi mới init project.
 */
export function AuthBanner() {
  return (
    <div style={{
      width: '100%', aspectRatio: '16 / 9', overflow: 'hidden',
      background: `linear-gradient(135deg, ${AuthColors.accent}33, ${AuthColors.background})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: AuthColors.accent, fontSize: 28, fontWeight: 800, letterSpacing: 1 }}>CRM ShoesStore</span>
    </div>
  );
}
