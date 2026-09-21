import { AppColors } from '@/constants/appTheme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

type Props = {
  value: number;
  size?: number;
  /** Có onChange thì cho phép chạm để chọn số sao. */
  onChange?: (value: number) => void;
};

export function RatingStars({ value, size = 16, onChange }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: onChange ? 8 : 2 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = (
          <Ionicons
            name={n <= Math.round(value) ? 'star' : 'star-outline'}
            size={size}
            color={AppColors.warning}
          />
        );
        return onChange ? (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={6} accessibilityLabel={`${n} sao`}>
            {icon}
          </Pressable>
        ) : (
          <View key={n}>{icon}</View>
        );
      })}
    </View>
  );
}
