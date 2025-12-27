-- Add social media link keys to site_settings and update RLS policy to include them

-- Insert default social media link values
INSERT INTO public.site_settings (key, value) VALUES 
  ('social_facebook', 'https://www.facebook.com/profile.php?id=61584375982557'),
  ('social_instagram', 'https://www.instagram.com/almans.bd'),
  ('social_whatsapp', '8801930278877')
ON CONFLICT (key) DO NOTHING;

-- Update RLS policy to include social media keys
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
    'business_email'::text,
    'social_facebook'::text,
    'social_instagram'::text,
    'social_whatsapp'::text
  ]) 
  OR has_role(auth.uid(), 'admin'::app_role)
);