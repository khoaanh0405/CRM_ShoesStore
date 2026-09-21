import { Platform } from 'react-native';

/**
 * Base URL của Backend API (Express, xem backend/src/app.js -> app.use('/api', routes)).
 *
 * Ưu tiên đọc từ biến môi trường EXPO_PUBLIC_API_URL (Expo tự nạp các biến bắt đầu
 * bằng EXPO_PUBLIC_ từ file mobile/.env, không cần cấu hình thêm), vì "localhost"
 * trên thiết bị thật / máy ảo KHÔNG trỏ về máy đang chạy backend.
 *
 * Tạo file mobile/.env (không commit) với nội dung, ví dụ:
 *   EXPO_PUBLIC_API_URL=http://192.168.1.5:5000/api
 *
 * Ghi chú theo môi trường chạy:
 * - Android Emulator: dùng http://10.0.2.2:5000/api (10.0.2.2 là alias của "localhost"
 *   trên máy host trong Android Emulator).
 * - iOS Simulator: http://localhost:5000/api hoạt động bình thường.
 * - Thiết bị thật qua Expo Go: PHẢI dùng địa chỉ IP LAN của máy chạy backend
 *   (vd 192.168.x.x, xem bằng "ipconfig"/"ifconfig"), điện thoại phải cùng
 *   mạng Wi-Fi với máy tính chạy `npm start` ở thư mục backend/.
 */
const FALLBACK_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  default: 'http://localhost:5000/api',
});

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? FALLBACK_URL ?? 'http://localhost:5000/api';

/** Key lưu trong expo-secure-store — xem context/auth-context.tsx. */
export const AUTH_TOKEN_KEY = 'crm_shoesstore.auth_token';
export const AUTH_ACCOUNT_KEY = 'crm_shoesstore.auth_account';
