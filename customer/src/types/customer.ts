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

export type CustomerPreference = { preferenceId: number; customerId: number; preferenceTag: string; };

export type UpdateProfilePayload = {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type ChangePasswordPayload = { oldPassword: string; newPassword: string; };
