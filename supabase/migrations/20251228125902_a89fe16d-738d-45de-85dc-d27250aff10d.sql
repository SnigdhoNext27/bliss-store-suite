-- Add targeting fields to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS target_segment text DEFAULT 'all',
ADD COLUMN IF NOT EXISTS target_criteria jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS send_email boolean DEFAULT false;

-- Add comment explaining segments
COMMENT ON COLUMN public.notifications.target_segment IS 'Target audience: all, new_customers, high_value, by_location, newsletter_subscribers';
COMMENT ON COLUMN public.notifications.target_criteria IS 'Additional targeting criteria like location, min_order_value, etc';
COMMENT ON COLUMN public.notifications.send_email IS 'Whether to send email notifications to targeted users';