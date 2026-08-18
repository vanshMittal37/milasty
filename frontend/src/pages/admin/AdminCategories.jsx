import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tags, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setFetching(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post('/categories', { name, description });
      setName('');
      setDescription('');
      fetchCategories();
    } catch (e) {
      alert('Error creating category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (e) {
        alert('Error deleting category');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
          Category Management
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, fontWeight: '500' }}>
          Organize store products into logical, navigable categories.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Create Category Form */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem', 
            backgroundColor: 'rgba(50, 26, 18, 0.60)', 
            borderRadius: '16px', 
            border: '1px solid rgba(245, 235, 221, 0.25)', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)' 
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1.5rem', marginTop: 0 }}>
            Add New Category
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Category Name *
              </label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Sugar-Free Bakes" 
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.95rem', 
                  borderRadius: '10px', 
                  border: '1px solid rgba(245, 235, 221, 0.25)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  fontFamily: 'inherit',
                  color: 'var(--text-light)'
                }} 
              />
            </div>
            
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Description
              </label>
              <textarea 
                rows={3} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Brief category summary for customer reference..." 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 0.95rem', 
                  borderRadius: '10px', 
                  border: '1px solid rgba(245, 235, 221, 0.25)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  fontFamily: 'inherit',
                  color: 'var(--text-light)',
                  resize: 'none'
                }} 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary" 
              style={{ 
                width: '100%', 
                height: '48px', 
                justifyContent: 'center', 
                backgroundColor: 'var(--accent-gold)', 
                border: 'none', 
                borderRadius: '10px', 
                color: '#24130D',
                fontWeight: '800',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              <Plus size={15} />
              <span>{loading ? 'Creating...' : 'Create Category'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Categories List */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem', 
            backgroundColor: 'rgba(50, 26, 18, 0.60)', 
            borderRadius: '16px', 
            border: '1px solid rgba(245, 235, 221, 0.25)', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)' 
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1.5rem', marginTop: 0 }}>
            Active Categories
          </h3>
          
          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 0', gap: '0.5rem' }}>
              <RefreshCw size={18} className="animate-spin" color="var(--accent-gold)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Fetching categories...</span>
            </div>
          ) : categories.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {categories.map((cat) => (
                <div 
                  key={cat._id || cat.slug} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.95rem 1.25rem', 
                    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(245, 235, 221, 0.15)',
                    transition: 'border-color 0.2s'
                  }}
                  className="admin-category-row"
                >
                  <div>
                    <div style={{ fontWeight: '800', color: 'var(--text-light)', fontSize: '0.9rem' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.15rem' }}>Slug: {cat.slug}</div>
                  </div>
                  <button 
                    onClick={() => handleDelete(cat._id)} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'rgba(217, 83, 79, 0.7)', 
                      cursor: 'pointer',
                      padding: '0.45rem',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--accent-terracotta)';
                      e.currentTarget.style.backgroundColor = 'rgba(217, 83, 79, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(217, 83, 79, 0.7)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
              No categories defined.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
