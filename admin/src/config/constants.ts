export const ROLE_NAMES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
} as const;
export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];