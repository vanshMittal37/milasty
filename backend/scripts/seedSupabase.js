import { supabase } from '../config/supabase.js';
import { initialProducts } from '../data/seedData.js';

export const seedSupabase = async () => {
  try {
    console.log('🌱 Starting Supabase migration & seeding...');

    // 1. Seed Categories
    const categoriesData = [
      { slug: 'starter', name: 'STARTER BOX', label: 'Starter Box', subtitle: 'Curated luxury ritual box', display_order: 1 },
      { slug: 'daily', name: 'DAILY BAKES', label: 'Daily Bakes', subtitle: 'Everyday healthy tea break snacks', display_order: 2 },
      { slug: 'gifting', name: 'GIFTING HAMPER', label: 'Gifting Hamper', subtitle: 'Artisanal gift boxes for celebrations', display_order: 3 },
      { slug: 'cookies', name: 'COOKIES', label: 'Cookies', subtitle: 'Pure Desi Ghee millet cookies', display_order: 4 },
    ];

    for (const cat of categoriesData) {
      await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
    }

    // 2. Seed Products and Variants
    for (const item of initialProducts) {
      const productRow = {
        title: item.title,
        slug: item.slug,
        subtitle: item.subtitle,
        description: item.description,
        category: item.category,
        image_url: item.image,
        secondary_image_url: item.secondaryImage,
        badges: item.badges || [],
        ingredients: item.ingredients || [],
        allergens: item.allergens,
        benefits: item.benefits || [],
        target_audience: item.targetAudience,
        nutrition_facts: item.nutritionFacts || {},
        lab_report_url: item.labReportUrl,
        is_featured: item.isFeatured || false,
        rating: item.rating || 5.0,
        review_count: item.reviewCount || 0,
      };

      const { data: prod, error: prodErr } = await supabase
        .from('products')
        .upsert(productRow, { onConflict: 'slug' })
        .select()
        .single();

      if (prodErr) {
        console.error(`Error seeding product ${item.slug}:`, prodErr.message);
        continue;
      }

      if (prod && item.variants && item.variants.length > 0) {
        for (const v of item.variants) {
          const variantRow = {
            product_id: prod.id,
            name: v.name,
            weight: v.weight,
            price: v.price,
            original_price: v.originalPrice || v.price,
            in_stock: v.inStock !== false,
          };
          await supabase.from('product_variants').insert(variantRow);
        }
      }
    }

    // 3. Seed Default Home CMS Configuration
    const homeCmsData = {
      id: 'main_home_config',
      hero_title: "Artisanal Millet Bakes Baked with Pure Desi Ghee & Jaggery",
      hero_subtitle: "Handcrafted in small batches without Maida, Palm Oil, or refined sugars.",
      hero_video_url: "https://res.cloudinary.com/dmm8lfc3x/video/upload/q_auto,f_auto/v1787068808/cookie_video.mp4",
      hero_poster_url: "https://res.cloudinary.com/dmm8lfc3x/video/upload/so_0,q_auto/v1787068808/cookie_video.jpg",
      snack_rituals: [
        { title: "Chai Time Companion", desc: "Crisp Cardamom Bajra pairs naturally with hot morning tea." },
        { title: "Post-Workout Fuel", desc: "Cocoa Ragi provides protein & natural iron replenishment." }
      ],
      transparency_features: [
        { title: "Zero Maida", desc: "100% Ancient Whole Grains" },
        { title: "Zero Palm Oil", desc: "100% Pure Organic Desi Ghee" },
        { title: "Zero Refined Sugar", desc: "100% Raw Unrefined Jaggery" }
      ],
      brand_story: {
        title: "The MILASTY Heritage",
        content: "Born out of a simple question: Can everyday Indian snacks be genuinely healthy, clean, and delicious without compromising on authentic taste?"
      }
    };

    await supabase.from('home_cms').upsert(homeCmsData, { onConflict: 'id' });

    console.log('✅ Supabase database successfully seeded!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
};

// If executed directly from CLI
if (process.argv[1]?.includes('seedSupabase.js')) {
  seedSupabase().then(() => process.exit(0));
}
