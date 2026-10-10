-- 1) Delivery type on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_type text NOT NULL DEFAULT 'home';

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_delivery_type_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_type_check CHECK (delivery_type IN ('home','office'));

-- 2) Algerian phone format (only enforced on new/updated rows)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_phone_dz_format;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_phone_dz_format
  CHECK (phone IS NULL OR phone ~ '^0[5-7][0-9]{8}$') NOT VALID;

-- 3) Office (stop desk) shipping cost per wilaya
ALTER TABLE public.wilayas
  ADD COLUMN IF NOT EXISTS office_shipping_cost numeric NOT NULL DEFAULT 400;

UPDATE public.wilayas
  SET office_shipping_cost = GREATEST(200, shipping_cost - 200)
  WHERE office_shipping_cost = 400;

-- 4) Stock handling on order status change
CREATE OR REPLACE FUNCTION public.apply_order_stock_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  pid uuid;
  qty integer;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- deduct when confirmed
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
      FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
        BEGIN
          pid := (item->'product'->>'id')::uuid;
        EXCEPTION WHEN others THEN
          pid := NULL;
        END;
        qty := COALESCE((item->>'quantity')::int, 0);
        IF pid IS NOT NULL AND qty > 0 THEN
          UPDATE public.products
            SET stock = GREATEST(0, stock - qty)
            WHERE id = pid;
        END IF;
      END LOOP;
    END IF;

    -- restore when a previously deducted order is cancelled
    IF NEW.status = 'cancelled' AND OLD.status IN ('confirmed','preparing','shipped') THEN
      FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
        BEGIN
          pid := (item->'product'->>'id')::uuid;
        EXCEPTION WHEN others THEN
          pid := NULL;
        END;
        qty := COALESCE((item->>'quantity')::int, 0);
        IF pid IS NOT NULL AND qty > 0 THEN
          UPDATE public.products
            SET stock = stock + qty
            WHERE id = pid;
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_stock_changes ON public.orders;
CREATE TRIGGER orders_stock_changes
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.apply_order_stock_changes();

-- 5) Realtime for orders
ALTER TABLE public.orders REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.orders';
  END IF;
END $$;