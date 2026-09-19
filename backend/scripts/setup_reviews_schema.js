import { supabase } from '../config/supabase.js';

export async function setupReviewsAndTestimonialsSchema() {
  console.log('--- Initializing MILASTY Reviews & Testimonials Schema & Seed Data ---');

  // Seed default testimonials into DB if testimonials table exists and is empty
  try {
    const { data: existingTestimonials } = await supabase
      .from('testimonials')
      .select('*')
      .limit(1);

    if (!existingTestimonials || existingTestimonials.length === 0) {
      console.log('Seeding initial brand testimonials into database...');
      await supabase.from('testimonials').insert([
        {
          name: 'Dr. Sunita Rao',
          role: 'Holistic Nutritionist & Wellness Coach',
          rating: 5,
          content: 'As a nutritionist advocating for gut health and low-GI foods, Milasty\'s 100% millet artisan bakes are a game changer! Zero refined flour, zero artificial preservatives, and absolutely divine taste.',
          image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
          is_published: true,
          sort_order: 1,
        },
        {
          name: 'Kavita & Rajesh Sharma',
          role: 'Health-Conscious Parents',
          rating: 5,
          content: 'Finding clean, wholesome snacks for our kids used to be a challenge. The Cocoa Ragi Cookies are now our children\'s favorite lunchbox treat! Healthy, crunchy, and packed with calcium.',
          image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
          is_published: true,
          sort_order: 2,
        },
        {
          name: 'Ananya Deshmukh',
          role: 'Fitness Enthusiast & Yoga Instructor',
          rating: 5,
          content: 'Milasty\'s Almond Foxtail bakes are my go-to post-workout fuel. Clean ingredients, authentic jaggery sweetness, and incredible crunch. Highly recommend to everyone pursuing a clean diet!',
          image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          is_published: true,
          sort_order: 3,
        },
      ]);
      console.log('--- Brand Testimonials Seeded Successfully ---');
    }
  } catch (err) {
    console.warn('Testimonial schema setup notice:', err.message);
  }
}

// Run if called directly
if (process.argv[1]?.includes('setup_reviews_schema.js')) {
  setupReviewsAndTestimonialsSchema();
}
