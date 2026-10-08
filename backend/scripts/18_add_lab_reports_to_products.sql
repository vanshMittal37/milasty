-- Multiple lab reports per product: JSONB array of { "title": text, "url": text }.
-- The existing lab_report_url column is kept (synced to the first report) for backward compatibility.
ALTER TABLE products ADD COLUMN IF NOT EXISTS lab_reports JSONB DEFAULT '[]'::jsonb;

-- Backfill existing single reports into the new list
UPDATE products
SET lab_reports = jsonb_build_array(jsonb_build_object('title', '', 'url', lab_report_url))
WHERE COALESCE(lab_report_url, '') <> ''
  AND (lab_reports IS NULL OR lab_reports = '[]'::jsonb);

NOTIFY pgrst, 'reload schema';
