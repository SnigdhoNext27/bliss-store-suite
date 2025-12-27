-- Drop and recreate the public settings policy to include whatsapp_notification_phone
DROP POLICY IF EXISTS "Public settings are viewable by everyone" ON public.site_settings;

CREATE POLICY "Public settings are viewable by everyone" 
ON public.site_settings 
FOR SELECT 
USING (
  key = ANY (ARRAY[
    'tagline'::text, 
    'slogan'::text, 
    'delivery_fee_dhaka'::text, 
    'delivery_fee_outside'::text,
    'whatsapp_notification_phone'::text,
    'business_phone'::text,
    'business_email'::text
  ]) 
  OR has_role(auth.uid(), 'admin'::app_role)
);