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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
            Product Catalog
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, fontWeight: '500' }}>
            Manage catalog inventory, prices, discounts, variants, and stock status.
          </p>
        </div>

        <Link 
          to="/admin/products/add" 
          className="btn-primary"
          style={{ 
            padding: '0.65rem 1.25rem', 
            fontSize: '0.82rem', 
            fontWeight: '800', 
            borderRadius: '10px', 
            backgroundColor: 'var(--primary-dark)',
            border: 'none',
            color: '#FFFFFF',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Plus size={14} />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Search and Filters block */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '420px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, subtitle, or slug..." 
            style={{ 
              width: '100%', 
              height: '44px', 
              padding: '0 1rem 0 2.5rem', 
              borderRadius: '10px', 
              border: '1.5px solid var(--border-color)', 
              fontSize: '0.88rem',
              outline: 'none',
              backgroundColor: '#FFFFFF',
              color: 'var(--primary-dark)',
              fontFamily: 'inherit'
            }} 
          />
        </div>
      </div>

      {/* Main product management card table */}
      <div className="glass-card" style={{ padding: '2rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid var(--border-color)', boxShadow: '0 4px 20px rgba(56, 20, 35, 0.01)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
            <RefreshCw size={20} className="animate-spin" color="var(--primary-dark)" />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Fetching products listing...</span>
          </div>
        ) : products.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Product</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>SKU</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Base Price</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Stock Level</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '800' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const stockLevel = p.stock !== undefined ? p.stock : 50;
                  const isLowStock = stockLevel <= 5;
                  return (
                    <tr key={p._id || p.slug} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <img src={p.image} alt={p.title} style={{ width: '46px', height: '46px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                        <div>
                          <div style={{ fontWeight: '800', color: 'var(--primary-dark)', fontSize: '0.88rem' }}>{p.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.15rem' }}>{p.subtitle || p.slug}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textTransform: 'capitalize', fontWeight: '700', color: 'var(--primary-dark)' }}>{p.category}</td>
                      <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '600' }}>{p.sku || 'MLS-PRD'}</td>
                      <td style={{ padding: '1rem', fontWeight: '850', color: 'var(--primary-dark)' }}>₹{p.price || p.variants?.[0]?.price}</td>
                      <td style={{ padding: '1rem' }}>
                        <span 
                          style={{ 
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            backgroundColor: isLowStock ? 'rgba(217, 83, 79, 0.08)' : 'rgba(39, 76, 55, 0.08)', 
                            color: isLowStock ? 'var(--accent-terracotta)' : 'var(--accent-olive)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px'
                          }}
                        >
                          {stockLevel} units
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span 
                          style={{ 
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            backgroundColor: 'rgba(197, 160, 89, 0.08)',
                            color: 'var(--accent-gold)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px'
                          }}
                        >
                          {p.status || 'active'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <Link 
                            to={`/admin/products/edit/${p._id || p.slug}`} 
                            style={{ 
                              padding: '0.45rem', 
                              borderRadius: '8px', 
                              backgroundColor: 'rgba(56, 20, 35, 0.03)', 
                              color: 'var(--primary-dark)',
                              border: '1px solid var(--border-color)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }} 
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(p._id)} 
                            style={{ 
                              padding: '0.45rem', 
                              borderRadius: '8px', 
                              backgroundColor: 'rgba(217, 83, 79, 0.03)', 
                              color: 'var(--accent-terracotta)', 
                              border: '1px solid rgba(217, 83, 79, 0.1)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }} 
                            title="Delete Product"
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
          </div>
        ) : (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: '600' }}>
            No products found matching the criteria.
          </div>
        )}
      </div>
    </div>
  );
}
