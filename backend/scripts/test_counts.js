import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';

async function test() {
  let { data: categories } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
  const { data: dbProducts } = await supabase.from('products').select('*');

  const countsMap = {};
  (categories || []).forEach(cat => {
    if (cat.id) countsMap[cat.id] = 0;
  });

  (dbProducts || []).forEach((p) => {
    const pCat = (p.category || '').toString().toLowerCase().trim();
    const pCatId = (p.category_id || '').toString().toLowerCase().trim();

    const matchedCat = (categories || []).find(cat => {
      const cId = (cat.id || '').toString().toLowerCase().trim();
      const cSlug = (cat.slug || '').toString().toLowerCase().trim();
      const cName = (cat.name || '').toString().toLowerCase().trim();

      if (pCatId && (pCatId === cId || pCatId === cSlug)) return true;
      if (pCat) {
        if (pCat === cId || pCat === cSlug || pCat === cName) return true;
        if (pCat === 'gifts' && (cSlug === 'gifting' || cSlug === 'gifts')) return true;
        if (pCat === 'gifting' && (cSlug === 'gifting' || cSlug === 'gifts')) return true;
      }
      return false;
    });

    if (matchedCat && matchedCat.id) {
      countsMap[matchedCat.id] = (countsMap[matchedCat.id] || 0) + 1;
    }
  });

  const formatted = categories.map(cat => ({
    name: cat.name,
    slug: cat.slug,
    count: countsMap[cat.id] || 0
  }));

  console.log('Resulting dynamic counts:', formatted);
}

test();
