import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Truck, Power, Wallet, BarChart3, AlertTriangle,
} from 'lucide-react';
import { getProducts, getSuppliers } from '../../services/api';
import type { Product, Supplier } from '../../types/product';
import './ProductsReport.css';

const OV_COLORS = ['#7C3AED', '#F59E0B', '#059669', '#2563EB', '#DC2626', '#14B8A6', '#DB2777'];
const LOW_STOCK_THRESHOLD = 10;

const formatVND = (price: number | string) => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
};

const ProductsReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [prods, sups] = await Promise.all([
          getProducts({ includeInactive: true }),
          getSuppliers(),
        ]);
        setProducts(prods);
        setSuppliers(sups);
      } catch {
        toast.error('Không tải được dữ liệu báo cáo');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const overview = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.isActive).length;
    const inactiveProducts = totalProducts - activeProducts;
    const lowStockProducts = products
      .filter((p) => p.isActive && p.stockQuantity < LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
    const outOfStockCount = products.filter((p) => p.isActive && p.stockQuantity === 0).length;

    const totalInventoryValue = products.reduce(
      (sum, p) => sum + (parseFloat(p.price as unknown as string) || 0) * (p.stockQuantity || 0),
      0
    );
    const avgPrice = totalProducts
      ? products.reduce((sum, p) => sum + (parseFloat(p.price as unknown as string) || 0), 0) / totalProducts
      : 0;

    const categoryMap = new Map<string, number>();
    products.forEach((p) => {
      const key = p.category?.trim() || 'Chưa phân loại';
      categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
    });
    const byCategory = Array.from(categoryMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    const supplierMap = new Map<string, number>();
    products.forEach((p) => {
      const key = p.supplier?.supplierName || `NCC #${p.supplierId}`;
      supplierMap.set(key, (supplierMap.get(key) || 0) + 1);
    });
    const bySupplier = Array.from(supplierMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      lowStockProducts,
      outOfStockCount,
      totalInventoryValue,
      avgPrice,
      byCategory,
      bySupplier,
      totalSuppliers: suppliers.length,
    };
  }, [products, suppliers]);

  if (loading) return <div className="dashboard-loading">Đang tải báo cáo...</div>;

  return (
    <div className="products-report">
      <button type="button" className="pr-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Quay lại
      </button>

      <h1 className="db-title">Báo cáo Sản phẩm &amp; Nhà cung cấp</h1>
      <p className="db-subtitle">Tổng quan dữ liệu kho hàng đang được manager quản lý</p>

      <div className="stat-cards-grid">
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Tổng sản phẩm</span>
            <span className="stat-icon-box purple"><Package size={18} /></span>
          </div>
          <div className="stat-value">{overview.totalProducts}</div>
          <div className="stat-foot muted">Đang bán: {overview.activeProducts} · Đã ẩn: {overview.inactiveProducts}</div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Nhà cung cấp</span>
            <span className="stat-icon-box blue"><Truck size={18} /></span>
          </div>
          <div className="stat-value">{overview.totalSuppliers}</div>
          <div className="stat-foot muted">Đối tác đang hợp tác</div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Giá trị tồn kho</span>
            <span className="stat-icon-box green"><Wallet size={18} /></span>
          </div>
          <div className="stat-value" style={{ fontSize: 20 }}>{formatVND(overview.totalInventoryValue)}</div>
          <div className="stat-foot muted">Giá TB: {formatVND(overview.avgPrice)}</div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Sắp / đã hết hàng</span>
            <span className="stat-icon-box red"><AlertTriangle size={18} /></span>
          </div>
          <div className="stat-value">{overview.lowStockProducts.length}</div>
          <div className="stat-foot danger">Hết hàng: {overview.outOfStockCount}</div>
        </div>
      </div>

      <div className="pr-mid-grid">
        <div className="panel">
          <h3 className="panel-title"><BarChart3 size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Sản phẩm theo danh mục</h3>
          {overview.byCategory.length === 0 ? (
            <p className="empty-hint">Chưa có dữ liệu.</p>
          ) : (
            <ul className="bar-list">
              {overview.byCategory.map((c, i) => (
                <li key={c.label} className="bar-row">
                  <span className="bar-row-label" title={c.label}>{c.label}</span>
                  <span className="bar-row-track">
                    <span
                      className="bar-row-fill"
                      style={{
                        width: `${overview.totalProducts ? (c.count / overview.totalProducts) * 100 : 0}%`,
                        background: OV_COLORS[i % OV_COLORS.length],
                      }}
                    />
                  </span>
                  <span className="bar-row-value">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3 className="panel-title"><Truck size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Top nhà cung cấp (theo số SP)</h3>
          {overview.bySupplier.length === 0 ? (
            <p className="empty-hint">Chưa có dữ liệu.</p>
          ) : (
            <ul className="bar-list">
              {overview.bySupplier.map((s, i) => (
                <li key={s.label} className="bar-row">
                  <span className="bar-row-label" title={s.label}>{s.label}</span>
                  <span className="bar-row-track">
                    <span
                      className="bar-row-fill"
                      style={{
                        width: `${overview.totalProducts ? (s.count / overview.totalProducts) * 100 : 0}%`,
                        background: OV_COLORS[i % OV_COLORS.length],
                      }}
                    />
                  </span>
                  <span className="bar-row-value">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3 className="panel-title"><Power size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Trạng thái kinh doanh</h3>
          <ul className="crm-summary-list">
            <li><Package size={16} /> Đang kinh doanh <b>{overview.activeProducts}</b></li>
            <li><Package size={16} /> Đã tạm ẩn <b>{overview.inactiveProducts}</b></li>
            <li><AlertTriangle size={16} /> Sắp hết hàng (&lt;{LOW_STOCK_THRESHOLD}) <b>{overview.lowStockProducts.length}</b></li>
            <li><AlertTriangle size={16} /> Hết hàng <b>{overview.outOfStockCount}</b></li>
          </ul>
        </div>
      </div>

      <div className="panel pr-alert-panel">
        <h3 className="panel-title">Cảnh báo tồn kho thấp</h3>
        {overview.lowStockProducts.length === 0 ? (
          <p className="empty-hint">Không có sản phẩm nào sắp hết hàng 🎉</p>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Nhà cung cấp</th>
                  <th>Tồn kho</th>
                </tr>
              </thead>
              <tbody>
                {overview.lowStockProducts.map((p, idx) => (
                  <tr key={p.productId}>
                    <td className="col-idx">{idx + 1}</td>
                    <td>{p.productName}</td>
                    <td><span className="tag-category">{p.category || 'N/A'}</span></td>
                    <td>{p.supplier?.supplierName || `NCC #${p.supplierId}`}</td>
                    <td>
                      <span className={`stock-badge ${p.stockQuantity < LOW_STOCK_THRESHOLD ? 'low' : ''}`}>
                        {p.stockQuantity} sp
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsReport;
