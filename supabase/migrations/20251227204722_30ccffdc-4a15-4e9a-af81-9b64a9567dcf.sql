-- Drop existing policy for site_settings management
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;

-- Create new policy using has_admin_access function which includes all admin roles
CREATE POLICY "Admins can manage site settings" 
ON public.site_settings 
FOR ALL 
USING (has_admin_access(auth.uid()))
WITH CHECK (has_admin_access(auth.uid()));