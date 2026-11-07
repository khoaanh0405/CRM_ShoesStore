// Chuyển imageUrl lưu trong DB (vd: "/images/Nike_AirZoom_shoes.png") thành URL đầy đủ trỏ về backend.
// Web (Vite):  đặt VITE_API_URL=http://localhost:5001/api trong .env
// Mobile (Expo): đổi lấy origin từ process.env.EXPO_PUBLIC_API_URL và dùng IP máy thay cho localhost.

const API_ORIGIN: string = (
  (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5001/api'
).replace(/\/api\/?$/, '');

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" fill="#999" font-size="16" text-anchor="middle" dy=".3em">No image</text></svg>'
  );

export function resolveImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return PLACEHOLDER_IMAGE;
  if (/^(https?:|data:|blob:)/i.test(imageUrl)) return imageUrl;
  return `${API_ORIGIN}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

// Cách dùng trong ProductGrid.tsx:
//   import { resolveImageUrl, PLACEHOLDER_IMAGE } from '../utils/imageUrl';
//   <img
//     src={resolveImageUrl(product.imageUrl)}
//     alt={product.productName}
//     onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
//   />
