-- Honest Ingredients (home page section). Previously stored only in a JSON file on the server's
-- disk, which Railway wipes on every redeploy — so admin edits and uploaded images disappeared.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS honest_ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backend-only access (service-role key); the public reads ingredients through the API.
ALTER TABLE honest_ingredients ENABLE ROW LEVEL SECURITY;

-- Default ingredients (only inserted if missing — never overwrites admin edits)
INSERT INTO honest_ingredients (id, name, subtitle, description, image_url, active, created_at) VALUES
  ('ing_bajra', 'BAJRA', 'PEARL MILLET', 'Powerhouse of fiber, magnesium and essential minerals for long-lasting energy.', '/images/image1.jpeg', TRUE, now() - interval '4 minutes'),
  ('ing_jowar', 'JOWAR', 'SORGHUM MILLET', 'Gluten-free supergrain packed with antioxidant polyphenols and high dietary fiber.', '/images/image2.jpeg', TRUE, now() - interval '3 minutes'),
  ('ing_ragi', 'RAGI', 'FINGER MILLET', 'Natural calcium powerhouse supporting bone density and healthy blood glucose control.', '/images/image3.jpeg', TRUE, now() - interval '2 minutes'),
  ('ing_ghee', 'DESI GHEE', 'PURE COW GHEE', 'Traditional A2 cow ghee rich in butyric acid, enhancing gut health and vitamin absorption.', '/images/image4.jpg', TRUE, now() - interval '1 minute')
ON CONFLICT (id) DO NOTHING;
