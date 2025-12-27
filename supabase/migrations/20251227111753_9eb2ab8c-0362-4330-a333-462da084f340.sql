-- Drop the conflicting permissive INSERT policy that allows anyone to insert
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;