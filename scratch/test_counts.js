import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { supabase } from '../backend/config/supabase.js';

async function test() {
  const { data: categories } = await supabase.from('categories').select('*');
  const { data: dbProducts, error } = await supabase.from('products').select('*');
  console.log('Categories count:', categories?.length);
  console.log('Products count:', dbProducts?.length);
  console.log('Categories:', categories?.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
  console.log('Products sample category fields:', dbProducts?.map(p => ({ title: p.title, category: p.category, category_id: p.category_id })));
}

test();
