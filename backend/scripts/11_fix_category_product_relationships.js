import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
import { supabase } from '../config/supabase.js';

export async function fixCategoryProductRelationships() {
  console.log('=== MILASTY: Category & Product Relationship Repair & Diagnostic ===\n');

  // 1. Fetch categories
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (catErr) {
    console.error('Error fetching categories:', catErr.message);
    return;
  }
  console.log(`Found ${categories?.length || 0} categories in database.`);

  // 2. Fetch products
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*');

  if (prodErr) {
    console.error('Error fetching products:', prodErr.message);
    return;
  }
  console.log(`Found ${products?.length || 0} products in database.\n`);

  // 3. Category lookup maps
  const catByIdMap = new Map();
  const catBySlugOrNameMap = new Map();

  (categories || []).forEach(cat => {
    const cId = String(cat.id || cat._id).trim();
    const cSlug = String(cat.slug || '').toLowerCase().trim();
    const cName = String(cat.name || '').toLowerCase().trim();

    catByIdMap.set(cId, cat);
    if (cSlug) catBySlugOrNameMap.set(cSlug, cat);
    if (cName) catBySlugOrNameMap.set(cName, cat);
  });

  let updatedProductsCount = 0;
  let missingCategoryCount = 0;
  let validCategoryCount = 0;
  let relInsertedCount = 0;

  // 4. Iterate over products to inspect & repair category_id and category_products junction table
  for (const prod of (products || [])) {
    let currentCatId = prod.category_id ? String(prod.category_id).trim() : null;
    let currentCatSlug = prod.category ? String(prod.category).toLowerCase().trim() : null;

    let matchedCat = null;

    // Check if currentCatId is a valid categories.id
    if (currentCatId && catByIdMap.has(currentCatId)) {
      matchedCat = catByIdMap.get(currentCatId);
    } 
    // Fallback: check if currentCatId is actually a slug or name
    else if (currentCatId && catBySlugOrNameMap.has(currentCatId.toLowerCase())) {
      matchedCat = catBySlugOrNameMap.get(currentCatId.toLowerCase());
    }
    // Fallback: check currentCatSlug in slug/name map
    else if (currentCatSlug && catBySlugOrNameMap.has(currentCatSlug)) {
      matchedCat = catBySlugOrNameMap.get(currentCatSlug);
    }
    // Special legacy aliases (e.g. gifts -> gifting)
    else if (currentCatSlug === 'gifts' && catBySlugOrNameMap.has('gifting')) {
      matchedCat = catBySlugOrNameMap.get('gifting');
    }

    if (matchedCat) {
      validCategoryCount++;
      const targetCatId = matchedCat.id;
      const targetSlug = matchedCat.slug || currentCatSlug || 'cookies';

      // 1. Sync category_products junction table (Many-to-Many source of truth)
      try {
        const { error: relErr } = await supabase
          .from('category_products')
          .upsert([
            { category_id: targetCatId, product_id: prod.id }
          ], { onConflict: 'category_id,product_id' });

        if (relErr) {
          console.warn(`category_products upsert notice for ${prod.id}:`, relErr.message);
        } else {
          relInsertedCount++;
        }
      } catch (err) {
        console.warn(`category_products exception for ${prod.id}:`, err?.message);
      }

      // 2. Update products table columns (category_id and legacy category slug)
      let updErr = null;
      try {
        const { error } = await supabase
          .from('products')
          .update({
            category_id: targetCatId,
            category: targetSlug,
          })
          .eq('id', prod.id);
        updErr = error;
      } catch (err) {
        updErr = err;
      }

      if (updErr && updErr.message && updErr.message.toLowerCase().includes('category_id')) {
        // Fallback: category_id column not in schema cache yet, update category text column
        const { error: fbErr } = await supabase
          .from('products')
          .update({ category: targetSlug })
          .eq('id', prod.id);
        if (!fbErr) {
          updatedProductsCount++;
          console.log(`Updated product "${prod.title}" (${prod.id}) category slug => "${targetSlug}" (category_products synced)`);
        }
      } else if (!updErr) {
        updatedProductsCount++;
        console.log(`Updated product "${prod.title}" (${prod.id}) category_id => "${targetCatId}", category => "${targetSlug}"`);
      }
    } else {
      missingCategoryCount++;
      console.warn(`[ORPHAN] Product "${prod.title}" (${prod.id}) has no matching category (category_id: "${prod.category_id}", category: "${prod.category}")`);
    }
  }

  // 5. Calculate category product counts report
  const { data: updatedProducts } = await supabase.from('products').select('id, title, category_id, category');
  const { data: junctionRows } = await supabase.from('category_products').select('category_id, product_id');

  const categoryCounts = {};
  (categories || []).forEach(cat => {
    categoryCounts[cat.name || cat.slug] = 0;
  });

  (categories || []).forEach(cat => {
    const cId = cat.id;
    const cSlug = cat.slug;

    const matchedProductIds = new Set();
    (junctionRows || []).forEach(r => {
      if (r.category_id === cId || r.category_id === cSlug) {
        matchedProductIds.add(r.product_id);
      }
    });

    (updatedProducts || []).forEach(p => {
      if (p.category_id === cId || p.category === cSlug) {
        matchedProductIds.add(p.id);
      }
    });

    categoryCounts[cat.name || cat.slug] = matchedProductIds.size;
  });

  console.log('\n==================================================');
  console.log('DIAGNOSTIC & MIGRATION REPORT');
  console.log('==================================================');
  console.log(`Total Categories          : ${categories?.length || 0}`);
  console.log(`Total Products            : ${products?.length || 0}`);
  console.log(`Products with Valid Cat   : ${validCategoryCount}`);
  console.log(`Orphan Products (No Cat)  : ${missingCategoryCount}`);
  console.log(`Products Repaired in DB   : ${updatedProductsCount}`);
  console.log(`Category Products Synced  : ${relInsertedCount}`);
  console.log('--------------------------------------------------');
  console.log('Products Count per Category:');
  Object.entries(categoryCounts).forEach(([catName, count]) => {
    console.log(` - ${catName.padEnd(25)} : ${count} product(s)`);
  });
  console.log('==================================================\n');
}

if (process.argv[1]?.includes('11_fix_category_product_relationships.js')) {
  fixCategoryProductRelationships().then(() => process.exit(0));
}
