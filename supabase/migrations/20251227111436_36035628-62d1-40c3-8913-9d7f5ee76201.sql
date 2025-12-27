-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Site settings are viewable by everyone" ON public.site_settings;

-- Create a policy that only exposes non-sensitive settings publicly
CREATE POLICY "Public settings are viewable by everyone"
ON public.site_settings
FOR SELECT
USING (
  key IN ('tagline', 'slogan', 'delivery_fee_dhaka', 'delivery_fee_outside')
  OR has_role(auth.uid(), 'admin'::app_role)
);