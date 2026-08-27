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
      const formatted = dbProducts.map((p) => ({
        _id: p.id,
        id: p.id,
        title: p.title,
        slug: p.slug,
        subtitle: p.subtitle,
        description: p.description,
        category: p.category,
        image: p.image_url,
        secondaryImage: p.secondary_image_url || p.image_url,
        badges: p.badges || [],
        ingredients: p.ingredients || [],
        allergens: p.allergens,
        benefits: p.benefits || [],
        targetAudience: p.target_audience,
        nutritionFacts: p.nutrition_facts || {},
        labReportUrl: p.lab_report_url,
        isFeatured: p.is_featured,
        rating: p.rating || 5.0,
        reviewCount: p.review_count || 0,
        variants: (p.product_variants || []).map((v) => ({
          id: v.id,
          name: v.name,
          weight: v.weight,
          price: Number(v.price),
          originalPrice: Number(v.original_price),
          inStock: v.in_stock,
        })),
      }));

      let filtered = [...formatted];
      if (minPrice || maxPrice) {
        filtered = filtered.filter((p) => {
          const price = p.variants[0]?.price || 0;
          if (minPrice && price < Number(minPrice)) return false;
          if (maxPrice && price > Number(maxPrice)) return false;
          return true;
        });
      }

      if (sort === 'price_low_high') filtered.sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0));
      if (sort === 'price_high_low') filtered.sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0));

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

    const { data: p, error } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .or(`slug.eq.${identifier},id.eq.${identifier}`)
      .single();

    if (!error && p) {
      const formatted = {
        _id: p.id,
        id: p.id,
        title: p.title,
        slug: p.slug,
        subtitle: p.subtitle,
        description: p.description,
        category: p.category,
        image: p.image_url,
        secondaryImage: p.secondary_image_url || p.image_url,
        badges: p.badges || [],
        ingredients: p.ingredients || [],
        allergens: p.allergens,
        benefits: p.benefits || [],
        targetAudience: p.target_audience,
        nutritionFacts: p.nutrition_facts || {},
        labReportUrl: p.lab_report_url,
        isFeatured: p.is_featured,
        rating: p.rating || 5.0,
        reviewCount: p.review_count || 0,
        variants: (p.product_variants || []).map((v) => ({
          id: v.id,
          name: v.name,
          weight: v.weight,
          price: Number(v.price),
          originalPrice: Number(v.original_price),
          inStock: v.in_stock,
        })),
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
    const { title, slug, subtitle, description, category, image, variants, ingredients, nutritionFacts } = req.body;
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          title,
          slug: finalSlug,
          subtitle,
          description,
          category,
          image_url: image,
          ingredients: ingredients || [],
          nutrition_facts: nutritionFacts || {},
        },
      ])
      .select()
      .single();

    if (error) throw error;

    if (variants && variants.length > 0) {
      const variantRows = variants.map((v) => ({
        product_id: product.id,
        name: v.name,
        weight: v.weight,
        price: v.price,
        original_price: v.originalPrice || v.price,
        in_stock: v.inStock !== false,
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

    const { data: product, error } = await supabase
      .from('products')
      .update({
        title: updates.title,
        subtitle: updates.subtitle,
        description: updates.description,
        category: updates.category,
        image_url: updates.image,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};
