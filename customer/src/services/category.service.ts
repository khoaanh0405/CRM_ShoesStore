import { http } from './http';

export type Category = { categoryId: number; categoryName: string; description: string | null; productCount: number };

export const categoryService = {
  /** Danh mục (tên + mô tả, tiếng Việt) đang có sản phẩm — nguồn của mục "Sở thích mua sắm". Dữ liệu gốc nằm ở seed. */
  async listWithProducts(): Promise<Category[]> {
    const { data } = await http.get<Category[]>('/categories', { params: { withProducts: true } });
    return data;
  },
};
