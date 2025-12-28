-- Create loyalty points table to track user points
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty transactions table to track point history
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'earn', 'redeem', 'expire', 'bonus'
  description TEXT,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own loyalty points
CREATE POLICY "Users can view own loyalty points"
ON public.loyalty_points
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own loyalty record (first time)
CREATE POLICY "Users can insert own loyalty points"
ON public.loyalty_points
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- System updates points via functions only - admins can manage
CREATE POLICY "Admins can manage loyalty points"
ON public.loyalty_points
FOR ALL
USING (has_admin_access(auth.uid()));

-- Users can view their own transactions
CREATE POLICY "Users can view own loyalty transactions"
ON public.loyalty_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage transactions
CREATE POLICY "Admins can manage loyalty transactions"
ON public.loyalty_transactions
FOR ALL
USING (has_admin_access(auth.uid()));

-- Anyone can insert transactions (for edge function)
CREATE POLICY "Anyone can insert loyalty transactions"
ON public.loyalty_transactions
FOR INSERT
WITH CHECK (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_loyalty_points_updated_at
BEFORE UPDATE ON public.loyalty_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to award points on order completion
CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
  user_points RECORD;
  new_tier TEXT;
BEGIN
  -- Only award points when order status changes to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.user_id IS NOT NULL THEN
    -- Calculate points: 1 point per 100 BDT spent
    points_to_award := FLOOR(NEW.total / 100);
    
    -- Get or create loyalty record
    SELECT * INTO user_points FROM public.loyalty_points WHERE user_id = NEW.user_id;
    
    IF user_points IS NULL THEN
      INSERT INTO public.loyalty_points (user_id, points, lifetime_points, tier)
      VALUES (NEW.user_id, points_to_award, points_to_award, 'bronze');
    ELSE
      -- Determine new tier based on lifetime points
      new_tier := CASE
        WHEN user_points.lifetime_points + points_to_award >= 5000 THEN 'platinum'
        WHEN user_points.lifetime_points + points_to_award >= 2000 THEN 'gold'
        WHEN user_points.lifetime_points + points_to_award >= 500 THEN 'silver'
        ELSE 'bronze'
      END;
      
      UPDATE public.loyalty_points
      SET points = points + points_to_award,
          lifetime_points = lifetime_points + points_to_award,
          tier = new_tier,
          updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
    
    -- Record the transaction
    INSERT INTO public.loyalty_transactions (user_id, points, type, description, order_id)
    VALUES (NEW.user_id, points_to_award, 'earn', 'Points earned from order #' || NEW.order_number, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on orders table
CREATE TRIGGER award_points_on_delivery
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.award_loyalty_points();