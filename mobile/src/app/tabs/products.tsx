import { AppScreen } from '@/components/app/app-screen';
import { Chip } from '@/components/app/chip';
import { ProductCard } from '@/components/app/product-card';
import { ScreenHeader } from '@/components/app/screen-header';
import { EmptyView, ErrorView, LoadingView } from '@/components/app/state-views';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { useApi } from '@/hooks/use-api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { productService } from '@/services/product.service';
import type { Product, ProductSortBy } from '@/types/product';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

const GRID_GAP = 12;

const SORTS: { key: string; label: string; sortBy: ProductSortBy; sortOrder: 'asc' | 'desc' }[] = [
  { key: 'new', label: 'Mới nhất', sortBy: 'productId', sortOrder: 'desc' },
  { key: 'priceAsc', label: 'Giá tăng dần', sortBy: 'price', sortOrder: 'asc' },
  { key: 'priceDesc', label: 'Giá giảm dần', sortBy: 'price', sortOrder: 'desc' },
  { key: 'name', label: 'Tên A-Z', sortBy: 'productName', sortOrder: 'asc' },
];

const PRICE_RANGES: { key: string; label: string; min?: number; max?: number }[] = [
  { key: 'all', label: 'Mọi mức giá' },
  { key: 'u500', label: 'Dưới 500K', max: 500_000 },
  { key: '500-1m', label: '500K - 1 triệu', min: 500_000, max: 1_000_000 },
  { key: '1m-2m', label: '1 - 2 triệu', min: 1_000_000, max: 2_000_000 },
  { key: 'o2m', label: 'Trên 2 triệu', min: 2_000_000 },
];

/**
 * Tab Sản phẩm: tìm kiếm theo tên, lọc theo danh mục / thương hiệu / khoảng giá
 * và sắp xếp — gọi GET /products/search (mục II.2 của đề bài).
 */
