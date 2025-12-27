-- Add database constraints for data integrity

-- Products table constraints
ALTER TABLE public.products
ADD CONSTRAINT products_price_positive CHECK (price >= 0),
ADD CONSTRAINT products_stock_nonnegative CHECK (stock >= 0),
ADD CONSTRAINT products_name_length CHECK (length(name) <= 200);

-- Coupons table constraints  
ALTER TABLE public.coupons
ADD CONSTRAINT coupons_discount_positive CHECK (discount_value >= 0),
ADD CONSTRAINT coupons_min_order_nonnegative CHECK (min_order_amount >= 0);

-- Site settings value length constraint
ALTER TABLE public.site_settings
ADD CONSTRAINT site_settings_value_length CHECK (length(value) <= 2000);