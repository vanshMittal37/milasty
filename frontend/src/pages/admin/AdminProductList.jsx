import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

export default function AdminProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?search=${search}&limit=50`);
      setProducts(res.data.products || []);
    } catch (e) {
      console.error('Error fetching products', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (e) {
        alert('Error deleting product');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap', gap: '1.25rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.05em' }}>
            Products
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: '0.15rem 0 0.35rem 0', lineHeight: '1.2' }}>
            Product Catalog
          </h1>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.88rem', margin: 0, fontWeight: '500' }}>
            Manage catalog inventory, prices, discounts, variants, and stock status.
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
          <Search size={16} color="var(--admin-text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, subtitle, or slug..."
            className="admin-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Main product management card table */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
            <RefreshCw size={20} className="animate-spin" color="var(--admin-accent)" />
            <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Fetching products listing...</span>
          </div>
        ) : products.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Base Price</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stockLevel = p.stock !== undefined ? p.stock : 50;
                const isLowStock = stockLevel <= 5;
                return (
                  <tr key={p._id || p.slug}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <img src={p.image} alt={p.title} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--admin-border)' }} />
                      <div>
                        <div style={{ fontWeight: '800', color: 'var(--admin-text-primary)', fontSize: '0.88rem' }}>{p.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontWeight: '600', marginTop: '0.15rem' }}>{p.subtitle || p.slug}</div>
                      </div>
                    </td>
                    <td style={{ textTransform: 'capitalize', fontWeight: '700', color: 'var(--admin-text-secondary)' }}>{p.category}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--admin-text-muted)', fontSize: '0.78rem', fontWeight: '600' }}>{p.sku || 'MLS-PRD'}</td>
                    <td style={{ fontWeight: '800', color: 'var(--admin-text-primary)' }}>₹{p.price || p.variants?.[0]?.price}</td>
                    <td>
                      <span className={`admin-badge ${isLowStock ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                        {stockLevel} units
                      </span>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-success">
                        {p.status || 'active'}
                      </span>
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
                          onClick={() => handleDelete(p._id || p.slug)}
                          className="admin-icon-btn"
                          style={{ color: 'var(--admin-danger)' }}
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
            <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text-primary)', margin: 0, fontWeight: '800' }}>No products found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: 0 }}>Try adjusting your search criteria or add a new product.</p>
            <Link to="/admin/products/add" className="admin-btn-primary" style={{ marginTop: '0.5rem' }}>
              <Plus size={14} />
              <span>Add New Product</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
