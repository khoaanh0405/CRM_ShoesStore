import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Power, PowerOff, Package, Truck, X } from 'lucide-react';
import {
  getProducts, createProduct, updateProduct, toggleProductActive, deleteProduct,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier
} from '../services/api';
import type { Product, Supplier, CreateProductForm, CreateSupplierForm } from '../types/product';
import './ProductsPage.css';

type MainTab = 'products' | 'suppliers';

// Format VND currency
const formatVND = (price: number | string) => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
};

// Modal Thêm / Sửa Sản phẩm
const ProductModal: React.FC<{
  product: Product | null;
  suppliers: Supplier[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ product, suppliers, onClose, onSaved }) => {
  const [form, setForm] = useState<CreateProductForm>({
    supplierId: product?.supplierId || (suppliers[0]?.supplierId ?? 1),
    productName: product?.productName || '',
    category: product?.category || 'Sneaker',
    brand: product?.brand || 'Nike',
    size: product?.size || '42',
    color: product?.color || 'Đen',
    material: product?.material || 'Da thật',
    price: product ? parseFloat(product.price as string) : 1000000,
    stockQuantity: product?.stockQuantity ?? 50,
    isActive: product?.isActive ?? true,
    imageUrl: product?.imageUrl || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim()) { toast.error('Tên sản phẩm không được trống'); return; }
    if (!form.supplierId) { toast.error('Vui lòng chọn nhà cung cấp'); return; }
    setLoading(true);
    try {
      if (product) {
        await updateProduct(product.productId, form);
        toast.success('✅ Cập nhật sản phẩm thành công!');
      } else {
        await createProduct(form);
        toast.success('✅ Thêm sản phẩm thành công!');
      }
      onSaved();
      onClose();
    } catch {
      toast.error(product ? 'Cập nhật thất bại' : 'Thêm sản phẩm thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card product-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body modal-grid-2">
            <div className="form-group full-width">
              <label className="form-label">Tên sản phẩm <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Giày Sneaker Nike Air Zoom 2026"
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nhà cung cấp <span className="required">*</span></label>
              <select
                className="form-input form-select"
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: Number(e.target.value) })}
              >
                {suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Danh mục</label>
              <input
                type="text"
                className="form-input"
                placeholder="Sneaker, Cao gót, Sandal..."
                value={form.category || ''}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Thương hiệu</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nike, Adidas, Puma..."
                value={form.brand || ''}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Giá bán (VNĐ) <span className="required">*</span></label>
              <input
                type="number"
                className="form-input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                min={0}
                step={10000}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Số lượng tồn kho</label>
              <input
                type="number"
                className="form-input"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Size / Kích thước</label>
              <input
                type="text"
                className="form-input"
                placeholder="38, 39, 40, 41, 42..."
                value={form.size || ''}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Màu sắc</label>
              <input
                type="text"
                className="form-input"
                placeholder="Đen, Trắng, Đỏ..."
                value={form.color || ''}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Chất liệu</label>
              <input
                type="text"
                className="form-input"
                placeholder="Da thật, Vải dệt mesh..."
                value={form.material || ''}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
              />
            </div>

            <div className="form-group full-width image-upload-section">
              <label className="form-label">Hình ảnh sản phẩm (URL)</label>
              <div className="image-input-container">
                <input
                  type="url"
                  className="form-input"
                  placeholder="Nhập đường dẫn ảnh sản phẩm (VD: https://images.unsplash.com/...)"
                  value={form.imageUrl || ''}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
                {form.imageUrl && (
                  <div className="image-preview">
                    <img src={form.imageUrl} alt="Preview" onError={(e) => e.currentTarget.style.display = 'none'} onLoad={(e) => e.currentTarget.style.display = 'block'} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : product ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal Thêm / Sửa Nhà cung cấp
const SupplierModal: React.FC<{
  supplier: Supplier | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ supplier, onClose, onSaved }) => {
  const [form, setForm] = useState<CreateSupplierForm>({
    supplierName: supplier?.supplierName || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierName.trim()) { toast.error('Tên nhà cung cấp không được trống'); return; }
    setLoading(true);
    try {
      if (supplier) {
        await updateSupplier(supplier.supplierId, form);
        toast.success('✅ Cập nhật nhà cung cấp thành công!');
      } else {
        await createSupplier(form);
        toast.success('✅ Thêm nhà cung cấp thành công!');
      }
      onSaved();
      onClose();
    } catch {
      toast.error(supplier ? 'Cập nhật thất bại' : 'Thêm nhà cung cấp thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{supplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Tên nhà cung cấp <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Công ty TNHH Sản xuất Giày Giày Việt"
                value={form.supplierName}
                onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input
                type="text"
                className="form-input"
                placeholder="0901234567"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="contact@supplier.com"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Địa chỉ</label>
              <input
                type="text"
                className="form-input"
                placeholder="123 Nguyễn Văn Cừ, Q.5, TP.HCM"
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : supplier ? 'Lưu thay đổi' : 'Tạo nhà cung cấp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, sups] = await Promise.all([
        getProducts(),
        getSuppliers(),
      ]);
      setProducts(prods);
      setSuppliers(sups);
    } catch {
      toast.error('Không tải được dữ liệu sản phẩm & nhà cung cấp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSupplier = supplierFilter === 'ALL' || p.supplierId === supplierFilter;
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && p.isActive);
    return matchSearch && matchSupplier && matchStatus;
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((s) =>
    s.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone ?? '').includes(searchTerm) ||
    (s.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleProductActive = async (p: Product) => {
    setActionLoadingId(p.productId);
    try {
      const updated = await toggleProductActive(p.productId, !p.isActive);
      setProducts((prev) =>
        prev.map((item) => (item.productId === p.productId ? { ...item, isActive: updated.isActive } : item))
      );
      toast.success(p.isActive ? '🔴 Đã ẩn sản phẩm' : '🟢 Đã hiện sản phẩm');
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${p.productName}"?`)) return;
    setActionLoadingId(p.productId);
    try {
      await deleteProduct(p.productId);
      setProducts((prev) => prev.filter((item) => item.productId !== p.productId));
      toast.success('Đã xóa sản phẩm');
    } catch {
      toast.error('Không thể xóa sản phẩm (đã có đánh giá liên quan)');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteSupplier = async (s: Supplier) => {
    if (!confirm(`Bạn có chắc muốn xóa nhà cung cấp "${s.supplierName}"?`)) return;
    try {
      await deleteSupplier(s.supplierId);
      setSuppliers((prev) => prev.filter((item) => item.supplierId !== s.supplierId));
      toast.success('Đã xóa nhà cung cấp');
    } catch {
      toast.error('Không thể xóa nhà cung cấp (đang có sản phẩm liên kết)');
    }
  };

  const activeProductsCount = products.filter((p) => p.isActive).length;

  return (
    <div className="products-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Sản phẩm & Nhà cung cấp</h1>
          <p className="page-subtitle">Quản lý danh mục sản phẩm, tồn kho và các đối tác nhà cung cấp</p>
        </div>
        <div className="header-actions">
          {activeTab === 'products' ? (
            <button
              id="add-product-btn"
              className="btn btn-primary"
              onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
            >
              <Plus size={18} />
              Thêm sản phẩm
            </button>
          ) : (
            <button
              id="add-supplier-btn"
              className="btn btn-primary"
              onClick={() => { setEditingSupplier(null); setShowSupplierModal(true); }}
            >
              <Plus size={18} />
              Thêm nhà cung cấp
            </button>
          )}
        </div>
      </div>

      {/* Stats overview */}
      <div className="products-stats">
        <div className="stat-chip">
          <Package size={16} />
          <span>Tổng sản phẩm: <strong>{products.length}</strong></span>
        </div>
        <div className="stat-chip active">
          <Power size={16} />
          <span>Đang kinh doanh: <strong>{activeProductsCount}</strong></span>
        </div>
        <div className="stat-chip supplier">
          <Truck size={16} />
          <span>Nhà cung cấp: <strong>{suppliers.length}</strong></span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="main-tabs">
        <button
          className={`main-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={16} />
          Sản phẩm ({products.length})
        </button>
        <button
          className={`main-tab ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <Truck size={16} />
          Nhà cung cấp ({suppliers.length})
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={activeTab === 'products' ? 'Tìm theo tên sản phẩm, thương hiệu...' : 'Tìm theo tên nhà cung cấp, SĐT, email...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {activeTab === 'products' && (
          <div className="filter-selects">
            <select
              className="form-select"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            >
              <option value="ALL">Tất cả nhà cung cấp</option>
              {suppliers.map((s) => (
                <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>
              ))}
            </select>

            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang kinh doanh</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB CONTENT 1: SẢN PHẨM */}
      {activeTab === 'products' && (
        <>
          {loading ? (
            <div className="loading-state"><div className="spinner" /><p>Đang tải danh sách sản phẩm...</p></div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <Package size={48} strokeWidth={1} />
              <p>Không tìm thấy sản phẩm nào</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Nhà cung cấp</th>
                    <th>Giá bán</th>
                    <th>Tồn kho</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, idx) => (
                    <tr key={p.productId}>
                      <td className="col-idx">{idx + 1}</td>
                      <td className="col-product-info">
                        <div className="product-item">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="product-img" />
                          ) : (
                            <div className="product-img-placeholder">
                              <Package size={18} />
                            </div>
                          )}
                          <div className="product-name-block">
                            <span className="product-title">{p.productName}</span>
                            <span className="product-brand">{p.brand ? `Hãng: ${p.brand}` : ''} {p.size ? `• Size: ${p.size}` : ''}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="tag-category">{p.category || 'N/A'}</span></td>
                      <td>{p.supplier?.supplierName || `NCC #${p.supplierId}`}</td>
                      <td><strong className="price-tag">{formatVND(p.price)}</strong></td>
                      <td><span className={`stock-badge ${p.stockQuantity < 10 ? 'low' : ''}`}>{p.stockQuantity} sp</span></td>
                      <td>
                        <span className={`status-badge ${p.isActive ? 'badge-approved' : 'badge-pending'}`}>
                          {p.isActive ? '● Đang kinh doanh' : '○ Tạm ẩn'}
                        </span>
                      </td>
                      <td className="col-actions">
                        <button
                          className="action-btn edit-btn"
                          title="Sửa"
                          onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                        >
                          Sửa
                        </button>
                        <button
                          className={`action-btn ${p.isActive ? 'toggle-off-btn' : 'toggle-on-btn'}`}
                          title={p.isActive ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
                          onClick={() => handleToggleProductActive(p)}
                          disabled={actionLoadingId === p.productId}
                        >
                          {p.isActive ? 'Ẩn' : 'Hiện'}
                        </button>
                        <button
                          className="action-btn delete-btn"
                          title="Xóa sản phẩm"
                          onClick={() => handleDeleteProduct(p)}
                          disabled={actionLoadingId === p.productId}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT 2: NHÀ CUNG CẤP */}
      {activeTab === 'suppliers' && (
        <>
          {loading ? (
            <div className="loading-state"><div className="spinner" /><p>Đang tải nhà cung cấp...</p></div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="empty-state">
              <Truck size={48} strokeWidth={1} />
              <p>Không tìm thấy nhà cung cấp nào</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tên Nhà Cung Cấp</th>
                    <th>Số Điện Thoại</th>
                    <th>Email</th>
                    <th>Địa Chỉ</th>
                    <th>Sản phẩm</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((s, idx) => (
                    <tr key={s.supplierId}>
                      <td className="col-idx">{idx + 1}</td>
                      <td><strong>{s.supplierName}</strong></td>
                      <td>{s.phone || '—'}</td>
                      <td>{s.email || '—'}</td>
                      <td>{s.address || '—'}</td>
                      <td><span className="tag-category">{s.products?.length ?? s._count?.products ?? 0} sản phẩm</span></td>
                      <td className="col-actions">
                        <button
                          className="action-btn edit-btn"
                          title="Sửa"
                          onClick={() => { setEditingSupplier(s); setShowSupplierModal(true); }}
                        >
                          Sửa
                        </button>
                        <button
                          className="action-btn delete-btn"
                          title="Xóa"
                          onClick={() => handleDeleteSupplier(s)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          suppliers={suppliers}
          onClose={() => setShowProductModal(false)}
          onSaved={loadData}
        />
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => setShowSupplierModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
};

export default ProductsPage;
