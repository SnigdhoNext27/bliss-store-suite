-- Create notification analytics table
CREATE TABLE public.notification_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('delivered', 'opened', 'clicked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for efficient querying
CREATE INDEX idx_notification_analytics_notification ON public.notification_analytics(notification_id);
CREATE INDEX idx_notification_analytics_user ON public.notification_analytics(user_id);
CREATE INDEX idx_notification_analytics_event ON public.notification_analytics(event_type);
CREATE INDEX idx_notification_analytics_created ON public.notification_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for analytics
CREATE POLICY "Admins can view all analytics"
ON public.notification_analytics FOR SELECT
USING (has_admin_access(auth.uid()));

CREATE POLICY "Users can log their own analytics"
ON public.notification_analytics FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Add delivery tracking columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS delivered_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0;

-- Create function to update notification counts
CREATE OR REPLACE FUNCTION public.update_notification_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'delivered' THEN
    UPDATE public.notifications SET delivered_count = delivered_count + 1 WHERE id = NEW.notification_id;
  ELSIF NEW.event_type = 'opened' THEN
    UPDATE public.notifications SET opened_count = opened_count + 1 WHERE id = NEW.notification_id;
  ELSIF NEW.event_type = 'clicked' THEN
    UPDATE public.notifications SET clicked_count = clicked_count + 1 WHERE id = NEW.notification_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update counts
CREATE TRIGGER update_notification_counts_trigger
AFTER INSERT ON public.notification_analytics
FOR EACH ROW EXECUTE FUNCTION public.update_notification_counts();