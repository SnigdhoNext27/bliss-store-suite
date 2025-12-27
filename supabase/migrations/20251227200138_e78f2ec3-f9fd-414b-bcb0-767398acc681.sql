-- Fix RLS policies to use has_admin_access instead of has_role for admin check
-- This will allow super_admin, admin, officer, moderator to view/update orders

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT USING (has_admin_access(auth.uid()));

CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE USING (has_admin_access(auth.uid()));

-- Also fix order_items policies
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

CREATE POLICY "Admins can view all order items" ON public.order_items
FOR SELECT USING (has_admin_access(auth.uid()));