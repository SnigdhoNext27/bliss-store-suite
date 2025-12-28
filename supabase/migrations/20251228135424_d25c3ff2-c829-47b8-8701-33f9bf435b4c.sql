-- Review Photos table
CREATE TABLE public.review_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review photos"
ON public.review_photos FOR SELECT USING (true);

CREATE POLICY "Users can upload photos to their reviews"
ON public.review_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reviews 
    WHERE id = review_id AND user_id = auth.uid()
  )
);

-- Gift Cards table
CREATE TABLE public.gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  purchaser_id UUID REFERENCES auth.users(id),
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their gift cards"
ON public.gift_cards FOR SELECT
USING (purchaser_id = auth.uid() OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Authenticated users can purchase gift cards"
ON public.gift_cards FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  referred_email TEXT NOT NULL,
  referred_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referrals"
ON public.referrals FOR SELECT
USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "Users can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (referrer_id = auth.uid());

-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Product Bundles table
CREATE TABLE public.product_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  discount_percentage NUMERIC NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bundles"
ON public.product_bundles FOR SELECT USING (true);

-- Bundle Items table
CREATE TABLE public.bundle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bundle items"
ON public.bundle_items FOR SELECT USING (true);

-- Product Q&A table
CREATE TABLE public.product_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  question TEXT NOT NULL,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions"
ON public.product_questions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can ask questions"
ON public.product_questions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Product Answers table
CREATE TABLE public.product_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.product_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  answer TEXT NOT NULL,
  is_official BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view answers"
ON public.product_answers FOR SELECT USING (true);

CREATE POLICY "Users can add answers"
ON public.product_answers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Gift wrapping options for orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_wrap BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_message TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_card_code TEXT;