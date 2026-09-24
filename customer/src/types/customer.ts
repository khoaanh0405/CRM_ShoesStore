export type CustomerProfile = {
  customerId: number;
  fullName: string;
  dateOfBirth: string;
  gender: string | null;
  phone: string | null;
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
  address?: string;
};

export type ChangePasswordPayload = { oldPassword: string; newPassword: string; };
