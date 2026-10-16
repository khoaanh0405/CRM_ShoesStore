export type CustomerProfile = {
  customerId: number;
  fullName: string;
  dateOfBirth: string;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  username: string;
  isLocked: boolean;
};

/** Sở thích = một danh mục đã chọn (không còn lưu tên danh mục dạng chuỗi riêng). */
export type CustomerPreference = {
  preferenceId: number;
  customerId: number;
  categoryId: number;
  category: { categoryId: number; categoryName: string; description: string | null };
};

export type UpdateProfilePayload = {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type ChangePasswordPayload = { oldPassword: string; newPassword: string; };