export default function ProductsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ category?: string; t?: string }>();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [priceKey, setPriceKey] = useState('all');
  const [sortKey, setSortKey] = useState('new');
  const [showFilters, setShowFilters] = useState(false);

  // Nhận danh mục được chọn từ Trang chủ.
  useEffect(() => {
    if (params.category) setCategory(params.category);
  }, [params.category, params.t]);

  const debouncedKeyword = useDebouncedValue(keyword.trim(), 350);

  // Danh sách đầy đủ, chỉ để dựng các lựa chọn lọc (danh mục, thương hiệu).
  const { data: allProducts } = useApi(() => productService.list(), []);
  const categories = uniqueSorted(allProducts?.map((p) => p.category));
  const brands = uniqueSorted(allProducts?.map((p) => p.brand));

  const { data, loading, refreshing, fetching, error, refresh, reload } = useApi(() => {
    const price = PRICE_RANGES.find((r) => r.key === priceKey);
    const sort = SORTS.find((s) => s.key === sortKey) ?? SORTS[0];
    return productService.search({
      keyword: debouncedKeyword || undefined,
      category: category ?? undefined,
      brand: brand ?? undefined,
      minPrice: price?.min,
      maxPrice: price?.max,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    });
  }, [debouncedKeyword, category, brand, priceKey, sortKey]);

  const activeFilterCount = (brand ? 1 : 0) + (priceKey !== 'all' ? 1 : 0) + (sortKey !== 'new' ? 1 : 0);
  const cardWidth = (width - SCREEN_PADDING * 2 - GRID_GAP) / 2;

  const resetFilters = () => {
    setBrand(null);
    setPriceKey('all');
    setSortKey('new');
  };

  const openProduct = (p: Product) =>
    router.push({ pathname: '/product/[id]', params: { id: String(p.productId) } });

  return (
    <AppScreen>
      <ScreenHeader
        title="Sản phẩm"
        subtitle={data ? `${data.length} sản phẩm` : undefined}
        right={fetching && data ? <ActivityIndicator size="small" color={AppColors.accent} /> : undefined}
      />

      {/* Ô tìm kiếm + nút bộ lọc */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={AppColors.textSecondary} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Tìm tên giày..."
            placeholderTextColor={AppColors.textSecondary}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {keyword ? (
            <Pressable onPress={() => setKeyword('')} hitSlop={8} accessibilityLabel="Xóa từ khóa">
              <Ionicons name="close-circle" size={18} color={AppColors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setShowFilters((v) => !v)}
          style={[styles.filterButton, (showFilters || activeFilterCount > 0) && styles.filterButtonOn]}
          accessibilityLabel="Bộ lọc">
          <Ionicons
            name="options-outline"
            size={20}
            color={showFilters || activeFilterCount > 0 ? AppColors.accentText : AppColors.textPrimary}
          />
          {activeFilterCount > 0 ? (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* Danh mục */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroller}>
        <Chip label="Tất cả" selected={category === null} onPress={() => setCategory(null)} />
        {categories.map((c) => (
          <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>

      {/* Bảng bộ lọc nâng cao */}
      {showFilters ? (
        <View style={styles.filterPanel}>
          <FilterGroup title="Thương hiệu">
            <Chip label="Tất cả" selected={brand === null} onPress={() => setBrand(null)} />
            {brands.map((b) => (
              <Chip key={b} label={b} selected={brand === b} onPress={() => setBrand(b)} />
            ))}
          </FilterGroup>
          <FilterGroup title="Khoảng giá">
            {PRICE_RANGES.map((r) => (
              <Chip key={r.key} label={r.label} selected={priceKey === r.key} onPress={() => setPriceKey(r.key)} />
            ))}
          </FilterGroup>
          <FilterGroup title="Sắp xếp">
            {SORTS.map((s) => (
              <Chip key={s.key} label={s.label} selected={sortKey === s.key} onPress={() => setSortKey(s.key)} />
            ))}
          </FilterGroup>
          {activeFilterCount > 0 ? (
            <Pressable onPress={resetFilters} hitSlop={8}>
              <Text style={styles.resetText}>Xóa bộ lọc</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Lưới sản phẩm */}
      {loading && !data ? (
        <LoadingView />
      ) : !data ? (
        <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(p) => String(p.productId)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={AppColors.accent} />
          }
          renderItem={({ item }) => (
            <ProductCard product={item} width={cardWidth} onPress={() => openProduct(item)} />
          )}
          ListEmptyComponent={
            <EmptyView
              icon="search-outline"
              title="Không tìm thấy sản phẩm"
              message="Thử đổi từ khóa hoặc bỏ bớt bộ lọc."
              actionLabel={keyword || category || activeFilterCount > 0 ? 'Xóa tất cả bộ lọc' : undefined}
              onAction={() => {
                setKeyword('');
                setCategory(null);
                resetFilters();
              }}
            />
          }
        />
      )}
    </AppScreen>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterChips}>{children}</View>
    </View>
  );
}

function uniqueSorted(values?: (string | null | undefined)[]): string[] {
  if (!values) return [];
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b));
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  searchInput: { flex: 1, minHeight: 48, color: AppColors.textPrimary, fontSize: 15 },
  filterButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  filterButtonOn: { backgroundColor: AppColors.accent, borderColor: AppColors.accent },
  filterCount: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.danger,
  },
  filterCountText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  chipScroller: { flexGrow: 0 },
  chipRow: { gap: 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: 12 },

  filterPanel: {
    gap: 14,
    marginHorizontal: SCREEN_PADDING,
    marginBottom: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  filterGroup: { gap: 8 },
  filterTitle: { color: AppColors.textSecondary, fontSize: 12, fontWeight: '700' },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  resetText: { color: AppColors.accent, fontSize: 13, fontWeight: '700', textAlign: 'center' },

  columnWrapper: { gap: GRID_GAP },
  gridContent: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 24, gap: GRID_GAP, flexGrow: 1 },
});
