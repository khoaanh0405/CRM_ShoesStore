import { AppColors } from '@/constants/appTheme';
import { Star } from 'lucide-react';

type Props = { value: number; size?: number; onChange?: (value: number) => void; };

export function RatingStars({ value, size = 16, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: onChange ? 8 : 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} onClick={() => onChange?.(n)} style={{ cursor: onChange ? 'pointer' : 'default', display: 'inline-flex' }}>
          <Star size={size} color={AppColors.warning} fill={n <= Math.round(value) ? AppColors.warning : 'none'} />
        </span>
      ))}
    </div>
  );
}
