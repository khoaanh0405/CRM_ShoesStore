import { create } from 'zustand';
import api from '../utils/api';

/** Hồ sơ nhân viên (Account + Employee) của Admin/Manager đang đăng nhập. */
export interface MyProfile {
  accountId: number;
  username: string;
  email: string | null;
  createdAt: string;
  role?: { roleName: string };
  employeeId: number | null;
  employeeCode: string | null;
  fullName: string | null;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  position: string | null;
  hireDate: string | null;
}

interface ProfileState {
  profile: MyProfile | null;
  load: () => Promise<void>;
  setProfile: (p: MyProfile) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  load: async () => {
    try {
      const res = await api.get('/accounts/me/profile');
      set({ profile: res.data?.data ?? res.data });
    } catch { /* bỏ qua: giao diện dùng username thay thế */ }
  },
  setProfile: (profile) => set({ profile }),
}));
