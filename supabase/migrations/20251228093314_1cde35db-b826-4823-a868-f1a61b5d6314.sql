-- Add display_order column to categories table for reordering
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

-- Update existing categories with sequential order based on name
WITH ordered_categories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as new_order
  FROM public.categories
)
UPDATE public.categories c
SET display_order = oc.new_order
FROM ordered_categories oc
WHERE c.id = oc.id;