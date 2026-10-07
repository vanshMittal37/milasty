-- Shipment tracking columns used by Shiprath auto-booking (shipratController.bookShiprathShipment)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_error TEXT;
