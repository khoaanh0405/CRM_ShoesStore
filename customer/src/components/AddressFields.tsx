import { AppTextField } from '@/components/AppTextField';
import { AuthTextField } from '@/components/AuthTextField';
import { AppColors } from '@/constants/appTheme';
import { AuthColors } from '@/constants/authTheme';
import { PROVINCES, type AddressParts } from '@/constants/vnAddress';
import { ChevronDown } from 'lucide-react';
import type { CSSProperties } from 'react';

type Errors = Partial<Record<keyof AddressParts, string | null | undefined>>;

type Props = {
  /** 'auth' = trang Đăng ký, 'app' = trang Hồ sơ (chỉ khác bộ màu & ô nhập). */
  variant: 'auth' | 'app';
  value: AddressParts;
  onChange: (next: AddressParts) => void;
  errors?: Errors;
  onStreetBlur?: () => void;
};

const SELECT_STYLE: CSSProperties = {
  width: '100%',
  height: 48,
  padding: '0 44px 0 22px',
  borderRadius: 999,
  border: '1.5px solid #E2E2E7',
  background: '#fff',
  fontSize: 16,
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
  outline: 'none',
};

/** Địa chỉ khách hàng nhập theo cấu trúc: Số nhà/tên đường → Tỉnh/TP → Phường/Xã. */
export function AddressFields({ variant, value, onChange, errors = {}, onStreetBlur }: Props) {
  const isAuth = variant === 'auth';
  const labelColor = isAuth ? AuthColors.textSecondary : AppColors.textPrimary;
  const titleColor = isAuth ? AuthColors.textPrimary : AppColors.textPrimary;
  const mutedColor = isAuth ? AuthColors.textSecondary : AppColors.textSecondary;
  const dangerColor = isAuth ? AuthColors.danger : '#DC2626';
  const Street = isAuth ? AuthTextField : AppTextField;

  const wards = PROVINCES.find((p) => p.name === value.province)?.wards ?? [];

  const label = (text: string) => (
    <span style={{ color: labelColor, fontSize: 13, fontWeight: 600 }}>
      {text} <span style={{ color: dangerColor }}>*</span>
    </span>
  );

  const select = (
    id: string,
    current: string,
    placeholder: string,
    options: string[],
    onPick: (v: string) => void,
    error?: string | null,
    disabled = false,
  ) => (
    <div style={{ position: 'relative' }}>
      <select
        id={id}
        value={current}
        disabled={disabled}
        onChange={(e) => onPick(e.target.value)}
        style={{
          ...SELECT_STYLE,
          color: current ? titleColor : '#9A9AA5',
          borderColor: error ? dangerColor : '#E2E2E7',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={18} color={mutedColor} style={{ position: 'absolute', right: 18, top: 15, pointerEvents: 'none' }} />
      {error ? <div style={{ color: dangerColor, fontSize: 12, marginTop: 4 }}>{error}</div> : null}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ color: titleColor, fontSize: 18, fontWeight: 800 }}>Địa chỉ khách hàng</div>

      <Street
        label="Số nhà, tên đường *"
        placeholder="Ví dụ: 123 Nguyễn Văn Trỗi"
        maxLength={150}
        value={value.street}
        onChangeText={(v: string) => onChange({ ...value, street: v })}
        onBlur={onStreetBlur}
        error={errors.street}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label('Tỉnh / Thành phố')}
        {select('addr-province', value.province, 'Chọn tỉnh / thành phố', PROVINCES.map((p) => p.name),
          (v) => onChange({ ...value, province: v, ward: '' }), errors.province)}
        <span style={{ color: mutedColor, fontSize: 12 }}>
          Danh sách trên chỉ minh họa; hệ thống thực tế nên tải đầy đủ danh mục địa giới hành chính.
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label('Phường / Xã')}
        {select('addr-ward', value.ward, value.province ? 'Chọn phường / xã' : 'Chọn tỉnh / thành phố trước', wards,
          (v) => onChange({ ...value, ward: v }), errors.ward, !value.province)}
      </div>
    </div>
  );
}
