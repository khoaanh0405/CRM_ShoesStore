export interface Supplier {
  supplierId: number;
  supplierName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  products?: Product[];
  _count?: {
    products?: number;
  };
}

export interface Product {
  productId: number;
  supplierId: number;
  productName: string;
  category?: string | null;
  brand?: string | null;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  price: number | string;
  stockQuantity: number;
  isActive: boolean;
  imageUrl?: string | null;
  supplier?: Supplier;
}

export interface CreateProductForm {
  supplierId: number;
  productName: string;
  category?: string;
  brand?: string;
  size?: string;
  color?: string;
  material?: string;
  price: number;
  stockQuantity: number;
  isActive?: boolean;
  imageUrl?: string;
}

export interface CreateSupplierForm {
  supplierName: string;
  phone?: string;
  email?: string;
  address?: string;
}
