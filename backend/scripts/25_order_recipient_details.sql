-- "Deliver to someone else" at checkout: the buyer stays the customer (customer_name / customer_phone),
-- the person receiving the parcel is stored here and used as the courier consignee.
-- NULL = delivering to the buyer.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(100);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(15);

NOTIFY pgrst, 'reload schema';
