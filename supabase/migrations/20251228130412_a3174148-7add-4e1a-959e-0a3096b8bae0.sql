-- Push notification subscriptions table
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  push_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT true,
  order_updates boolean DEFAULT true,
  promotions boolean DEFAULT true,
  new_products boolean DEFAULT true,
  restock_alerts boolean DEFAULT true,
  abandoned_cart boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Abandoned carts table for tracking
CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id text,
  cart_data jsonb NOT NULL,
  total_value numeric NOT NULL DEFAULT 0,
  reminder_sent boolean DEFAULT false,
  reminder_count integer DEFAULT 0,
  last_reminder_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  recovered boolean DEFAULT false
);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own abandoned carts" ON public.abandoned_carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage abandoned carts" ON public.abandoned_carts
  FOR ALL USING (has_admin_access(auth.uid()));

CREATE POLICY "Anyone can insert abandoned carts" ON public.abandoned_carts
  FOR INSERT WITH CHECK (true);

-- Restock alerts table
CREATE TABLE public.restock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  notified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.restock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts" ON public.restock_alerts
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can manage all alerts" ON public.restock_alerts
  FOR ALL USING (has_admin_access(auth.uid()));

-- A/B testing fields for notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS variant_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES notifications(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_ab_test boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ab_test_name text;

-- Automated triggers configuration
CREATE TABLE public.notification_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type text NOT NULL, -- 'abandoned_cart', 'order_status', 'restock', 'welcome'
  is_active boolean DEFAULT true,
  delay_minutes integer DEFAULT 60,
  title_template text NOT NULL,
  message_template text NOT NULL,
  send_email boolean DEFAULT true,
  send_push boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage triggers" ON public.notification_triggers
  FOR ALL USING (has_admin_access(auth.uid()));

CREATE POLICY "Everyone can view active triggers" ON public.notification_triggers
  FOR SELECT USING (is_active = true);

-- Insert default triggers
INSERT INTO public.notification_triggers (trigger_type, title_template, message_template, delay_minutes) VALUES
('abandoned_cart', '🛒 You left something behind!', 'Your cart is waiting! Complete your purchase before items sell out.', 60),
('order_status', '📦 Order Update', 'Your order {{order_number}} status has been updated to {{status}}.', 0),
('restock', '🔔 Back in Stock!', '{{product_name}} is back in stock! Get it before it''s gone again.', 0),
('welcome', '👋 Welcome to Almans!', 'Thanks for joining us! Enjoy 10% off your first order with code WELCOME10.', 5);

-- Create trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_abandoned_carts_updated_at
  BEFORE UPDATE ON public.abandoned_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_triggers_updated_at
  BEFORE UPDATE ON public.notification_triggers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();