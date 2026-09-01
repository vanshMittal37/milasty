import { supabase } from '../config/supabase.js';
import { initialProducts } from '../data/seedData.js';

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort,
      featured,
      page = 1,
      limit = 12,
    } = req.query;

    // Try fetching from Supabase PostgreSQL first
    let query = supabase.from('products').select('*, product_variants(*)');

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: dbProducts, error } = await query;

    if (!error && dbProducts && dbProducts.length > 0) {
      // Map DB schema to frontend expected format
      const formatted = dbProducts.map((p) => {
        const variants = (p.product_variants || []).map((v) => ({
          id: v.id,
          name: v.name,
          weight: v.weight,
          price: Number(v.price),
          originalPrice: Number(v.original_price),
          stock: v.stock !== undefined && v.stock !== null ? Number(v.stock) : (v.in_stock ? 50 : 0),
          inStock: v.in_stock !== false,
        }));

        const calculatedStock = p.stock !== undefined && p.stock !== null
          ? Number(p.stock)
          : (variants.length > 0 ? variants.reduce((sum, v) => sum + (v.stock || 0), 0) : 100);

        return {
          _id: p.id,
          id: p.id,
          title: p.title,
          slug: p.slug,
          subtitle: p.subtitle,
          description: p.description,
          category: p.category,
          price: Number(p.price || variants[0]?.price || 139),
          originalPrice: Number(p.original_price || variants[0]?.originalPrice || 160),
          stock: calculatedStock,
          sku: p.sku || 'MLS-PRD',
          status: p.is_active !== false ? 'active' : 'inactive',
          image: p.image_url,
          secondaryImage: p.secondary_image_url || p.image_url,
          badges: p.badges || [],
          ingredients: p.ingredients || [],
          allergens: p.allergens || '',
          benefits: p.benefits || [],
          targetAudience: p.target_audience || '',
          nutritionFacts: p.nutrition_facts || {},
          labReportUrl: p.lab_report_url || '',
          isFeatured: p.is_featured !== false,
          rating: p.rating || 5.0,
          reviewCount: p.review_count || 0,
          variants,
        };
      });

      let filtered = [...formatted];
      if (minPrice || maxPrice) {
        filtered = filtered.filter((p) => {
          const price = p.variants[0]?.price || p.price || 0;
          if (minPrice && price < Number(minPrice)) return false;
          if (maxPrice && price > Number(maxPrice)) return false;
          return true;
        });
      }

      if (sort === 'price_low_high') filtered.sort((a, b) => (a.variants[0]?.price || a.price || 0) - (b.variants[0]?.price || b.price || 0));
      if (sort === 'price_high_low') filtered.sort((a, b) => (b.variants[0]?.price || b.price || 0) - (a.variants[0]?.price || a.price || 0));

      const skip = (Number(page) - 1) * Number(limit);
      const paginated = filtered.slice(skip, skip + Number(limit));

      return res.json({
        products: paginated,
        page: Number(page),
        pages: Math.ceil(filtered.length / Number(limit)) || 1,
        total: filtered.length,
      });
    }

    // Fallback to seed data if Supabase isn't seeded yet
    let fallback = [...initialProducts];
    if (category && category !== 'all') fallback = fallback.filter((p) => p.category === category);
    if (featured === 'true') fallback = fallback.filter((p) => p.isFeatured);
    if (search) {
      const s = search.toLowerCase();
      fallback = fallback.filter((p) => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    }

    return res.json({
      products: fallback,
      page: 1,
      pages: 1,
      total: fallback.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

export const getProductBySlugOrId = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Determine if identifier is a UUID or slug to avoid PostgreSQL syntax errors
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier);

    let query = supabase.from('products').select('*, product_variants(*)');
    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('slug', identifier);
    }

    const { data: p, error } = await query.maybeSingle();

    if (!error && p) {
      const variants = (p.product_variants || []).map((v) => ({
        id: v.id,
        name: v.name,
        weight: v.weight,
        price: Number(v.price),
        originalPrice: Number(v.original_price),
        stock: v.stock !== undefined && v.stock !== null ? Number(v.stock) : (v.in_stock ? 50 : 0),
        inStock: v.in_stock !== false,
      }));

      const calculatedStock = p.stock !== undefined && p.stock !== null
        ? Number(p.stock)
        : (variants.length > 0 ? variants.reduce((sum, v) => sum + (v.stock || 0), 0) : 100);

      const formatted = {
        _id: p.id,
        id: p.id,
        title: p.title,
        slug: p.slug,
        subtitle: p.subtitle,
        description: p.description,
        category: p.category,
        price: Number(p.price || variants[0]?.price || 139),
        originalPrice: Number(p.original_price || variants[0]?.originalPrice || 160),
        stock: calculatedStock,
        sku: p.sku || 'MLS-PRD',
        status: p.is_active !== false ? 'active' : 'inactive',
        image: p.image_url,
        secondaryImage: p.secondary_image_url || p.image_url,
        badges: p.badges || [],
        ingredients: p.ingredients || [],
        allergens: p.allergens || '',
        benefits: p.benefits || [],
        targetAudience: p.target_audience || '',
        nutritionFacts: p.nutrition_facts || {},
        labReportUrl: p.lab_report_url || '',
        isFeatured: p.is_featured !== false,
        rating: p.rating || 5.0,
        reviewCount: p.review_count || 0,
        variants,
      };
      return res.json(formatted);
    }

    const fallback = initialProducts.find((p) => p.slug === identifier || p._id === identifier);
    if (fallback) return res.json(fallback);

    return res.status(404).json({ message: 'Product not found' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      title,
      slug,
      subtitle,
      description,
      category,
      price,
      originalPrice,
      stock,
      sku,
      status,
      isFeatured,
      image,
      secondaryImage,
      badges,
      ingredients,
      allergens,
      benefits,
      targetAudience,
      nutritionFacts,
      variants,
    } = req.body;

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const insertPayload = {
      title,
      slug: finalSlug,
      subtitle: subtitle || '',
      description,
      category,
      image_url: image,
      secondary_image_url: secondaryImage || image,
      ingredients: ingredients || [],
      nutrition_facts: nutritionFacts || {},
      badges: badges || [],
      allergens: allergens || '',
      benefits: benefits || [],
      target_audience: targetAudience || '',
      is_featured: isFeatured !== false,
      is_active: status === 'active',
    };

    // Include stock & sku if supported by table columns
    if (stock !== undefined) insertPayload.stock = Number(stock);
    if (sku) insertPayload.sku = sku;

    const { data: product, error } = await supabase
      .from('products')
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw error;

    if (variants && variants.length > 0) {
      const variantRows = variants.map((v) => ({
        product_id: product.id,
        name: v.name,
        weight: v.weight,
        price: Number(v.price),
        original_price: Number(v.originalPrice || v.price),
        stock: Number(v.stock !== undefined ? v.stock : stock || 50),
        in_stock: v.inStock !== false && Number(v.stock !== undefined ? v.stock : stock || 50) > 0,
      }));
      await supabase.from('product_variants').insert(variantRows);
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatePayload = {
      title: updates.title,
      subtitle: updates.subtitle || '',
      description: updates.description,
      category: updates.category,
      image_url: updates.image,
      secondary_image_url: updates.secondaryImage || updates.image,
      ingredients: updates.ingredients || [],
      nutrition_facts: updates.nutritionFacts || {},
      badges: updates.badges || [],
      allergens: updates.allergens || '',
      benefits: updates.benefits || [],
      target_audience: updates.targetAudience || '',
      is_featured: updates.isFeatured !== false,
      is_active: updates.status === 'active',
      updated_at: new Date(),
    };

    if (updates.stock !== undefined) updatePayload.stock = Number(updates.stock);
    if (updates.sku) updatePayload.sku = updates.sku;

    const { data: product, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update variants if provided: delete existing and re-insert
    if (updates.variants && Array.isArray(updates.variants)) {
      await supabase.from('product_variants').delete().eq('product_id', id);

      if (updates.variants.length > 0) {
        const variantRows = updates.variants.map((v) => ({
          product_id: id,
          name: v.name,
          weight: v.weight,
          price: Number(v.price),
          original_price: Number(v.originalPrice || v.price),
          stock: Number(v.stock !== undefined ? v.stock : updates.stock || 50),
          in_stock: v.inStock !== false && Number(v.stock !== undefined ? v.stock : updates.stock || 50) > 0,
        }));
        await supabase.from('product_variants').insert(variantRows);
      }
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Delete product variants first for integrity
    await supabase.from('product_variants').delete().eq('product_id', id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

