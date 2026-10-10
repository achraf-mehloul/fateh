-- Drop the insecure public SELECT policy
DROP POLICY IF EXISTS "Anyone can view orders by order_number" ON public.orders;

-- Create a secure function to get order by order_number (for public tracking)
CREATE OR REPLACE FUNCTION public.get_order_by_number(_order_number text)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders WHERE order_number = _order_number LIMIT 1;
$$;

-- Create policy: Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));