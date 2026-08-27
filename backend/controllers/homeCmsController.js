import { supabase } from '../config/supabase.js';

export const getHomeCms = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('home_cms')
      .select('*')
      .eq('id', 'main_home_config')
      .single();

    if (error || !data) {
      // Fallback default config if DB table is not yet populated
      return res.json({
        heroTitle: "Artisanal Millet Bakes Baked with Pure Desi Ghee & Jaggery",
        heroSubtitle: "Handcrafted in small batches without Maida, Palm Oil, or refined sugars.",
        heroVideoUrl: "https://res.cloudinary.com/dmm8lfc3x/video/upload/q_auto,f_auto/v1787068808/cookie_video.mp4",
        heroPosterUrl: "https://res.cloudinary.com/dmm8lfc3x/video/upload/so_0,q_auto/v1787068808/cookie_video.jpg",
        snackRituals: [
          { title: "Chai Time Companion", desc: "Crisp Cardamom Bajra pairs naturally with hot morning tea." },
          { title: "Post-Workout Fuel", desc: "Cocoa Ragi provides protein & natural iron replenishment." }
        ],
        transparencyFeatures: [
          { title: "Zero Maida", desc: "100% Ancient Whole Grains" },
          { title: "Zero Palm Oil", desc: "100% Pure Organic Desi Ghee" },
          { title: "Zero Refined Sugar", desc: "100% Raw Unrefined Jaggery" }
        ],
        brandStory: {
          title: "The MILASTY Heritage",
          content: "Born out of a simple question: Can everyday Indian snacks be genuinely healthy, clean, and delicious without compromising on authentic taste?"
        }
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Home CMS content', error: error.message });
  }
};

export const updateHomeCms = async (req, res) => {
  try {
    const cmsPayload = req.body;

    const { data, error } = await supabase
      .from('home_cms')
      .upsert({
        id: 'main_home_config',
        ...cmsPayload,
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Home CMS updated successfully', data });
  } catch (error) {
    res.status(500).json({ message: 'Error updating Home CMS content', error: error.message });
  }
};
