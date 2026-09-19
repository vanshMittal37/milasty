import { supabase } from '../config/supabase.js';
import { initialProducts } from '../data/seedData.js';
import { LOW_STOCK_THRESHOLD } from '../config/constants.js';
import { getApprovedProductReviewStats } from './reviewController.js';

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

        return {
          _id: p.id,
          id: p.id,
          title: p.title,
          slug: p.slug,
          subtitle: p.subtitle,
          description: p.description,
          category: p.category,
          price: Number(variants[0]?.price || 0),
          originalPrice: Number(variants[0]?.originalPrice || variants[0]?.price || 0),
          stock: calculatedStock,
          sku: p.sku || 'MLS-PRD',
          status: p.is_active !== false ? 'active' : 'inactive',
          image: p.image_url,
          secondaryImage: p.secondary_image_url || '',
          badges: p.badges || [],
          ingredients: p.ingredients || [],
          allergens: p.allergens || '',
          benefits: p.benefits || [],
          targetAudience: p.target_audience || '',
          nutritionFacts: p.nutrition_facts || {},
          pieces: p.nutrition_facts?.pieces || p.pieces || '',
          labReportUrl: p.lab_report_url || '',
          isFeatured: p.is_featured !== false,
          rating: realRating,
          reviewCount: realReviewCount,
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

      const formatted = {
        _id: p.id,
        id: p.id,
        title: p.title,
        slug: p.slug,
        subtitle: p.subtitle,
        description: p.description,
        category: p.category,
        price: Number(variants[0]?.price || 0),
        originalPrice: Number(variants[0]?.originalPrice || variants[0]?.price || 0),
        stock: calculatedStock,
        sku: p.sku || 'MLS-PRD',
        status: p.is_active !== false ? 'active' : 'inactive',
        image: p.image_url,
        secondaryImage: p.secondary_image_url || '',
        badges: p.badges || [],
        ingredients: p.ingredients || [],
        allergens: p.allergens || '',
        benefits: p.benefits || [],
        targetAudience: p.target_audience || '',
        nutritionFacts: p.nutrition_facts || {},
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

    const insertPayload = {
      title: title.trim(),
      slug: finalSlug,
      subtitle: subtitle || '',
      description: description || '',
      category: category || 'daily',
      image_url: image || '',
      secondary_image_url: secondaryImage || '',
      lab_report_url: req.body.labReportUrl || req.body.lab_report_url || '',
      ingredients: parsedIngredients,
      nutrition_facts: mergedNutritionFacts,
      badges: parsedBadges,
      allergens: allergens || '',
      benefits: parsedBenefits,
      target_audience: targetAudience || '',
      is_featured: isFeatured !== false,
      is_active: status === 'active',
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert([insertPayload])
      .select()
      .single();

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
      image: product.image_url,
      secondaryImage: product.secondary_image_url || '',
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

    const updatePayload = {
      title: updates.title,
      subtitle: updates.subtitle || '',
      description: updates.description,
      category: updates.category,
      image_url: updates.image !== undefined ? updates.image : undefined,
      secondary_image_url: updates.secondaryImage !== undefined ? updates.secondaryImage : undefined,
      lab_report_url: updates.labReportUrl !== undefined ? updates.labReportUrl : (updates.lab_report_url !== undefined ? updates.lab_report_url : undefined),
      ingredients: parsedIngredients,
      nutrition_facts: {
        ...(typeof updates.nutritionFacts === 'object' && updates.nutritionFacts !== null ? updates.nutritionFacts : {}),
        pieces: updates.pieces || (typeof updates.nutritionFacts === 'object' ? updates.nutritionFacts?.pieces : '') || '',
        variant_stocks: Object.keys(variantStocksMap).length > 0 ? variantStocksMap : updates.nutritionFacts?.variant_stocks,
      },
      badges: parsedBadges,
      allergens: updates.allergens || '',
      benefits: parsedBenefits,
      target_audience: updates.targetAudience || '',
      is_featured: updates.isFeatured !== false,
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

    const { data: product, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

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
      image: product.image_url,
      secondaryImage: product.secondary_image_url || '',
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

