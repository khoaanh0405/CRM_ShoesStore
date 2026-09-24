import type { Feedback } from '@/types/feedback';
import type { Product, ProductSearchParams } from '@/types/product';
import { http } from './http';

export const productService = {
  async list(): Promise<Product[]> {
    const { data } = await http.get<Product[]>('/products');
    return data;
  },
  async search(params: ProductSearchParams): Promise<Product[]> {
    const { data } = await http.get<Product[]>('/products/search', { params: { ...params, isActive: true } });
    return data;
  },
  async getById(productId: number): Promise<Product> {
    const { data } = await http.get<Product>(`/products/${productId}`);
    return data;
  },
  async listFeedbacks(productId: number): Promise<Feedback[]> {
    const { data } = await http.get<Feedback[]>(`/products/${productId}/feedbacks`);
    return data;
  },
};
