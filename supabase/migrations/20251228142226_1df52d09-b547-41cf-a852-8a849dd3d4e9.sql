-- Add saved payment methods table
CREATE TABLE public.saved_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  method_type TEXT NOT NULL CHECK (method_type IN ('bkash', 'nagad', 'card')),
  last_four TEXT,
  phone_number TEXT,
  card_brand TEXT,
  is_default BOOLEAN DEFAULT false,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add video_url column to products table
ALTER TABLE public.products ADD COLUMN video_url TEXT;

-- Enable RLS on saved_payment_methods
ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own payment methods
CREATE POLICY "Users can manage own payment methods"
  ON public.saved_payment_methods
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_saved_payment_methods_user_id ON public.saved_payment_methods(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_saved_payment_methods_updated_at
  BEFORE UPDATE ON public.saved_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();