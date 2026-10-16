import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, RefreshCw, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import PriceDisplay from '../../components/PriceDisplay';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useToast } from '../../context/ToastContext';
import { LOW_STOCK_THRESHOLD } from '../../config/constants';

export default function AdminProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const touchDrag = useRef(null);
  const { toast } = useToast();

  // Reordering only makes sense on the full list (not a search result)
  const canReorder = !search.trim() && products.length > 1;

  // Persist the list order: row 1 → Display Order 1 (shown first on Home & Shop), row 2 → 2, …
  const saveOrder = async (next, previous) => {
    setProducts(next);
    setSavingOrder(true);
    try {
      await api.put('/products/admin/reorder', { orderedIds: next.map((p) => p._id || p.id) });
      toast.success('Product order saved.');
    } catch (e) {
      setProducts(previous);
      toast.error(e.response?.data?.message || 'Could not save the product order.');
    } finally {
      setSavingOrder(false);
    }
  };

  const moveProduct = (from, to) => {
    if (!canReorder || savingOrder || from === to || from == null || to == null || to < 0 || to >= products.length) return;
    const previous = products;
    const next = [...products];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    saveOrder(next, previous);
  };

  // Touch drag (iPad / phones): HTML5 drag events don't fire for touch
  const onTouchStartHandle = (index) => { touchDrag.current = { from: index }; setDragIndex(index); };
  const onTouchMoveHandle = (e) => {
    if (!touchDrag.current) return;
    const t = e.touches[0];
    const row = document.elementFromPoint(t.clientX, t.clientY)?.closest('tr[data-row-index]');
    if (row) setOverIndex(Number(row.dataset.rowIndex));
  };
  const onTouchEndHandle = () => {
    if (touchDrag.current && overIndex !== null) moveProduct(touchDrag.current.from, overIndex);
    touchDrag.current = null;
    setDragIndex(null);
    setOverIndex(null);
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?search=${search}&limit=500&includeUpcoming=true`);
      setProducts(res.data.products || []);
    } catch (e) {
      toast.error('Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/products/${deleteTargetId}`);
      toast.success('Product deleted successfully.');
      setDeleteTargetId(null);
      fetchProducts();
    } catch (e) {
      toast.error('Error deleting product.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#665A52', margin: '0 0 0.2rem 0' }}>
            Products
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Product Catalog
          </h2>
          <p style={{ color: '#4A3B2E', fontSize: '0.8rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            Manage catalog inventory, prices, discounts, variants, and stock status.
          </p>
          <p style={{ color: '#665A52', fontSize: '0.74rem', margin: '0.35rem 0 0 0', fontWeight: '600' }}>
            {canReorder
              ? (savingOrder ? 'Saving order…' : 'Drag ⋮⋮ (or use ↑ ↓) to set the order products appear on the Home & Shop pages.')
              : 'Clear the search to reorder products.'}
          </p>
        </div>

        <Link
          to="/admin/products/add"
          className="admin-btn-primary"
        >
          <Plus size={14} />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Search and Filters block */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '420px' }}>
          <Search size={16} color="#665A52" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, subtitle, or slug..."
            className="admin-input admin-search-input"
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>
      </div>

      {/* Main product management card table */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
            <RefreshCw size={20} className="animate-spin" color="#C68A3A" />
            <span style={{ fontSize: '0.82rem', color: '#665A52', fontWeight: '600' }}>Fetching products listing...</span>
          </div>
        ) : products.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '64px' }}>Order</th>
                <th>Product</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Pricing</th>
                <th>Variants</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, index) => {
                const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
                let lowStockVariantCount = 0;
                let outOfStockVariantCount = 0;
                let totalVariantStock = 0;

                if (hasVariants) {
                  p.variants.forEach((v) => {
                    const stk = Number(v.stock !== undefined && v.stock !== null ? v.stock : (v.in_stock ? 50 : 0));
                    totalVariantStock += stk;
                    if (stk === 0) outOfStockVariantCount++;
                    else if (stk <= LOW_STOCK_THRESHOLD) lowStockVariantCount++;
                  });
                }

                const productStock = Number(p.stock !== undefined && p.stock !== null ? p.stock : totalVariantStock);
                const displayPrice = p.price || p.variants?.[0]?.price || 0;
                const displayOrigPrice = p.originalPrice || p.variants?.[0]?.originalPrice || displayPrice;

                return (
                  <tr
                    key={p._id || p.slug}
                    data-row-index={index}
                    draggable={canReorder && !savingOrder}
                    onDragStart={(e) => { setDragIndex(index); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragOver={(e) => { if (dragIndex !== null) { e.preventDefault(); setOverIndex(index); } }}
                    onDrop={(e) => { e.preventDefault(); moveProduct(dragIndex, index); setDragIndex(null); setOverIndex(null); }}
                    onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                    style={{
                      opacity: dragIndex === index ? 0.45 : 1,
                      boxShadow: overIndex === index && dragIndex !== null && dragIndex !== index ? 'inset 0 3px 0 #C68A3A' : 'none',
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span
                          title={canReorder ? 'Drag to reorder' : 'Clear the search to reorder'}
                          onTouchStart={canReorder ? () => onTouchStartHandle(index) : undefined}
                          onTouchMove={canReorder ? onTouchMoveHandle : undefined}
                          onTouchEnd={canReorder ? onTouchEndHandle : undefined}
                          style={{ cursor: canReorder ? 'grab' : 'not-allowed', color: canReorder ? '#8A6A50' : '#C9BCB0', display: 'flex', touchAction: 'none', padding: '0.2rem' }}
                        >
                          <GripVertical size={16} />
                        </span>
                        <span style={{ fontWeight: '800', color: '#4A3B2E', fontSize: '0.8rem', minWidth: '1.2rem' }}>{index + 1}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <button type="button" aria-label="Move up" disabled={!canReorder || savingOrder || index === 0} onClick={() => moveProduct(index, index - 1)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#8A6A50', opacity: (!canReorder || index === 0) ? 0.3 : 1, display: 'flex' }}>
                            <ChevronUp size={14} />
                          </button>
                          <button type="button" aria-label="Move down" disabled={!canReorder || savingOrder || index === products.length - 1} onClick={() => moveProduct(index, index + 1)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#8A6A50', opacity: (!canReorder || index === products.length - 1) ? 0.3 : 1, display: 'flex' }}>
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <img src={p.image} alt={p.title} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(231, 222, 213, 0.65)' }} />
                      <div>
                        <div style={{ fontWeight: '800', color: '#21150F', fontSize: '0.88rem' }}>{p.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#665A52', fontWeight: '600', marginTop: '0.15rem' }}>{p.subtitle || p.slug}</div>
                      </div>
                    </td>
                    <td style={{ textTransform: 'capitalize', fontWeight: '700', color: '#4A3B2E' }}>{p.category}</td>
                    <td style={{ fontFamily: 'monospace', color: '#665A52', fontSize: '0.78rem', fontWeight: '600' }}>{p.sku || 'MLS-PRD'}</td>
                    <td>
                      <PriceDisplay price={displayPrice} originalPrice={displayOrigPrice} size="small" />
                    </td>
                    <td>
                      {hasVariants ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontWeight: '800', color: '#21150F', fontSize: '0.82rem' }}>
                            {p.variants.length} {p.variants.length === 1 ? 'Variant' : 'Variants'}
                          </span>
                          {lowStockVariantCount > 0 && (
                            <span style={{ fontSize: '0.68rem', color: '#F59E0B', fontWeight: '700' }}>
                              {lowStockVariantCount} Low Stock
                            </span>
                          )}
                          {outOfStockVariantCount > 0 && (
                            <span style={{ fontSize: '0.68rem', color: '#C62828', fontWeight: '700' }}>
                              {outOfStockVariantCount} Out of Stock
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#665A52', fontSize: '0.8rem' }}>No Variants</span>
                      )}
                    </td>
                    <td>
                      {hasVariants ? (
                        <span className={`admin-badge ${outOfStockVariantCount > 0 || lowStockVariantCount > 0 ? (outOfStockVariantCount === p.variants.length ? 'admin-badge-danger' : 'admin-badge-warning') : 'admin-badge-success'}`}>
                          {totalVariantStock} total units
                        </span>
                      ) : (
                        <span className={`admin-badge ${productStock === 0 ? 'admin-badge-danger' : productStock <= LOW_STOCK_THRESHOLD ? 'admin-badge-warning' : 'admin-badge-success'}`}>
                          {productStock} units
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                        <span className="admin-badge admin-badge-success">
                          {p.status || 'active'}
                        </span>
                        {!p.hasVariants && (
                          <span className="admin-badge" style={{ backgroundColor: '#EBF3E8', color: '#2F6B3A' }} title="Showing in shop with base details entered by admin">
                            Base Pack
                          </span>
                        )}
                        {p.hiddenReason === 'upcoming' && (
                          <span className="admin-badge admin-badge-info" title="Shown in the shop from its launch date">
                            Pre-booking
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Link
                          to={`/admin/products/edit/${p._id || p.slug}`}
                          className="admin-icon-btn"
                          title="Edit product"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => setDeleteTargetId(p._id || p.slug)}
                          className="admin-icon-btn"
                          style={{ color: '#C62828' }}
                          title="Delete product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Search size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: '#21150F', margin: 0, fontWeight: '800' }}>No products found</h3>
            <p style={{ fontSize: '0.85rem', color: '#665A52', margin: 0 }}>Try adjusting your search criteria or add a new product.</p>
            <Link to="/admin/products/add" className="admin-btn-primary" style={{ marginTop: '0.5rem' }}>
              <Plus size={14} />
              <span>Add New Product</span>
            </Link>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!deleteTargetId}
        title="Delete Product?"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete Product"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}


