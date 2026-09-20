import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

export async function setupCMSTables() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    console.warn('⚠️ No DATABASE_URL/POSTGRES_URL present. Skipping direct postgres CMS DDL migration script.');
    return;
  }
  
  console.log('Connecting to PostgreSQL database to setup Bestsellers, Snack Finder & Honest Ingredients CMS tables...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Postgres directly!');

    const sqlStatements = [
      `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;`,

      `CREATE TABLE IF NOT EXISTS public.snack_finder_questions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,

      `CREATE TABLE IF NOT EXISTS public.snack_finder_options (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        question_id TEXT NOT NULL REFERENCES public.snack_finder_questions(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,

      `CREATE TABLE IF NOT EXISTS public.snack_finder_option_products (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        option_id TEXT NOT NULL REFERENCES public.snack_finder_options(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(option_id, product_id)
      );`,

      `CREATE TABLE IF NOT EXISTS public.honest_ingredients (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        subtitle TEXT DEFAULT '',
        description TEXT NOT NULL,
        image_url TEXT NOT NULL DEFAULT '',
        active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,

      `ALTER TABLE public.snack_finder_questions DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.snack_finder_options DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.snack_finder_option_products DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.honest_ingredients DISABLE ROW LEVEL SECURITY;`
    ];

    for (const statement of sqlStatements) {
      await client.query(statement);
    }
    console.log('✅ CMS tables created/verified successfully in PostgreSQL!');

    // Seed default Snack Finder question and options if table is empty
    const qCountRes = await client.query('SELECT COUNT(*) FROM public.snack_finder_questions;');
    if (parseInt(qCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding default Snack Finder Question & Options...');
      const qRes = await client.query(`
        INSERT INTO public.snack_finder_questions (id, title, description, active)
        VALUES ('q_default_snack', 'What are you looking for?', 'Select your current mood or craving preference to find matching bakes.', true)
        ON CONFLICT (id) DO NOTHING
        RETURNING id;
      `);

      const qId = 'q_default_snack';

      const options = [
        { id: 'opt_crunchy', name: 'Light & Crunchy', desc: 'Crispy millet bakes perfect for tea time.' },
        { id: 'opt_chocolate', name: 'Chocolate Cravings', desc: 'Rich cocoa & artisanal chocolate millet cookies.' },
        { id: 'opt_wholesome', name: 'Something Wholesome', desc: 'Nutrient-rich ancient grain bakes with Desi Ghee.' },
        { id: 'opt_share', name: 'Something to Share', desc: 'Artisanal gift boxes & family celebration hampers.' },
      ];

      for (let i = 0; i < options.length; i++) {
        const o = options[i];
        await client.query(`
          INSERT INTO public.snack_finder_options (id, question_id, name, description, active, display_order)
          VALUES ($1, $2, $3, $4, true, $5)
          ON CONFLICT (id) DO NOTHING;
        `, [o.id, qId, o.name, o.desc, i + 1]);
      }
      console.log('✅ Default Snack Finder seeded!');
    }

    // Seed default Honest Ingredients if table is empty
    const ingCountRes = await client.query('SELECT COUNT(*) FROM public.honest_ingredients;');
    if (parseInt(ingCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding default Honest Ingredients...');
      const seedIngredients = [
        { id: 'ing_bajra', name: 'BAJRA', subtitle: 'PEARL MILLET', description: 'Powerhouse of fiber, magnesium and essential minerals for long-lasting energy.', image_url: '/images/image1.jpeg' },
        { id: 'ing_jowar', name: 'JOWAR', subtitle: 'SORGHUM MILLET', description: 'Gluten-free supergrain packed with antioxidant polyphenols and high dietary fiber.', image_url: '/images/image2.jpeg' },
        { id: 'ing_ragi', name: 'RAGI', subtitle: 'FINGER MILLET', description: 'Natural calcium powerhouse supporting bone density and healthy blood glucose control.', image_url: '/images/image3.jpeg' },
        { id: 'ing_ghee', name: 'DESI GHEE', subtitle: 'PURE COW GHEE', description: 'Traditional A2 cow ghee rich in butyric acid, enhancing gut health and vitamin absorption.', image_url: '/images/image4.jpg' },
      ];

      for (let i = 0; i < seedIngredients.length; i++) {
        const ing = seedIngredients[i];
        await client.query(`
          INSERT INTO public.honest_ingredients (id, name, subtitle, description, image_url, active, display_order)
          VALUES ($1, $2, $3, $4, $5, true, $6)
          ON CONFLICT (id) DO NOTHING;
        `, [ing.id, ing.name, ing.subtitle, ing.description, ing.image_url, i + 1]);
      }
      console.log('✅ Default Honest Ingredients seeded!');
    }

  } catch (err) {
    console.error('❌ Error creating CMS tables via Postgres:', err.message);
  } finally {
    await client.end();
  }
}

if (process.argv[1] && process.argv[1].includes('setup_cms_tables.js')) {
  setupCMSTables();
}
