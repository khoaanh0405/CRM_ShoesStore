import { Footprints } from 'lucide-react';
import type { ReactNode } from 'react';

type Kind = 'sneaker' | 'running' | 'basketball' | 'heels' | 'sandal' | 'leather';

const SHAPES: Record<Kind, ReactNode> = {
  // Giày sneaker thấp cổ + dây
  sneaker: (
    <>
      <path d="M2.5 16.5V10.5l3.8-1.2 2.7 2.7h3.5c2 0 3.5.8 4.9 2l2.7.9c1.1.4 2 1 2 2.1" />
      <rect x="2.5" y="16.5" width="19.6" height="2.8" rx="1.2" />
      <path d="M9.2 13.2l1.6-1.5M12 13.8l1.6-1.5" />
    </>
  ),
  // Giày chạy bộ: đế dày + vạch tốc độ
  running: (
    <>
      <path d="M5 15.5V11l3-.8 2 2h2.5c2 0 3.6.8 5 2l2 .8c1 .4 1.8.9 1.8 1.8" />
      <path d="M5 15.5h16.8v2.6H6.4C5.6 18.1 5 17.5 5 16.8z" />
      <path d="M1.5 9h3M1 12h2.5M2 15h1.5" />
    </>
  ),
  // Giày bóng rổ: cổ cao
  basketball: (
    <>
      <path d="M4.5 17V3.5H10v5l3 2.2c2 .4 3.8 1.2 5.2 2.4l2.2.9c1 .4 1.6 1 1.6 2" />
      <rect x="4.5" y="17" width="17.5" height="2.8" rx="1.2" />
      <path d="M4.5 7h3.5M4.5 10.5h4M10.5 12.2l1.5-1.2" />
    </>
  ),
  // Giày cao gót
  heels: (
    <>
      <path d="M4.5 4v7.5c0 2.3 1.5 3.8 4 4.3l9.4 1.9c1.3.3 2.3-.4 2.3-1.4 0-.8-.6-1.4-1.5-1.7-3.3-1-6.2-3.4-7.7-7.3L8.2 4z" />
      <path d="M6 14l-1 7" />
    </>
  ),
  // Sandal: đế mỏng + quai
  sandal: (
    <>
      <path d="M3 17c0-1.3 1.2-2.2 3-2.2h9.5c3.4 0 5.7 1 5.7 2.3s-1.3 2-3 2H6c-1.8 0-3-.8-3-2.1z" />
      <path d="M9 14.8c.3-3 1.6-5 3.6-6.2M15 14.8c-.2-2-1-3.5-2.4-4.6M10 11.5h4.5" />
    </>
  ),
  // Giày da (oxford)
  leather: (
    <>
      <path d="M3 16.5v-5c1.3.1 3-.4 4.2-2l2 1.7c1.8 1.3 3.8 1.8 6 1.8 2.6 0 5.8.8 5.8 3.5" />
      <rect x="3" y="16.5" width="19" height="2.5" rx="1" />
      <path d="M10 11.7l1.2-1.4M12.8 12.6l1.2-1.4" />
    </>
  ),
};

const ALIASES: Record<string, Kind> = {
  'giày sneaker': 'sneaker', 'thể thao': 'sneaker', 'giày thể thao': 'sneaker', sport: 'sneaker', sports: 'sneaker',
  'chạy bộ': 'running', 'giày chạy bộ': 'running', run: 'running',
  'bóng rổ': 'basketball', 'giày bóng rổ': 'basketball',
  heel: 'heels', 'cao gót': 'heels', 'giày cao gót': 'heels', 'high heels': 'heels',
  'giày sandal': 'sandal', sandals: 'sandal', 'dép': 'sandal',
  leather: 'leather', da: 'leather', 'giày da': 'leather', oxford: 'leather', formal: 'leather', loafer: 'leather',
};

function resolveKind(name: string): Kind | null {
  const key = name.trim().toLowerCase();
  if (key in SHAPES) return key as Kind;
  return ALIASES[key] ?? null;
}

/** Icon giày theo loại danh mục (không khớp loại nào thì dùng icon mặc định). */
export function CategoryIcon({ name, size = 24 }: { name: string; size?: number }) {
  const kind = resolveKind(name);
  if (!kind) return <Footprints size={size} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {SHAPES[kind]}
    </svg>
  );
}
