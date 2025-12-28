-- Add scheduled_at column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_sent boolean DEFAULT true;

-- Create index for scheduled notifications query
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled 
ON public.notifications (scheduled_at) 
WHERE scheduled_at IS NOT NULL AND is_sent = false;