
-- ORDERS: restrict reads to admins (authenticated only)
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ORDERS: replace permissive WITH CHECK (true) insert policy with validated one
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'::order_status
    AND total_price > 0
    AND length(btrim(customer_name)) BETWEEN 2 AND 100
    AND length(btrim(order_number)) BETWEEN 3 AND 50
    AND length(btrim(wilaya)) BETWEEN 1 AND 100
    AND length(btrim(municipality)) BETWEEN 1 AND 100
    AND (phone IS NULL OR length(btrim(phone)) BETWEEN 6 AND 20)
    AND (notes IS NULL OR length(notes) <= 1000)
    AND (sender_account IS NULL OR length(sender_account) <= 200)
    AND (payment_receipt_url IS NULL OR length(payment_receipt_url) <= 500)
    AND length(btrim(payment_method)) BETWEEN 1 AND 50
    AND jsonb_typeof(items) = 'array'
    AND jsonb_array_length(items) > 0
  );

-- ORDERS: no anon table privileges beyond insert
REVOKE ALL ON public.orders FROM anon;
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

-- USER_ROLES: no public/anon access at all
REVOKE ALL ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
