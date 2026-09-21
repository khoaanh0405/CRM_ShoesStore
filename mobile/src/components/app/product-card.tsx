import { AppColors, Radius } from '@/constants/appTheme';
import type { Product } from '@/types/product';
import { formatPrice } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  product: Product;
  width: number;
  onPress: () => void;
};

export function ProductCard({ product, width, onPress }: Props) {
  const soldOut = product.stockQuantity <= 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}>
      <View style={[styles.imageBox, { height: width }]}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <Ionicons name="image-outline" size={32} color={AppColors.textSecondary} />
        )}
        {soldOut ? (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Hết hàng</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
        <Text style={styles.name} numberOfLines={2}>
          {product.productName}
        </Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  imageBox: { alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.background },
  soldOut: {
    position: 'absolute',
    left: 8,
    top: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: AppColors.overlay,
  },
  soldOutText: { color: AppColors.textPrimary, fontSize: 11, fontWeight: '700' },
  body: { padding: 12, gap: 3 },
  brand: { color: AppColors.textSecondary, fontSize: 12 },
  name: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700', minHeight: 36 },
  price: { color: AppColors.accent, fontSize: 15, fontWeight: '800', marginTop: 2 },
});
