import { supabase } from '../config/supabase.js';
import { initialProducts } from '../data/seedData.js';
import { LOW_STOCK_THRESHOLD } from '../config/constants.js';
import { getApprovedProductReviewStats } from './reviewController.js';

export const fetchProductImagesMap = async (productIds = []) => {
  const imagesMap = new Map();
  if (!productIds || productIds.length === 0) return imagesMap;
  try {
    const { data: imgRows } = await supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true });

    if (imgRows && imgRows.length > 0) {
      imgRows.forEach((img) => {
        const pid = String(img.product_id);
        if (!imagesMap.has(pid)) imagesMap.set(pid, []);
        imagesMap.get(pid).push({
          id: img.id,
          image_url: img.image_url,
          public_id: img.public_id || '',
          sort_order: img.sort_order || 0,
          is_primary: img.is_primary === true,
          alt_text: img.alt_text || '',
        });
      });
    }
  } catch (err) {
    console.warn('Error fetching product images:', err?.message);
  }
  return imagesMap;
};

export const saveProductImages = async (productId, imagesInput = [], defaultMainImg = '', defaultSecImg = '') => {
  if (!productId) return [];
  try {
    await supabase.from('product_images').delete().eq('product_id', productId);

    let imagesToInsert = [];
    if (Array.isArray(imagesInput) && imagesInput.length > 0) {
      imagesToInsert = imagesInput.map((img, idx) => {
        const isObj = typeof img === 'object' && img !== null;
        const imgUrl = isObj ? (img.image_url || img.url || img.image || '') : String(img);
        return {
          product_id: productId,
          image_url: imgUrl,
          public_id: isObj ? (img.public_id || '') : '',
          sort_order: isObj && typeof img.sort_order === 'number' ? img.sort_order : idx,
          is_primary: isObj ? (img.is_primary === true) : (idx === 0),
          alt_text: isObj ? (img.alt_text || '') : '',
        };
      }).filter(img => Boolean(img.image_url && img.image_url.trim()));
    }

    if (imagesToInsert.length === 0 && defaultMainImg) {
      imagesToInsert.push({
        product_id: productId,
        image_url: defaultMainImg,
        public_id: '',
        sort_order: 0,
        is_primary: true,
        alt_text: '',
      });
      if (defaultSecImg && defaultSecImg !== defaultMainImg) {
        imagesToInsert.push({
          product_id: productId,
          image_url: defaultSecImg,
          public_id: '',
          sort_order: 1,
          is_primary: false,
          alt_text: '',
        });
      }
    }

    if (imagesToInsert.length > 0) {
      const hasPrimary = imagesToInsert.some(i => i.is_primary);
      if (!hasPrimary) {
        imagesToInsert[0].is_primary = true;
      }
    }

    if (imagesToInsert.length > 0) {
      const { data: inserted, error } = await supabase.from('product_images').insert(imagesToInsert).select();
      if (error) {
        console.error('Error inserting product_images:', error);
      }
      return inserted || imagesToInsert;
    }
  } catch (err) {
    console.error('saveProductImages exception:', err);
  }
  return [];
};

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

    const statsMap = await getApprovedProductReviewStats();

    // Resolve category filter: support category ID, slug, or name
    let resolvedCatId = null;
    let resolvedCatSlug = null;
    let catFilterProductIds = null;
    if (category && category !== 'all') {
      try {
        const cleanCat = category.toString().toLowerCase().trim();
        const { data: catRows } = await supabase.from('categories').select('id, slug, name');
        const matchedCat = (catRows || []).find(c =>
          String(c.id).toLowerCase() === cleanCat ||
          String(c.slug).toLowerCase() === cleanCat ||
          String(c.name).toLowerCase() === cleanCat
        );
        if (matchedCat) {
          resolvedCatId = matchedCat.id;
          resolvedCatSlug = matchedCat.slug;
          // Collect product IDs from junction table
          try {
            const { data: rels } = await supabase.from('category_products').select('product_id').eq('category_id', matchedCat.id);
            if (rels && rels.length > 0) {
              catFilterProductIds = rels.map(r => r.product_id);
            }
          } catch (jErr) {
            console.warn('category_products query notice:', jErr?.message);
          }
        }
      } catch (err) {
        console.warn('Error resolving category filter:', err?.message);
      }
    }

    // Try fetching from Supabase PostgreSQL first
    let query = supabase.from('products').select('*, product_variants(*)');

    if (category && category !== 'all') {
      // Build filter: products matching by category_id OR by category slug text OR in junction table
      const orParts = [];
      if (resolvedCatSlug) orParts.push(`category.eq.${resolvedCatSlug}`);
      if (resolvedCatId) orParts.push(`category_id.eq.${resolvedCatId}`);
      if (catFilterProductIds && catFilterProductIds.length > 0) {
        orParts.push(`id.in.(${catFilterProductIds.join(',')})`);
      }
      // Fallback: match raw category param as text
      if (!resolvedCatSlug && !resolvedCatId) orParts.push(`category.eq.${category}`);
      
      if (orParts.length > 0) {
        query = query.or(orParts.join(','));
      } else {
        query = query.eq('category', category);
      }
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: dbProducts, error } = await query;

    if (!error && dbProducts && dbProducts.length > 0) {
      const dbProductIds = dbProducts.map(p => p.id);
      const imagesMap = await fetchProductImagesMap(dbProductIds);

      // Map DB schema to frontend expected format
      const formatted = dbProducts.map((p) => {
        const variantStocksMap = p.nutrition_facts?.variant_stocks || {};
        const variants = (p.product_variants || []).map((v) => {
          const stockFromMap = variantStocksMap[v.id] !== undefined
            ? Number(variantStocksMap[v.id])
            : (variantStocksMap[v.weight] !== undefined
              ? Number(variantStocksMap[v.weight])
              : (variantStocksMap[v.name] !== undefined
                ? Number(variantStocksMap[v.name])
                : undefined));

          const varStock = (v.stock !== undefined && v.stock !== null)
            ? Number(v.stock)
            : (stockFromMap !== undefined ? stockFromMap : (v.in_stock !== false ? 50 : 0));

          return {
            id: v.id,
            name: v.name,
            weight: v.weight,
            price: Number(v.price),
            originalPrice: Number(v.original_price || v.price),
            stock: varStock,
            inStock: varStock > 0,
          };
        });

        const calculatedStock = variants.length > 0
          ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
          : (p.stock !== undefined && p.stock !== null ? Number(p.stock) : 100);

        const pKey = String(p.id || p._id || p.slug || '').toLowerCase();
        const pTitleKey = String(p.title || '').toLowerCase();
        const stats = statsMap.get(pKey) || statsMap.get(pTitleKey) || { count: 0, sum: 0 };

        const realReviewCount = stats.count;
        const realRating = realReviewCount > 0 ? Number((stats.sum / stats.count).toFixed(1)) : 0;

        // Image gallery resolution
        const rawImgs = imagesMap.get(String(p.id)) || [];
        let images = [];
        if (rawImgs.length > 0) {
          images = rawImgs.map((img, idx) => ({
            id: img.id || `img-${idx}`,
            image_url: img.image_url,
            public_id: img.public_id || '',
            sort_order: img.sort_order !== undefined ? img.sort_order : idx,
            is_primary: img.is_primary === true,
            alt_text: img.alt_text || '',
          }));
        } else {
          if (p.image_url) images.push({ id: 'legacy-1', image_url: p.image_url, public_id: '', sort_order: 0, is_primary: true });
          if (p.secondary_image_url && p.secondary_image_url !== p.image_url) {
            images.push({ id: 'legacy-2', image_url: p.secondary_image_url, public_id: '', sort_order: 1, is_primary: false });
          }
        }
        const primaryObj = images.find(img => img.is_primary) || images[0];
        const primaryUrl = primaryObj ? primaryObj.image_url : (p.image_url || '');
        const secondaryUrl = (images.length > 1 ? images[1].image_url : primaryUrl) || p.secondary_image_url || '';

        // Normalize nutrition_facts object
        const rawFacts = p.nutrition_facts || {};
        const normalizedNutrition = { ...rawFacts };

        if (rawFacts.energyKcal && !normalizedNutrition.energy) {
          normalizedNutrition.energy = { label: 'Calories / Energy', value: Number(rawFacts.energyKcal), unit: 'kcal/100g' };
        }
        if (rawFacts.proteinG && !normalizedNutrition.protein) {
          normalizedNutrition.protein = { label: 'Protein', value: Number(rawFacts.proteinG), unit: 'g' };
        }
        if (rawFacts.totalFatG && !normalizedNutrition.total_fat) {
          normalizedNutrition.total_fat = { label: 'Total Fat', value: Number(rawFacts.totalFatG), unit: 'g' };
        }
        if (rawFacts.carbohydrateG && !normalizedNutrition.carbohydrates) {
          normalizedNutrition.carbohydrates = { label: 'Carbohydrates', value: Number(rawFacts.carbohydrateG), unit: 'g' };
        }
        if (rawFacts.dietaryFiberG && !normalizedNutrition.dietary_fiber) {
          normalizedNutrition.dietary_fiber = { label: 'Dietary Fiber', value: Number(rawFacts.dietaryFiberG), unit: 'g' };
        }
        if (rawFacts.totalSugarsG && !normalizedNutrition.total_sugars) {
          normalizedNutrition.total_sugars = { label: 'Total Sugars', value: Number(rawFacts.totalSugarsG), unit: 'g' };
        }
        if (rawFacts.addedSugarsG && !normalizedNutrition.added_sugars) {
          normalizedNutrition.added_sugars = { label: 'Added Sugars', value: Number(rawFacts.addedSugarsG), unit: 'g' };
        }
        if (rawFacts.sodiumMg && !normalizedNutrition.sodium) {
          normalizedNutrition.sodium = { label: 'Sodium', value: Number(rawFacts.sodiumMg), unit: 'mg' };
        }

        const parsedIngredients = Array.isArray(p.ingredients) 
          ? p.ingredients 
          : (typeof p.ingredients === 'string' ? p.ingredients.split(',').map((s) => s.trim()).filter(Boolean) : []);

        const parsedBadges = Array.isArray(p.badges) 
          ? p.badges 
          : (typeof p.badges === 'string' ? p.badges.split(',').map((s) => s.trim()).filter(Boolean) : []);

        return {
          _id: p.id,
          id: p.id,
          title: p.title,
          slug: p.slug,
          subtitle: p.subtitle,
          description: p.description,
          category: p.category,
          category_id: p.category_id || '',
          price: Number(variants[0]?.price || 0),
          originalPrice: Number(variants[0]?.originalPrice || variants[0]?.price || 0),
          stock: calculatedStock,
          sku: p.sku || 'MLS-PRD',
          status: p.is_active !== false ? 'active' : 'inactive',
          image: primaryUrl,
          image_url: primaryUrl,
          secondaryImage: secondaryUrl,
          secondary_image_url: secondaryUrl,
          images: images,
          badges: parsedBadges,
          ingredients: parsedIngredients,
          allergens: p.allergens || '',
          benefits: p.benefits || [],
          targetAudience: p.target_audience || '',
          nutritionFacts: normalizedNutrition,
          pieces: p.nutrition_facts?.pieces || p.pieces || '',
          labReportUrl: p.lab_report_url || '',
          isFeatured: p.is_featured !== false,
          isBestseller: p.is_bestseller === true || (Array.isArray(parsedBadges) && parsedBadges.some((b) => b.toLowerCase().includes('bestseller'))),
          rating: realRating,
          reviewCount: realReviewCount,
          variants,
        };
      });

      let filtered = formatted.filter((p) => {
        if (!p.launch_date && !p.launchDate) return true;
        const d = new Date(p.launch_date || p.launchDate);
        return d <= new Date(); // Only include launched products in main catalog
      });

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
    let fallback = initialProducts.map((p) => {
      const pKey = String(p.id || p._id || p.slug || '').toLowerCase();
      const pTitleKey = String(p.title || '').toLowerCase();
      const stats = statsMap.get(pKey) || statsMap.get(pTitleKey) || { count: 0, sum: 0 };

      const realReviewCount = stats.count;
      const realRating = realReviewCount > 0 ? Number((stats.sum / stats.count).toFixed(1)) : 0;

      return {
        ...p,
        rating: realRating,
        reviewCount: realReviewCount,
      };
    });

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
    const identifier = req.params.identifier || req.params.id;

    // Determine if identifier is a UUID or slug to avoid PostgreSQL syntax errors
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier);
    const statsMap = await getApprovedProductReviewStats();

    let query = supabase.from('products').select('*, product_variants(*)');
    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('slug', identifier);
    }

    const { data: p, error } = await query.maybeSingle();

    if (!error && p) {
      const variantStocksMap = p.nutrition_facts?.variant_stocks || {};
      const variants = (p.product_variants || []).map((v) => {
        const stockFromMap = variantStocksMap[v.id] !== undefined
          ? Number(variantStocksMap[v.id])
          : (variantStocksMap[v.weight] !== undefined
            ? Number(variantStocksMap[v.weight])
            : (variantStocksMap[v.name] !== undefined
              ? Number(variantStocksMap[v.name])
              : undefined));

        const varStock = (v.stock !== undefined && v.stock !== null)
          ? Number(v.stock)
          : (stockFromMap !== undefined ? stockFromMap : (v.in_stock !== false ? 50 : 0));

        return {
          id: v.id,
          name: v.name,
          weight: v.weight,
          price: Number(v.price),
          originalPrice: Number(v.original_price || v.price),
          stock: varStock,
          inStock: varStock > 0,
        };
      });

      const calculatedStock = variants.length > 0
        ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : (p.stock !== undefined && p.stock !== null ? Number(p.stock) : 100);

      const pKey = String(p.id || p._id || p.slug || '').toLowerCase();
      const pTitleKey = String(p.title || '').toLowerCase();
      const stats = statsMap.get(pKey) || statsMap.get(pTitleKey) || { count: 0, sum: 0 };

      const realReviewCount = stats.count;
      const realRating = realReviewCount > 0 ? Number((stats.sum / stats.count).toFixed(1)) : 0;

      // Normalize nutrition_facts object to handle both new structured format { key: { label, value, unit } } and legacy keys
      const rawFacts = p.nutrition_facts || {};
      const normalizedNutrition = { ...rawFacts };

      if (rawFacts.energyKcal && !normalizedNutrition.energy) {
        normalizedNutrition.energy = { label: 'Calories / Energy', value: Number(rawFacts.energyKcal), unit: 'kcal/100g' };
      }
      if (rawFacts.proteinG && !normalizedNutrition.protein) {
        normalizedNutrition.protein = { label: 'Protein', value: Number(rawFacts.proteinG), unit: 'g' };
      }
      if (rawFacts.totalFatG && !normalizedNutrition.total_fat) {
        normalizedNutrition.total_fat = { label: 'Total Fat', value: Number(rawFacts.totalFatG), unit: 'g' };
      }
      if (rawFacts.carbohydrateG && !normalizedNutrition.carbohydrates) {
        normalizedNutrition.carbohydrates = { label: 'Carbohydrates', value: Number(rawFacts.carbohydrateG), unit: 'g' };
      }
      if (rawFacts.dietaryFiberG && !normalizedNutrition.dietary_fiber) {
        normalizedNutrition.dietary_fiber = { label: 'Dietary Fiber', value: Number(rawFacts.dietaryFiberG), unit: 'g' };
      }
      if (rawFacts.totalSugarsG && !normalizedNutrition.total_sugars) {
        normalizedNutrition.total_sugars = { label: 'Total Sugars', value: Number(rawFacts.totalSugarsG), unit: 'g' };
      }
      if (rawFacts.addedSugarsG && !normalizedNutrition.added_sugars) {
        normalizedNutrition.added_sugars = { label: 'Added Sugars', value: Number(rawFacts.addedSugarsG), unit: 'g' };
      }
      if (rawFacts.sodiumMg && !normalizedNutrition.sodium) {
        normalizedNutrition.sodium = { label: 'Sodium', value: Number(rawFacts.sodiumMg), unit: 'mg' };
      }

      const parsedIngredients = Array.isArray(p.ingredients) 
        ? p.ingredients 
        : (typeof p.ingredients === 'string' ? p.ingredients.split(',').map((s) => s.trim()).filter(Boolean) : []);

      const parsedBadges = Array.isArray(p.badges) 
        ? p.badges 
        : (typeof p.badges === 'string' ? p.badges.split(',').map((s) => s.trim()).filter(Boolean) : []);

      const imagesMap = await fetchProductImagesMap([p.id]);
      const rawImgs = imagesMap.get(String(p.id)) || [];
      let images = [];
      if (rawImgs.length > 0) {
        images = rawImgs.map((img, idx) => ({
          id: img.id || `img-${idx}`,
          image_url: img.image_url,
          public_id: img.public_id || '',
          sort_order: img.sort_order !== undefined ? img.sort_order : idx,
          is_primary: img.is_primary === true,
          alt_text: img.alt_text || '',
        }));
      } else {
        if (p.image_url) images.push({ id: 'legacy-1', image_url: p.image_url, public_id: '', sort_order: 0, is_primary: true });
        if (p.secondary_image_url && p.secondary_image_url !== p.image_url) {
          images.push({ id: 'legacy-2', image_url: p.secondary_image_url, public_id: '', sort_order: 1, is_primary: false });
        }
      }
      const primaryObj = images.find(img => img.is_primary) || images[0];
      const primaryUrl = primaryObj ? primaryObj.image_url : (p.image_url || '');
      const secondaryUrl = (images.length > 1 ? images[1].image_url : primaryUrl) || p.secondary_image_url || '';

      const formatted = {
        _id: p.id,
        id: p.id,
        title: p.title,
        slug: p.slug,
        subtitle: p.subtitle,
        description: p.description,
        category: p.category,
        category_id: p.category_id || '',
        price: Number(variants[0]?.price || 0),
        originalPrice: Number(variants[0]?.originalPrice || variants[0]?.price || 0),
        stock: calculatedStock,
        sku: p.sku || 'MLS-PRD',
        status: p.is_active !== false ? 'active' : 'inactive',
        image: primaryUrl,
        image_url: primaryUrl,
        secondaryImage: secondaryUrl,
        secondary_image_url: secondaryUrl,
        images: images,
        badges: parsedBadges,
        ingredients: parsedIngredients,
        allergens: p.allergens || '',
        benefits: p.benefits || [],
        targetAudience: p.target_audience || '',
        nutritionFacts: normalizedNutrition,
        pieces: p.nutrition_facts?.pieces || p.pieces || '',
        labReportUrl: p.lab_report_url || '',
        isFeatured: p.is_featured !== false,
        rating: realRating,
        reviewCount: realReviewCount,
        variants,
      };
      return res.json(formatted);
    }

    const fallback = initialProducts.find((p) => p.slug === identifier || p._id === identifier);
    if (fallback) {
      const pKey = String(fallback.id || fallback._id || fallback.slug || '').toLowerCase();
      const pTitleKey = String(fallback.title || '').toLowerCase();
      const stats = statsMap.get(pKey) || statsMap.get(pTitleKey) || { count: 0, sum: 0 };

      const realReviewCount = stats.count;
      const realRating = realReviewCount > 0 ? Number((stats.sum / stats.count).toFixed(1)) : 0;

      return res.json({
        ...fallback,
        rating: realRating,
        reviewCount: realReviewCount,
      });
    }

    return res.status(404).json({ message: 'Product not found' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// Helper for safe variant insertion supporting schema with/without stock column
const safeInsertVariants = async (variantRows) => {
  let { data, error } = await supabase.from('product_variants').insert(variantRows).select();
  if (error && error.message && error.message.toLowerCase().includes('stock')) {
    const fallbackRows = variantRows.map(({ stock, ...rest }) => rest);
    const { data: fData, error: fErr } = await supabase.from('product_variants').insert(fallbackRows).select();
    if (fErr) console.error('Supabase Variant Insert Fallback Error:', fErr);
    if (fData) {
      data = fData.map((v, i) => ({ ...v, stock: variantRows[i]?.stock }));
    }
  }
  return data || [];
};

// Helper for resolving category info by ID or slug
export const resolveCategoryInfo = async (catIdOrSlug) => {
  if (!catIdOrSlug) return null;
  try {
    const clean = String(catIdOrSlug).trim().toLowerCase();
    const { data: catRows } = await supabase.from('categories').select('id, slug, name');
    if (catRows && catRows.length > 0) {
      return catRows.find(c => 
        String(c.id).toLowerCase() === clean ||
        String(c.slug).toLowerCase() === clean ||
        String(c.name).toLowerCase() === clean
      ) || null;
    }
  } catch (err) {
    console.warn('Error resolving category info:', err?.message);
  }
  return null;
};

// Helper for safe product insertion handling missing columns in PostgREST schema cache
const safeInsertProduct = async (payload) => {
  let { data, error } = await supabase
    .from('products')
    .insert([payload])
    .select()
    .single();

  if (error && error.message && (
    error.message.toLowerCase().includes('is_bestseller') || 
    error.message.toLowerCase().includes('category_id') || 
    error.message.toLowerCase().includes('schema cache')
  )) {
    console.warn('Supabase product insert schema fallback triggered:', error.message);
    const fallbackPayload = { ...payload };
    if (error.message.toLowerCase().includes('is_bestseller')) delete fallbackPayload.is_bestseller;
    if (error.message.toLowerCase().includes('category_id')) delete fallbackPayload.category_id;

    const res = await supabase
      .from('products')
      .insert([fallbackPayload])
      .select()
      .single();
    data = res.data;
    error = res.error;
  }
  return { data, error };
};

// Helper for safe product update handling missing columns in PostgREST schema cache
const safeUpdateProduct = async (id, payload) => {
  let { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error && error.message && (
    error.message.toLowerCase().includes('is_bestseller') || 
    error.message.toLowerCase().includes('category_id') || 
    error.message.toLowerCase().includes('schema cache')
  )) {
    console.warn('Supabase product update schema fallback triggered:', error.message);
    const fallbackPayload = { ...payload };
    if (error.message.toLowerCase().includes('is_bestseller')) delete fallbackPayload.is_bestseller;
    if (error.message.toLowerCase().includes('category_id')) delete fallbackPayload.category_id;

    const res = await supabase
      .from('products')
      .update(fallbackPayload)
      .eq('id', id)
      .select()
      .single();
    data = res.data;
    error = res.error;
  }
  return { data, error };
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
      pieces,
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

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Product title is required' });
    }

    let baseSlug = (slug && slug.trim())
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (!baseSlug) baseSlug = `product-${Date.now()}`;

    // Check if slug already exists in Supabase
    let finalSlug = baseSlug;
    const { data: existing } = await supabase.from('products').select('id').eq('slug', finalSlug).maybeSingle();
    if (existing) {
      finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const parsedBadges = Array.isArray(badges) 
      ? badges 
      : (typeof badges === 'string' ? badges.split(',').map((s) => s.trim()).filter(Boolean) : []);

    const isBestsellerRequested = req.body.isBestseller === true || 
                                  req.body.is_bestseller === true || 
                                  parsedBadges.some(b => String(b).toLowerCase().replace(/\s+/g, '').includes('bestseller'));

    let finalBadges = [...parsedBadges];
    if (isBestsellerRequested) {
      if (!finalBadges.some(b => String(b).toLowerCase().replace(/\s+/g, '').includes('bestseller'))) {
        finalBadges.push('Best Seller');
      }
    } else {
      finalBadges = finalBadges.filter(b => !String(b).toLowerCase().replace(/\s+/g, '').includes('bestseller'));
    }
    
    const parsedIngredients = Array.isArray(ingredients) 
      ? ingredients 
      : (typeof ingredients === 'string' ? ingredients.split(',').map((s) => s.trim()).filter(Boolean) : []);

    const parsedBenefits = Array.isArray(benefits) 
      ? benefits 
      : (typeof benefits === 'string' ? benefits.split(',').map((s) => s.trim()).filter(Boolean) : []);

    const variantStocksMap = {};
    if (variants && Array.isArray(variants)) {
      variants.forEach((v) => {
        const vStock = Number(v.stock !== undefined && v.stock !== null && v.stock !== '' ? v.stock : 50);
        if (v.weight) variantStocksMap[v.weight] = vStock;
        if (v.name) variantStocksMap[v.name] = vStock;
        if (v.id) variantStocksMap[v.id] = vStock;
      });
    }

    const mergedNutritionFacts = {
      ...(typeof nutritionFacts === 'object' && nutritionFacts !== null ? nutritionFacts : {}),
      pieces: pieces || (typeof nutritionFacts === 'object' ? nutritionFacts?.pieces : '') || '',
      variant_stocks: variantStocksMap,
    };

    // Resolve category_id and category slug from categories table
    const categoryInput = req.body.category_id || category || 'daily';
    let resolvedCatId = null;
    let resolvedCatSlug = category || 'daily';
    try {
      const catInfo = await resolveCategoryInfo(categoryInput);
      if (catInfo) {
        resolvedCatId = catInfo.id;
        resolvedCatSlug = catInfo.slug || resolvedCatSlug;
      }
    } catch (err) {
      console.warn('Category resolution warning:', err?.message);
    }

    const insertPayload = {
      title: title.trim(),
      slug: finalSlug,
      subtitle: subtitle || '',
      description: description || '',
      category: resolvedCatSlug,
      category_id: resolvedCatId,
      image_url: image || '',
      secondary_image_url: secondaryImage || '',
      lab_report_url: req.body.labReportUrl || req.body.lab_report_url || '',
      ingredients: parsedIngredients,
      nutrition_facts: mergedNutritionFacts,
      badges: finalBadges,
      allergens: allergens || '',
      benefits: parsedBenefits,
      target_audience: targetAudience || '',
      is_featured: isFeatured !== false,
      is_bestseller: isBestsellerRequested,
      is_active: status === 'active',
    };

    const { data: product, error } = await safeInsertProduct(insertPayload);

    if (error) {
      console.error('Supabase Product Insert Error:', error);
      return res.status(400).json({ message: error.message || 'Database error creating product', details: error });
    }

    let insertedVariants = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantRows = variants.map((v) => {
        const vStock = Number(v.stock !== undefined && v.stock !== null && v.stock !== '' ? v.stock : 50);
        return {
          product_id: product.id,
          name: v.name || 'Standard Pack',
          weight: v.weight || 'Standard',
          price: Number(v.price !== undefined && v.price !== '' ? v.price : price || 0),
          original_price: Number(v.originalPrice !== undefined && v.originalPrice !== '' ? v.originalPrice : v.price || price || 0),
          stock: vStock,
          in_stock: v.inStock !== false && vStock > 0,
        };
      });
      insertedVariants = await safeInsertVariants(variantRows);
    } else {
      // Auto-create a default variant if no variants array was supplied
      const defaultStock = Number(stock !== undefined && stock !== null && stock !== '' ? stock : 100);
      const defaultVariantRow = {
        product_id: product.id,
        name: 'Standard Pack',
        weight: 'Standard',
        price: Number(price || 0),
        original_price: Number(originalPrice || price || 0),
        stock: defaultStock,
        in_stock: defaultStock > 0,
      };
      insertedVariants = await safeInsertVariants([defaultVariantRow]);
    }

    const finalVariantStocksMap = {};
    insertedVariants.forEach((v, idx) => {
      const origV = variants && variants[idx];
      const stk = Number(origV && origV.stock !== undefined && origV.stock !== null && origV.stock !== '' ? origV.stock : (v.stock !== undefined ? v.stock : 50));
      if (v.id) finalVariantStocksMap[v.id] = stk;
      if (v.weight) finalVariantStocksMap[v.weight] = stk;
      if (v.name) finalVariantStocksMap[v.name] = stk;
    });

    await supabase
      .from('products')
      .update({
        nutrition_facts: {
          ...mergedNutritionFacts,
          variant_stocks: finalVariantStocksMap,
        },
      })
      .eq('id', product.id);

    const formattedVariants = insertedVariants.map((v, idx) => {
      const origV = variants && variants[idx];
      const vStock = finalVariantStocksMap[v.id] !== undefined
        ? finalVariantStocksMap[v.id]
        : (finalVariantStocksMap[v.weight] !== undefined ? finalVariantStocksMap[v.weight] : (v.in_stock ? 50 : 0));
      return {
        id: v.id,
        name: v.name,
        weight: v.weight,
        price: Number(v.price),
        originalPrice: Number(v.original_price || v.price),
        stock: vStock,
        inStock: vStock > 0,
      };
    });

    const totalStock = formattedVariants.length > 0 
      ? formattedVariants.reduce((acc, v) => acc + (v.stock || 0), 0)
      : (stock !== undefined && stock !== null && stock !== '' ? Number(stock) : 100);

    const basePrice = formattedVariants.length > 0
      ? Number(formattedVariants[0].price)
      : Number(price || 0);

    const baseOriginalPrice = formattedVariants.length > 0
      ? Number(formattedVariants[0].originalPrice)
      : Number(originalPrice || basePrice);

    const savedImgs = await saveProductImages(product.id, req.body.images || req.body.image_gallery, image, secondaryImage);
    const primaryImg = savedImgs.find(i => i.is_primary) || savedImgs[0];
    const primaryUrl = primaryImg ? primaryImg.image_url : (image || '');
    const secondaryUrl = (savedImgs.length > 1 ? savedImgs[1].image_url : primaryUrl) || secondaryImage || '';

    await supabase.from('products').update({ image_url: primaryUrl, secondary_image_url: secondaryUrl }).eq('id', product.id);

    // Sync category_products junction table
    if (resolvedCatId && product.id) {
      try {
        await supabase.from('category_products').upsert(
          [{ category_id: resolvedCatId, product_id: product.id }],
          { onConflict: 'category_id,product_id' }
        );
      } catch (err) {
        console.warn('category_products sync warning on create:', err?.message);
      }
    }

    const formattedProduct = {
      _id: product.id,
      id: product.id,
      title: product.title,
      slug: product.slug,
      subtitle: product.subtitle,
      description: product.description,
      category: product.category,
      price: basePrice,
      originalPrice: baseOriginalPrice,
      stock: totalStock,
      sku: sku || 'MLS-PRD',
      status: product.is_active !== false ? 'active' : 'inactive',
      image: primaryUrl,
      image_url: primaryUrl,
      secondaryImage: secondaryUrl,
      secondary_image_url: secondaryUrl,
      images: savedImgs,
      badges: product.badges || [],
      ingredients: product.ingredients || [],
      allergens: product.allergens || '',
      benefits: product.benefits || [],
      targetAudience: product.target_audience || '',
      nutritionFacts: product.nutrition_facts || {},
      pieces: product.nutrition_facts?.pieces || pieces || '',
      isFeatured: product.is_featured !== false,
      variants: formattedVariants,
    };

    return res.status(201).json(formattedProduct);
  } catch (error) {
    console.error('createProduct Catch Error:', error);
    return res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const parsedBadges = Array.isArray(updates.badges) 
      ? updates.badges 
      : (typeof updates.badges === 'string' ? updates.badges.split(',').map((s) => s.trim()).filter(Boolean) : []);

    const isBestsellerRequested = updates.isBestseller === true || 
                                  updates.is_bestseller === true || 
                                  parsedBadges.some(b => String(b).toLowerCase().replace(/\s+/g, '').includes('bestseller'));

    let finalBadges = [...parsedBadges];
    if (isBestsellerRequested) {
      if (!finalBadges.some(b => String(b).toLowerCase().replace(/\s+/g, '').includes('bestseller'))) {
        finalBadges.push('Best Seller');
      }
    } else {
      finalBadges = finalBadges.filter(b => !String(b).toLowerCase().replace(/\s+/g, '').includes('bestseller'));
    }

    const parsedIngredients = Array.isArray(updates.ingredients) 
      ? updates.ingredients 
      : (typeof updates.ingredients === 'string' ? updates.ingredients.split(',').map((s) => s.trim()).filter(Boolean) : []);

    const parsedBenefits = Array.isArray(updates.benefits) 
      ? updates.benefits 
      : (typeof updates.benefits === 'string' ? updates.benefits.split(',').map((s) => s.trim()).filter(Boolean) : []);

    const variantStocksMap = {};
    if (updates.variants && Array.isArray(updates.variants)) {
      updates.variants.forEach((v) => {
        const vStock = Number(v.stock !== undefined && v.stock !== null && v.stock !== '' ? v.stock : 50);
        if (v.weight) variantStocksMap[v.weight] = vStock;
        if (v.name) variantStocksMap[v.name] = vStock;
        if (v.id) variantStocksMap[v.id] = vStock;
      });
    }

    // Resolve category_id and slug for the update
    const categoryInput = updates.category_id || updates.category;
    let resolvedCatId = null;
    let resolvedCatSlug = updates.category || null;
    try {
      if (categoryInput) {
        const catInfo = await resolveCategoryInfo(categoryInput);
        if (catInfo) {
          resolvedCatId = catInfo.id;
          resolvedCatSlug = catInfo.slug;
        }
      }
    } catch (err) {
      console.warn('Category resolution warning on update:', err?.message);
    }

    const updatePayload = {
      title: updates.title,
      subtitle: updates.subtitle || '',
      description: updates.description,
      category: resolvedCatSlug || updates.category,
      category_id: resolvedCatId,
      image_url: updates.image !== undefined ? updates.image : undefined,
      secondary_image_url: updates.secondaryImage !== undefined ? updates.secondaryImage : undefined,
      lab_report_url: updates.labReportUrl !== undefined ? updates.labReportUrl : (updates.lab_report_url !== undefined ? updates.lab_report_url : undefined),
      ingredients: parsedIngredients,
      nutrition_facts: {
        ...(typeof updates.nutritionFacts === 'object' && updates.nutritionFacts !== null ? updates.nutritionFacts : {}),
        pieces: updates.pieces || (typeof updates.nutritionFacts === 'object' ? updates.nutritionFacts?.pieces : '') || '',
        variant_stocks: Object.keys(variantStocksMap).length > 0 ? variantStocksMap : updates.nutritionFacts?.variant_stocks,
      },
      badges: finalBadges,
      allergens: updates.allergens || '',
      benefits: parsedBenefits,
      target_audience: updates.targetAudience || '',
      is_featured: updates.isFeatured !== false,
      is_bestseller: isBestsellerRequested,
      is_active: updates.status === 'active',
      updated_at: new Date(),
    };

    if (updates.pieces) {
      updatePayload.nutrition_facts = {
        ...(typeof updatePayload.nutrition_facts === 'object' ? updatePayload.nutrition_facts : {}),
        pieces: updates.pieces,
      };
    }

    // Remove undefined keys
    Object.keys(updatePayload).forEach((key) => updatePayload[key] === undefined && delete updatePayload[key]);

    const { data: product, error } = await safeUpdateProduct(id, updatePayload);

    if (error) {
      console.error('Supabase Product Update Error:', error);
      return res.status(400).json({ message: error.message || 'Database error updating product' });
    }

    let updatedVariants = [];
    if (updates.variants && Array.isArray(updates.variants)) {
      await supabase.from('product_variants').delete().eq('product_id', id);

      if (updates.variants.length > 0) {
        const variantRows = updates.variants.map((v) => {
          const vStock = Number(v.stock !== undefined && v.stock !== null && v.stock !== '' ? v.stock : 50);
          return {
            product_id: id,
            name: v.name || 'Standard Pack',
            weight: v.weight || 'Standard',
            price: Number(v.price !== undefined && v.price !== '' ? v.price : updates.price || 0),
            original_price: Number(v.originalPrice !== undefined && v.originalPrice !== '' ? v.originalPrice : v.price || updates.price || 0),
            stock: vStock,
            in_stock: v.inStock !== false && vStock > 0,
          };
        });
        updatedVariants = await safeInsertVariants(variantRows);
      } else {
        const defaultStock = Number(updates.stock !== undefined && updates.stock !== null && updates.stock !== '' ? updates.stock : 100);
        const defaultVariantRow = {
          product_id: id,
          name: 'Standard Pack',
          weight: 'Standard',
          price: Number(updates.price || 0),
          original_price: Number(updates.originalPrice || updates.price || 0),
          stock: defaultStock,
          in_stock: defaultStock > 0,
        };
        updatedVariants = await safeInsertVariants([defaultVariantRow]);
      }
    } else {
      const { data: existingV } = await supabase.from('product_variants').select('*').eq('product_id', id);
      if (existingV && existingV.length > 0) {
        updatedVariants = existingV;
      } else {
        const defaultStock = Number(updates.stock !== undefined && updates.stock !== null && updates.stock !== '' ? updates.stock : 100);
        const defaultVariantRow = {
          product_id: id,
          name: 'Standard Pack',
          weight: 'Standard',
          price: Number(updates.price || 0),
          original_price: Number(updates.originalPrice || updates.price || 0),
          stock: defaultStock,
          in_stock: defaultStock > 0,
        };
        updatedVariants = await safeInsertVariants([defaultVariantRow]);
      }
    }

    const finalVariantStocksMap = {};
    updatedVariants.forEach((v, idx) => {
      const origV = updates.variants && updates.variants[idx];
      const stk = Number(origV && origV.stock !== undefined && origV.stock !== null && origV.stock !== '' ? origV.stock : (v.stock !== undefined ? v.stock : 50));
      if (v.id) finalVariantStocksMap[v.id] = stk;
      if (v.weight) finalVariantStocksMap[v.weight] = stk;
      if (v.name) finalVariantStocksMap[v.name] = stk;
    });

    if (Object.keys(finalVariantStocksMap).length > 0) {
      await supabase
        .from('products')
        .update({
          nutrition_facts: {
            ...(typeof product.nutrition_facts === 'object' && product.nutrition_facts !== null ? product.nutrition_facts : {}),
            variant_stocks: finalVariantStocksMap,
          },
        })
        .eq('id', id);
    }

    const formattedVariants = updatedVariants.map((v, idx) => {
      const origV = updates.variants && updates.variants[idx];
      const vStock = finalVariantStocksMap[v.id] !== undefined
        ? finalVariantStocksMap[v.id]
        : (finalVariantStocksMap[v.weight] !== undefined ? finalVariantStocksMap[v.weight] : (v.in_stock ? 50 : 0));
      return {
        id: v.id,
        name: v.name,
        weight: v.weight,
        price: Number(v.price),
        originalPrice: Number(v.original_price || v.price),
        stock: vStock,
        inStock: vStock > 0,
      };
    });

    const totalStock = formattedVariants.length > 0 
      ? formattedVariants.reduce((acc, v) => acc + (v.stock || 0), 0)
      : (updates.stock !== undefined && updates.stock !== null && updates.stock !== '' ? Number(updates.stock) : 100);

    // Sync category_products junction table on update
    if (resolvedCatId && id) {
      try {
        // Remove old junction rows for this product
        await supabase.from('category_products').delete().eq('product_id', id);
        // Insert new junction row
        await supabase.from('category_products').upsert(
          [{ category_id: resolvedCatId, product_id: id }],
          { onConflict: 'category_id,product_id' }
        );
      } catch (err) {
        console.warn('category_products sync warning on update:', err?.message);
      }
    }

    let savedImgs = [];
    if (updates.images !== undefined || updates.image_gallery !== undefined || updates.image !== undefined) {
      savedImgs = await saveProductImages(id, updates.images || updates.image_gallery, updates.image, updates.secondaryImage);
      if (savedImgs.length > 0) {
        const primaryImg = savedImgs.find(i => i.is_primary) || savedImgs[0];
        const primaryUrl = primaryImg.image_url;
        const secondaryUrl = savedImgs.length > 1 ? savedImgs[1].image_url : primaryUrl;
        await supabase.from('products').update({ image_url: primaryUrl, secondary_image_url: secondaryUrl }).eq('id', id);
      }
    } else {
      const imagesMap = await fetchProductImagesMap([id]);
      savedImgs = imagesMap.get(String(id)) || [];
    }

    const primaryImg = savedImgs.find(i => i.is_primary) || savedImgs[0];
    const primaryUrl = primaryImg ? primaryImg.image_url : (product.image_url || updates.image || '');
    const secondaryUrl = (savedImgs.length > 1 ? savedImgs[1].image_url : primaryUrl) || product.secondary_image_url || '';

    const formattedProduct = {
      _id: product.id,
      id: product.id,
      title: product.title,
      slug: product.slug,
      subtitle: product.subtitle,
      description: product.description,
      category: product.category,
      price: Number(formattedVariants[0]?.price || updates.price || 0),
      originalPrice: Number(formattedVariants[0]?.originalPrice || updates.originalPrice || formattedVariants[0]?.price || 0),
      stock: totalStock,
      sku: product.sku || updates.sku || 'MLS-PRD',
      status: product.is_active !== false ? 'active' : 'inactive',
      image: primaryUrl,
      image_url: primaryUrl,
      secondaryImage: secondaryUrl,
      secondary_image_url: secondaryUrl,
      images: savedImgs,
      badges: product.badges || [],
      ingredients: product.ingredients || [],
      allergens: product.allergens || '',
      benefits: product.benefits || [],
      targetAudience: product.target_audience || '',
      nutritionFacts: product.nutrition_facts || {},
      pieces: product.nutrition_facts?.pieces || updates.pieces || '',
      isFeatured: product.is_featured !== false,
      variants: formattedVariants,
    };

    return res.json(formattedProduct);
  } catch (error) {
    console.error('updateProduct Catch Error:', error);
    return res.status(500).json({ message: 'Error updating product', error: error.message });
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

