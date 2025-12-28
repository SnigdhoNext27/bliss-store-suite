-- Drop existing restrictive policies on products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;

-- Recreate policies using has_admin_access for proper role checking
CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
USING (has_admin_access(auth.uid()));

CREATE POLICY "Active products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING ((is_active = true) OR has_admin_access(auth.uid()));