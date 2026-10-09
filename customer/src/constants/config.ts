export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api';

export const AUTH_TOKEN_KEY = 'crm_shoesstore.auth_token';
export const AUTH_ACCOUNT_KEY = 'crm_shoesstore.auth_account';
