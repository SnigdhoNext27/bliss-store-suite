-- Add has_sizes column to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS has_sizes boolean DEFAULT true;

-- Update existing categories to set appropriate has_sizes values
-- Categories like Caps, Accessories typically don't need sizes
UPDATE public.categories 
SET has_sizes = false 
WHERE LOWER(name) IN ('caps', 'cap', 'accessories', 'gadgets', 'bags', 'watches', 'jewelry');

-- Keep has_sizes = true for clothing categories (default)