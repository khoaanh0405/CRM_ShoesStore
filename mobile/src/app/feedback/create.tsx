import { AppButton } from '@/components/app/app-button';
import { AppScreen } from '@/components/app/app-screen';
import { AppTextField } from '@/components/app/app-text-field';
import { RatingStars } from '@/components/app/rating-stars';
import { ScreenHeader } from '@/components/app/screen-header';
import { EmptyView, LoadingView } from '@/components/app/state-views';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { useApi } from '@/hooks/use-api';
import { useCustomerId } from '@/hooks/use-customer-id';
import { getApiErrorMessage } from '@/services/api-client';
import { feedbackService } from '@/services/feedback.service';
import { productService } from '@/services/product.service';
import type { Product } from '@/types/product';
import { formatPrice } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const TITLE_MAX = 150;

/** Gửi phản hồi về sản phẩm (mục 4.3.3). Phản hồi mới có trạng thái "Chờ duyệt". */
export default function CreateFeedbackScreen() {
  const router = useRouter();
  const customerId = useCustomerId();
  const params = useLocalSearchParams<{ productId?: string }>();

  const [selectedId, setSelectedId] = useState<number | null>(
    params.productId ? Number(params.productId) : null
  );
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<{ product?: string; rating?: string; title?: string; content?: string }>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: products, loading } = useApi(() => productService.list(), []);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/tabs/feedbacks'));
  const selected = products?.find((p) => p.productId === selectedId) ?? null;

  const handleSubmit = async () => {
    const next = {
      product: selectedId == null ? 'Vui lòng chọn sản phẩm.' : undefined,
      rating: rating < 1 ? 'Vui lòng chọn số sao.' : undefined,
      title: !title.trim() ? 'Vui lòng nhập tiêu đề.' : title.trim().length > TITLE_MAX ? `Tối đa ${TITLE_MAX} ký tự.` : undefined,
      content: !content.trim() ? 'Vui lòng nhập nội dung đánh giá.' : undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean) || selectedId == null || customerId == null) return;

    setSubmitting(true);
    try {
      await feedbackService.create({
        customerId,
        productId: selectedId,
        title: title.trim(),
        content: content.trim(),
        rating,
      });
      Alert.alert(
        'Đã gửi đánh giá',
        'Phản hồi của bạn đang chờ cửa hàng duyệt. Cảm ơn bạn!',
        [{ text: 'Đóng', onPress: goBack }],
        { cancelable: false }
      );
    } catch (e) {
      Alert.alert('Không gửi được đánh giá', getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen edges={['top', 'bottom']}>
      <ScreenHeader title="Viết đánh giá" onBack={goBack} />

      {loading && !products ? (
        <LoadingView />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Chọn sản phẩm */}
            <View style={styles.field}>
              <Text style={styles.label}>Sản phẩm</Text>
              <Pressable
                onPress={() => setPickerOpen(true)}
                style={[styles.picker, !!errors.product && styles.pickerError]}>
                {selected ? (
                  <>
                    <ProductThumb product={selected} />
                    <View style={styles.pickerTexts}>
                      <Text style={styles.pickerName} numberOfLines={1}>
                        {selected.productName}
                      </Text>
                      <Text style={styles.pickerSub}>{formatPrice(selected.price)}</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.pickerPlaceholder}>Chọn sản phẩm bạn muốn đánh giá</Text>
                )}
                <Ionicons name="chevron-down" size={18} color={AppColors.textSecondary} />
              </Pressable>
              {errors.product ? <Text style={styles.error}>{errors.product}</Text> : null}
            </View>

            {/* Số sao */}
            <View style={styles.field}>
              <Text style={styles.label}>Mức độ hài lòng</Text>
              <RatingStars value={rating} size={34} onChange={setRating} />
              {errors.rating ? <Text style={styles.error}>{errors.rating}</Text> : null}
            </View>

            <AppTextField
              label="Tiêu đề"
              placeholder="Tóm tắt cảm nhận của bạn"
              value={title}
              onChangeText={setTitle}
              maxLength={TITLE_MAX}
              error={errors.title}
            />

            <AppTextField
              label="Nội dung"
              placeholder="Chất liệu, độ vừa chân, chất lượng sau khi sử dụng..."
              multiline
              value={content}
              onChangeText={setContent}
              error={errors.content}
            />

            <AppButton label="Gửi đánh giá" icon="paper-plane-outline" onPress={handleSubmit} loading={submitting} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <ProductPickerModal
        visible={pickerOpen}
        products={products ?? []}
        selectedId={selectedId}
        onClose={() => setPickerOpen(false)}
        onSelect={(p) => {
          setSelectedId(p.productId);
          setErrors((prev) => ({ ...prev, product: undefined }));
          setPickerOpen(false);
        }}
      />
    </AppScreen>
  );
}

function ProductThumb({ product }: { product: Product }) {
  return (
    <View style={styles.thumb}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Ionicons name="image-outline" size={18} color={AppColors.textSecondary} />
      )}
    </View>
  );
}

function ProductPickerModal({
  visible,
  products,
  selectedId,
  onClose,
  onSelect,
}: {
  visible: boolean;
  products: Product[];
  selectedId: number | null;
  onClose: () => void;
  onSelect: (product: Product) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = products.filter((p) => p.productName.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <AppScreen edges={['top', 'bottom']}>
        <ScreenHeader
          title="Chọn sản phẩm"
          right={
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Đóng">
              <Ionicons name="close" size={26} color={AppColors.textPrimary} />
            </Pressable>
          }
        />
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={AppColors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm tên giày..."
            placeholderTextColor={AppColors.textSecondary}
            style={styles.searchInput}
            autoCorrect={false}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(p) => String(p.productId)}
          contentContainerStyle={styles.pickerList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const active = item.productId === selectedId;
            return (
              <Pressable
                onPress={() => onSelect(item)}
                style={[styles.pickerRow, active && styles.pickerRowActive]}>
                <ProductThumb product={item} />
                <View style={styles.pickerTexts}>
                  <Text style={styles.pickerName} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text style={styles.pickerSub}>{[item.brand, formatPrice(item.price)].filter(Boolean).join(' • ')}</Text>
                </View>
                {active ? <Ionicons name="checkmark-circle" size={20} color={AppColors.accent} /> : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={<EmptyView icon="search-outline" title="Không tìm thấy sản phẩm" />}
        />
      </AppScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 32, paddingTop: 4, gap: 20 },
  field: { gap: 8 },
  label: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  error: { color: AppColors.danger, fontSize: 12 },

  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  pickerError: { borderColor: AppColors.danger },
  pickerPlaceholder: { flex: 1, color: AppColors.textSecondary, fontSize: 15 },
  pickerTexts: { flex: 1, gap: 2 },
  pickerName: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700' },
  pickerSub: { color: AppColors.textSecondary, fontSize: 12 },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SCREEN_PADDING,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  searchInput: { flex: 1, minHeight: 48, color: AppColors.textPrimary, fontSize: 15 },
  pickerList: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 24, gap: 10, flexGrow: 1 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  pickerRowActive: { borderColor: AppColors.accent },
});
