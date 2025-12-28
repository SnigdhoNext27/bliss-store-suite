-- Create newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view subscribers
CREATE POLICY "Admins can view subscribers" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (has_admin_access(auth.uid()));

-- Only admins can update/delete subscribers
CREATE POLICY "Admins can manage subscribers" 
ON public.newsletter_subscribers 
FOR ALL 
USING (has_admin_access(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);