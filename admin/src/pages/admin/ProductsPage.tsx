import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Search, X, ImageOff, Pencil, Trash2, Power, PowerOff, Upload,
  Package, Truck, Image as ImageIcon,
} from 'lucide-react';
import api, {
  getProducts, createProduct, updateProduct, toggleProductActive,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
} from '../../services/api';
import type { Product, Supplier, CreateProductForm, CreateSupplierForm } from '../../types/product';
import Pagination from '../../components/Pagination';
import CreatableSelect from '../../components/CreatableSelect';
import { showConfirm } from '../../lib/dialog';
import './ProductsPage.css';
import './BannerManager.css';

type Tab = 'products' | 'suppliers' | 'banners';
type SupplierRow = Supplier & { _count?: { products: number } };
interface Banner { bannerId: number; imageUrl: string; title?: string | null; sortOrder: number; isActive: boolean }

const PER_PAGE = 10;
const MAX_FILE_MB = 15;
const errMsg = (e: any, fb: string) => e?.response?.data?.message ?? fb;
const formatVND = (v: number | string) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v) || 0);
const uniq = (arr: (string | null | undefined)[]) =>
  Array.from(new Set(arr.map((v) => v?.trim()).filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, 'vi'));

/** Thu nhỏ ảnh tải lên (cạnh dài nhất tối đa maxSide px), nén JPEG để lưu gọn. */
const fileToDataUrl = (file: File, maxSide = 1600) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const s = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#fff'; // ảnh PNG trong suốt không bị nền đen khi chuyển sang JPEG
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

