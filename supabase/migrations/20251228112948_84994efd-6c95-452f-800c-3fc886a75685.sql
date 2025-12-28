-- Add flash sale settings to site_settings
INSERT INTO site_settings (key, value) VALUES 
  ('flash_sale_enabled', 'true'),
  ('flash_sale_discount', '50'),
  ('flash_sale_end_date', (NOW() + INTERVAL '3 days')::text)
ON CONFLICT (key) DO NOTHING;

-- Create notifications table for customer notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'product', 'order', 'promo'
  image_url TEXT,
  link TEXT,
  is_global BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid() OR (is_global = true));

CREATE POLICY "Users can mark own notifications as read"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid() OR (is_global = true AND auth.uid() IS NOT NULL));

CREATE POLICY "Admins can manage notifications"
  ON public.notifications
  FOR ALL
  USING (has_admin_access(auth.uid()));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;