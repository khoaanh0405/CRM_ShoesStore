export type Product = {
  productId: number;
  supplierId: number;
  productName: string;
  category: string | null;
  brand: string | null;
  size: string | null;
  color: string | null;
  material: string | null;
  price: string | number;
  stockQuantity: number;
  isActive: boolean;
  imageUrl: string | null;
  supplier?: { supplierId: number; supplierName: string } | null;
};

export type ProductSortBy = 'productId' | 'price' | 'productName';

export type ProductSearchParams = {
  keyword?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ProductSortBy;
  sortOrder?: 'asc' | 'desc';
};
