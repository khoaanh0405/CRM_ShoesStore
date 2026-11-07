/**
 * Danh mục địa giới hành chính (CHỈ MINH HỌA).
 * Thực tế nên tải đầy đủ từ API/DB rồi thay thế hằng số PROVINCES bên dưới;
 * các hàm compose/parse không cần đổi.
 */
export type Province = { name: string; wards: string[] };

export const PROVINCES: Province[] = [
  {
    name: 'TP. Hồ Chí Minh',
    wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Đa Kao', 'Phường Tân Định', 'Phường Võ Thị Sáu', 'Phường Linh Trung', 'Phường Bình Thọ', 'Phường Tân Sơn Nhì', 'Phường Bình Đông', 'Xã Bình Chánh'],
  },
  {
    name: 'Hà Nội',
    wards: ['Phường Hàng Bạc', 'Phường Hàng Trống', 'Phường Cửa Nam', 'Phường Láng Hạ', 'Phường Dịch Vọng', 'Phường Mỹ Đình 1', 'Xã Đông Anh'],
  },
  {
    name: 'Đà Nẵng',
    wards: ['Phường Hải Châu 1', 'Phường Thạch Thang', 'Phường Mỹ An', 'Phường An Hải Bắc', 'Phường Hòa Khánh Bắc', 'Xã Hòa Vang'],
  },
  {
    name: 'Cần Thơ',
    wards: ['Phường Tân An', 'Phường Xuân Khánh', 'Phường An Bình', 'Phường Cái Khế', 'Xã Mỹ Khánh'],
  },
  {
    name: 'Hải Phòng',
    wards: ['Phường Máy Tơ', 'Phường Lạch Tray', 'Phường Đằng Giang', 'Phường Hồng Bàng', 'Xã An Hồng'],
  },
];

export type AddressParts = { street: string; province: string; ward: string };
export const EMPTY_ADDRESS: AddressParts = { street: '', province: '', ward: '' };

/** Ghép 3 phần thành 1 chuỗi để lưu vào cột address (hiển thị giữ nguyên như cũ): "Số nhà, Phường/Xã, Tỉnh/TP". */
export const composeAddress = (a: AddressParts): string =>
  [a.street.replace(/\s+/g, ' ').trim(), a.ward, a.province].filter(Boolean).join(', ');

/** Tách chuỗi đã lưu về 3 phần để sửa. Không khớp danh mục thì giữ nguyên toàn bộ ở ô "Số nhà, tên đường". */
export const parseAddress = (raw?: string | null): AddressParts => {
  const text = (raw ?? '').trim();
  if (!text) return { ...EMPTY_ADDRESS };
  const parts = text.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const province = PROVINCES.find((p) => p.name === parts[parts.length - 1]);
    const ward = province?.wards.find((w) => w === parts[parts.length - 2]);
    if (province && ward) {
      return { street: parts.slice(0, -2).join(', '), province: province.name, ward };
    }
  }
  return { street: text, province: '', ward: '' };
};

/** Kiểm tra từng phần; trả về thông báo lỗi (null = hợp lệ). */
export const validateAddressParts = (a: AddressParts): Partial<Record<keyof AddressParts, string | null>> => {
  const street = a.street.trim();
  return {
    street: !street
      ? 'Vui lòng nhập số nhà, tên đường.'
      : composeAddress(a).length > 255
        ? 'Địa chỉ quá dài (tối đa 255 ký tự).'
        : null,
    province: a.province ? null : 'Vui lòng chọn tỉnh / thành phố.',
    ward: a.ward ? null : 'Vui lòng chọn phường / xã.',
  };
};