/** Ô chọn ảnh từ máy tính (bấm để chọn hoặc kéo-thả). Không nhập đường dẫn. */
const ImagePicker: React.FC<{
  value: string;
  onChange: (dataUrl: string) => void;
  maxSide?: number;
  ratio?: string;
  hint?: string;
}> = ({ value, onChange, maxSide = 1600, ratio = '4 / 3', hint }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return void toast.error('Vui lòng chọn file ảnh.');
    if (file.size > MAX_FILE_MB * 1024 * 1024) return void toast.error(`Ảnh quá lớn (tối đa ${MAX_FILE_MB}MB).`);
    try {
      onChange(await fileToDataUrl(file, maxSide));
    } catch {
      toast.error('Không đọc được ảnh.');
    }
  };

  return (
    <div>
      <div
        className={`image-upload-dropzone${value ? ' has-image' : ''}${dragging ? ' dragging' : ''}`}
        style={{ minHeight: 120 }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
      >
        {value ? (
          <div className="upload-preview-container" style={{ height: 'auto', aspectRatio: ratio }}>
            <img className="upload-preview-img" src={value} alt="" style={{ height: '100%' }} />
            <div className="upload-preview-overlay"><Upload size={20} /> Đổi ảnh</div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <Upload size={26} className="upload-icon" />
            <p className="upload-text"><span className="upload-link">Chọn ảnh</span> từ máy tính hoặc kéo thả vào đây</p>
            {hint && <p className="upload-hint">{hint}</p>}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }}
      />
      {value && (
        <button type="button" className="upload-remove-btn" onClick={() => onChange('')}>
          <Trash2 size={12} /> Xóa ảnh
        </button>
      )}
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; wide?: boolean; footer: React.ReactNode; children: React.ReactNode }> = ({ title, onClose, wide, footer, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className={`modal-card${wide ? ' product-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="modal-body">{children}</div>
      <div className="modal-footer">{footer}</div>
    </div>
  </div>
);

const EMPTY_P = { productName: '', supplierId: '', category: '', brand: '', material: '', size: '', color: '', price: '', stockQuantity: '0', imageUrl: '' };
const EMPTY_S = { supplierName: '', phone: '', email: '', address: '' };
const EMPTY_B = { imageUrl: '', title: '', sortOrder: '0', isActive: true };

const ProductsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('products');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  // lọc sản phẩm (áp dụng khi bấm Tìm kiếm)
  const [searchDraft, setSearchDraft] = useState('');
  const [catDraft, setCatDraft] = useState('ALL');
  const [statusDraft, setStatusDraft] = useState('ALL');
  const [filters, setFilters] = useState({ search: '', category: 'ALL', status: 'ALL' });
  const [page, setPage] = useState(1);

  // modal sản phẩm
  const [pModal, setPModal] = useState<{ editing: Product | null } | null>(null);
  const [pf, setPf] = useState(EMPTY_P);
  // modal NCC
  const [sModal, setSModal] = useState<{ editing: SupplierRow | null } | null>(null);
  const [sf, setSf] = useState(EMPTY_S);
  // modal banner
  const [bModal, setBModal] = useState<{ editing: Banner | null } | null>(null);
  const [bf, setBf] = useState(EMPTY_B);

  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, s, b] = await Promise.all([
        getProducts(),
        getSuppliers(),
        api.get('/banners/all').then((r) => r.data?.data ?? r.data ?? []).catch(() => []),
      ]);
      setProducts(p);
      setSuppliers(s as SupplierRow[]);
      setBanners(b);
    } catch (e) {
      toast.error(errMsg(e, 'Không tải được dữ liệu'));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => uniq(products.map((p) => p.category)), [products]);
  const brands = useMemo(() => uniq(products.map((p) => p.brand)), [products]);
  const materials = useMemo(() => uniq(products.map((p) => p.material)), [products]);

  const filtered = useMemo(() => {
    const k = filters.search.trim().toLowerCase();
    return products
      .filter((p) =>
        (!k || p.productName.toLowerCase().includes(k) || (p.brand ?? '').toLowerCase().includes(k)) &&
        (filters.category === 'ALL' || p.category === filters.category) &&
        (filters.status === 'ALL' || (filters.status === 'ACTIVE') === p.isActive))
      .sort((a, b) => b.productId - a.productId);
  }, [products, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchDraft, category: catDraft, status: statusDraft });
    setPage(1);
  };

  /* ================= Sản phẩm ================= */
  const openProduct = (p: Product | null) => {
    setPf(p ? {
      productName: p.productName, supplierId: String(p.supplierId), category: p.category ?? '', brand: p.brand ?? '',
      material: p.material ?? '', size: p.size ?? '', color: p.color ?? '', price: String(Number(p.price)),
      stockQuantity: String(p.stockQuantity), imageUrl: p.imageUrl ?? '',
    } : EMPTY_P);
    setPModal({ editing: p });
  };

  const saveProduct = async () => {
    if (!pf.productName.trim()) return void toast.error('Vui lòng nhập tên sản phẩm.');
    if (!pf.supplierId) return void toast.error('Vui lòng chọn nhà cung cấp.');
    const price = Number(pf.price);
    if (pf.price === '' || Number.isNaN(price) || price < 0) return void toast.error('Giá phải là số không âm.');
    const stock = Number(pf.stockQuantity || 0);
    if (!Number.isInteger(stock) || stock < 0) return void toast.error('Tồn kho phải là số nguyên không âm.');

    const payload = {
      supplierId: Number(pf.supplierId),
      productName: pf.productName.trim(),
      category: pf.category.trim() || undefined,
      brand: pf.brand.trim() || undefined,
      material: pf.material.trim() || undefined,
      size: pf.size.trim() || undefined,
      color: pf.color.trim() || undefined,
      price,
      stockQuantity: stock,
      // null = xóa ảnh (undefined sẽ bị bỏ qua khi gửi JSON nên không xóa được)
      imageUrl: pf.imageUrl || null,
    } as unknown as CreateProductForm;

    setSaving(true);
    try {
      if (pModal?.editing) await updateProduct(pModal.editing.productId, payload);
      else await createProduct(payload);
      toast.success(pModal?.editing ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
      setPModal(null);
      await load();
    } catch (e) {
      toast.error(errMsg(e, 'Lưu sản phẩm thất bại'));
    } finally { setSaving(false); }
  };

  const toggleProduct = async (p: Product) => {
    setBusyId(p.productId);
    try {
      await toggleProductActive(p.productId, !p.isActive);
      toast.success(p.isActive ? 'Đã ẩn sản phẩm' : 'Đã hiện sản phẩm');
      await load();
    } catch (e) { toast.error(errMsg(e, 'Thao tác thất bại')); }
    finally { setBusyId(null); }
  };

  /* ================= Nhà cung cấp ================= */
  const openSupplier = (s: SupplierRow | null) => {
    setSf(s ? { supplierName: s.supplierName, phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '' } : EMPTY_S);
    setSModal({ editing: s });
  };

  const saveSupplier = async () => {
    if (!sf.supplierName.trim()) return void toast.error('Vui lòng nhập tên nhà cung cấp.');
    const payload = {
      supplierName: sf.supplierName.trim(),
      phone: sf.phone.trim() || undefined,
      email: sf.email.trim() || undefined,
      address: sf.address.trim() || undefined,
    } as CreateSupplierForm;
    setSaving(true);
    try {
      if (sModal?.editing) await updateSupplier(sModal.editing.supplierId, payload);
      else await createSupplier(payload);
      toast.success(sModal?.editing ? 'Đã cập nhật nhà cung cấp' : 'Đã thêm nhà cung cấp');
      setSModal(null);
      await load();
    } catch (e) { toast.error(errMsg(e, 'Lưu nhà cung cấp thất bại')); }
    finally { setSaving(false); }
  };

  const removeSupplier = async (s: SupplierRow) => {
    const ok = await showConfirm({ title: 'Xóa nhà cung cấp?', message: `"${s.supplierName}" sẽ bị xóa.`, confirmLabel: 'Xóa', tone: 'warning', danger: true });
    if (!ok) return;
    try {
      await deleteSupplier(s.supplierId);
      toast.success('Đã xóa nhà cung cấp');
      await load();
    } catch (e) { toast.error(errMsg(e, 'Không thể xóa nhà cung cấp')); }
  };

  /* ================= Banner ================= */
  const openBanner = (b: Banner | null) => {
    setBf(b ? { imageUrl: b.imageUrl, title: b.title ?? '', sortOrder: String(b.sortOrder), isActive: b.isActive } : { ...EMPTY_B, sortOrder: String(banners.length) });
    setBModal({ editing: b });
  };

  const saveBanner = async () => {
    if (!bf.imageUrl) return void toast.error('Vui lòng chọn ảnh banner.');
    const body = {
      imageUrl: bf.imageUrl,
      title: bf.title.trim() || undefined,
      sortOrder: Number(bf.sortOrder) || 0,
      isActive: bf.isActive,
    };
    setSaving(true);
    try {
      if (bModal?.editing) await api.put(`/banners/${bModal.editing.bannerId}`, body);
      else await api.post('/banners', body);
      toast.success(bModal?.editing ? 'Đã cập nhật banner' : 'Đã thêm banner');
      setBModal(null);
      await load();
    } catch (e) { toast.error(errMsg(e, 'Lưu banner thất bại')); }
    finally { setSaving(false); }
  };

  const toggleBanner = async (b: Banner) => {
    setBusyId(b.bannerId);
    try {
      await api.patch(`/banners/${b.bannerId}/active`, { isActive: !b.isActive });
      await load();
    } catch (e) { toast.error(errMsg(e, 'Thao tác thất bại')); }
    finally { setBusyId(null); }
  };

  const removeBanner = async (b: Banner) => {
    const ok = await showConfirm({ title: 'Xóa banner?', message: 'Banner sẽ bị xóa khỏi trang khách hàng.', confirmLabel: 'Xóa', tone: 'warning', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/banners/${b.bannerId}`);
      toast.success('Đã xóa banner');
      await load();
    } catch (e) { toast.error(errMsg(e, 'Không thể xóa banner')); }
  };

  const addLabel = tab === 'products' ? 'Thêm sản phẩm' : tab === 'suppliers' ? 'Thêm nhà cung cấp' : 'Thêm banner';
  const onAdd = () => (tab === 'products' ? openProduct(null) : tab === 'suppliers' ? openSupplier(null) : openBanner(null));
  const setP = (k: keyof typeof EMPTY_P) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setPf({ ...pf, [k]: e.target.value });

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý sản phẩm, nhà cung cấp & banner</h1>
          <p className="page-subtitle">Quản lý kho hàng, đối tác cung cấp và banner hiển thị ở trang khách hàng.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={onAdd}><Plus size={16} /> {addLabel}</button>
        </div>
      </div>

      <div className="products-stats">
        <span className="stat-chip active">Đang bán: <b>{products.filter((p) => p.isActive).length}</b></span>
        <span className="stat-chip">Tổng sản phẩm: <b>{products.length}</b></span>
        <span className="stat-chip supplier">Nhà cung cấp: <b>{suppliers.length}</b></span>
        <span className="stat-chip">Banner: <b>{banners.length}</b></span>
      </div>

      <div className="main-tabs">
        <button className={`main-tab${tab === 'products' ? ' active' : ''}`} onClick={() => setTab('products')}><Package size={16} /> Sản phẩm</button>
        <button className={`main-tab${tab === 'suppliers' ? ' active' : ''}`} onClick={() => setTab('suppliers')}><Truck size={16} /> Nhà cung cấp</button>
        <button className={`main-tab${tab === 'banners' ? ' active' : ''}`} onClick={() => setTab('banners')}><ImageIcon size={16} /> Banner</button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Đang tải...</p></div>
      ) : tab === 'products' ? (
        <>
          <form className="pp-toolbar" onSubmit={applyFilters}>
            <label className="pp-toolbar__search">
              <Search size={16} className="pp-toolbar__search-icon" />
              <input className="pp-toolbar__search-input" placeholder="Tìm theo tên sản phẩm, thương hiệu..." value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} />
              {searchDraft && (
                <button type="button" className="pp-toolbar__search-reset" onClick={() => { setSearchDraft(''); setFilters((f) => ({ ...f, search: '' })); }}><X size={13} /></button>
              )}
            </label>
            <select className="form-select" value={catDraft} onChange={(e) => setCatDraft(e.target.value)}>
              <option value="ALL">Tất cả danh mục</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang bán</option>
              <option value="HIDDEN">Đã ẩn</option>
            </select>
            <button type="submit" className="pp-toolbar__submit"><Search size={16} /> Tìm kiếm</button>
          </form>

          {rows.length === 0 ? (
            <div className="empty-state"><p>Không có sản phẩm nào</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Tồn kho</th><th>Nhà cung cấp</th><th>Trạng thái</th><th className="col-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p, i) => (
                    <tr key={p.productId}>
                      <td className="col-idx">{(page - 1) * PER_PAGE + i + 1}</td>
                      <td className="col-product-info">
                        <div className="product-item">
                          {p.imageUrl ? <img className="product-img" src={p.imageUrl} alt="" /> : <div className="product-img-placeholder"><ImageOff size={18} /></div>}
                          <div className="product-name-block">
                            <span className="product-title" title={p.productName}>{p.productName}</span>
                            <span className="product-brand">{p.brand || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{p.category ? <span className="tag-category">{p.category}</span> : '—'}</td>
                      <td><span className="price-tag">{formatVND(p.price)}</span></td>
                      <td><span className={`stock-badge${p.stockQuantity < 10 ? ' low' : ''}`}>{p.stockQuantity}</span></td>
                      <td>{p.supplier?.supplierName ?? `NCC #${p.supplierId}`}</td>
                      <td><span className={`status-badge ${p.isActive ? 'badge-approved' : 'badge-rejected'}`}>{p.isActive ? '● Đang bán' : '● Đã ẩn'}</span></td>
                      <td className="col-actions">
                        <div className="action-group">
                          <button className="action-btn edit-btn" onClick={() => openProduct(p)}><Pencil size={13} /> Sửa</button>
                          <button className={`action-btn ${p.isActive ? 'toggle-off-btn' : 'toggle-on-btn'}`} disabled={busyId === p.productId} onClick={() => toggleProduct(p)}>
                            {p.isActive ? <><PowerOff size={13} /> Ẩn</> : <><Power size={13} /> Hiện</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={PER_PAGE} itemLabel="sản phẩm" onPageChange={setPage} />
            </div>
          )}
        </>
      ) : tab === 'suppliers' ? (
        suppliers.length === 0 ? (
          <div className="empty-state"><p>Chưa có nhà cung cấp nào</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr><th>#</th><th>Nhà cung cấp</th><th>Điện thoại</th><th>Email</th><th>Địa chỉ</th><th>Số SP</th><th className="col-actions">Thao tác</th></tr>
              </thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <tr key={s.supplierId}>
                    <td className="col-idx">{i + 1}</td>
                    <td><b>{s.supplierName}</b></td>
                    <td>{s.phone || '—'}</td>
                    <td>{s.email || '—'}</td>
                    <td>{s.address || '—'}</td>
                    <td>{s._count?.products ?? products.filter((p) => p.supplierId === s.supplierId).length}</td>
                    <td className="col-actions">
                      <div className="action-group">
                        <button className="action-btn edit-btn" onClick={() => openSupplier(s)}><Pencil size={13} /> Sửa</button>
                        <button className="action-btn delete-btn" onClick={() => removeSupplier(s)}><Trash2 size={13} /> Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : banners.length === 0 ? (
        <div className="empty-state">
          <ImageIcon size={44} strokeWidth={1} />
          <p>Chưa có banner nào — web khách hàng đang dùng ảnh mặc định.</p>
        </div>
      ) : (
        <div className="bn-grid">
          {banners.map((b) => (
            <div key={b.bannerId} className={`bn-card${b.isActive ? '' : ' off'}`}>
              <div className="bn-img"><img src={b.imageUrl} alt={b.title ?? 'Banner'} /></div>
              <div className="bn-body">
                <div className="bn-meta">
                  <b>{b.title || `Banner #${b.bannerId}`}</b>
                  <span>Thứ tự: {b.sortOrder}</span>
                </div>
                <div className="action-group">
                  <button className="action-btn edit-btn" onClick={() => openBanner(b)}><Pencil size={13} /> Sửa</button>
                  <button className={`action-btn ${b.isActive ? 'toggle-off-btn' : 'toggle-on-btn'}`} disabled={busyId === b.bannerId} onClick={() => toggleBanner(b)}>
                    {b.isActive ? <><PowerOff size={13} /> Tắt</> : <><Power size={13} /> Bật</>}
                  </button>
                  <button className="action-btn delete-btn" onClick={() => removeBanner(b)}><Trash2 size={13} /> Xóa</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Modal sản phẩm ===== */}
      {pModal && (
        <Modal
          wide
          title={pModal.editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
          onClose={() => !saving && setPModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setPModal(null)} disabled={saving}>Hủy</button>
            <button className="btn btn-primary" onClick={saveProduct} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </>}
        >
          <div className="modal-grid-2">
            <div className="form-group full-width">
              <label className="form-label">Tên sản phẩm<span className="required">*</span></label>
              <input className="form-input" maxLength={150} value={pf.productName} onChange={setP('productName')} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Nhà cung cấp<span className="required">*</span></label>
              <select className="form-input" value={pf.supplierId} onChange={setP('supplierId')}>
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((s) => <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Giá (VNĐ)<span className="required">*</span></label>
              <input className="form-input" type="number" min={0} value={pf.price} onChange={setP('price')} />
            </div>
            <CreatableSelect label="Danh mục" value={pf.category} options={categories} onChange={(v) => setPf({ ...pf, category: v })} createLabel="Tạo danh mục mới" />
            <CreatableSelect label="Thương hiệu" value={pf.brand} options={brands} onChange={(v) => setPf({ ...pf, brand: v })} createLabel="Tạo thương hiệu mới" />
            <CreatableSelect label="Chất liệu" value={pf.material} options={materials} onChange={(v) => setPf({ ...pf, material: v })} createLabel="Tạo chất liệu mới" />
            <div className="form-group">
              <label className="form-label">Kích cỡ</label>
              <input className="form-input" maxLength={10} value={pf.size} onChange={setP('size')} />
            </div>
            <div className="form-group">
              <label className="form-label">Màu sắc</label>
              <input className="form-input" maxLength={30} value={pf.color} onChange={setP('color')} />
            </div>
            <div className="form-group">
              <label className="form-label">Tồn kho</label>
              <input className="form-input" type="number" min={0} value={pf.stockQuantity} onChange={setP('stockQuantity')} />
            </div>
            <div className="form-group full-width">
              <label className="form-label">Ảnh sản phẩm</label>
              <ImagePicker
                value={pf.imageUrl}
                onChange={(v) => setPf((f) => ({ ...f, imageUrl: v }))}
                maxSide={900}
                ratio="4 / 3"
                hint="Nên dùng ảnh vuông hoặc tỉ lệ 4:3"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ===== Modal nhà cung cấp ===== */}
      {sModal && (
        <Modal
          title={sModal.editing ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
          onClose={() => !saving && setSModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setSModal(null)} disabled={saving}>Hủy</button>
            <button className="btn btn-primary" onClick={saveSupplier} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </>}
        >
          <div className="modal-grid-2">
            <div className="form-group full-width">
              <label className="form-label">Tên nhà cung cấp<span className="required">*</span></label>
              <input className="form-input" maxLength={150} value={sf.supplierName} onChange={(e) => setSf({ ...sf, supplierName: e.target.value })} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Điện thoại</label>
              <input className="form-input" maxLength={20} value={sf.phone} onChange={(e) => setSf({ ...sf, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" maxLength={100} value={sf.email} onChange={(e) => setSf({ ...sf, email: e.target.value })} />
            </div>
            <div className="form-group full-width">
              <label className="form-label">Địa chỉ</label>
              <input className="form-input" maxLength={255} value={sf.address} onChange={(e) => setSf({ ...sf, address: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}

      {/* ===== Modal banner ===== */}
      {bModal && (
        <Modal
          wide
          title={bModal.editing ? 'Sửa banner' : 'Thêm banner'}
          onClose={() => !saving && setBModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setBModal(null)} disabled={saving}>Hủy</button>
            <button className="btn btn-primary" onClick={saveBanner} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </>}
        >
          <div className="modal-grid-2">
            <div className="form-group full-width">
              <label className="form-label">Ảnh banner<span className="required">*</span></label>
              <ImagePicker
                value={bf.imageUrl}
                onChange={(v) => setBf((f) => ({ ...f, imageUrl: v }))}
                maxSide={1600}
                ratio="16 / 5"
                hint="Khuyến nghị tỉ lệ 16:5 (vd 1600×500)"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tiêu đề (không bắt buộc)</label>
              <input className="form-input" maxLength={150} value={bf.title} onChange={(e) => setBf({ ...bf, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Thứ tự hiển thị</label>
              <input className="form-input" type="number" min={0} value={bf.sortOrder} onChange={(e) => setBf({ ...bf, sortOrder: e.target.value })} />
              <span className="bn-hint">Số nhỏ hiển thị trước.</span>
            </div>
            <div className="form-group full-width">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600 }}>
                <input type="checkbox" checked={bf.isActive} onChange={(e) => setBf({ ...bf, isActive: e.target.checked })} /> Hiển thị trên trang khách hàng
              </label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProductsPage;
