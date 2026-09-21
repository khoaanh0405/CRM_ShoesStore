import type { Feedback } from '@/types/feedback';
import type { Product, ProductSearchParams } from '@/types/product';
import { http } from './http';

export const productService = {
  /** GET /products — chỉ sản phẩm đang bán. */
  async list(): Promise<Product[]> {
    const { data } = await http.get<Product[]>('/products');
    return data;
  },

  /** GET /products/search — lọc/sắp xếp nâng cao (luôn chỉ lấy sản phẩm đang bán). */
  async search(params: ProductSearchParams): Promise<Product[]> {
    const { data } = await http.get<Product[]>('/products/search', {
      params: { ...params, isActive: true },
    });
    return data;
  },

  async getById(productId: number): Promise<Product> {
    const { data } = await http.get<Product>(`/products/${productId}`);
    return data;
  },

  /** GET /products/:id/feedbacks — trả về mọi trạng thái, UI tự lọc "Approved". */
  async listFeedbacks(productId: number): Promise<Feedback[]> {
    const { data } = await http.get<Feedback[]>(`/products/${productId}/feedbacks`);
    return data;
  },
};
