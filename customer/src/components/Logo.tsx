import { SITE } from '@/constants/site';
import type { CSSProperties } from 'react';
import logoSrc from '../../assets/icons/Logo.png';

/** Logo cửa hàng (customer/assets/icons/Logo.png). */
export function Logo({ height = 48, style }: { height?: number; style?: CSSProperties }) {
  return <img src={logoSrc} alt={SITE.name} style={{ height, width: 'auto', display: 'block', objectFit: 'contain', ...style }} />;
}
