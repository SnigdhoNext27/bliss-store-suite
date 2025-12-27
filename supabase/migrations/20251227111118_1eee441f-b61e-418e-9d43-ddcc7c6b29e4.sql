-- Create a secure order creation function that handles everything atomically
-- All parameters with defaults must come after required parameters
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_order_number TEXT,
  p_subtotal NUMERIC,
  p_delivery_fee NUMERIC,
  p_total NUMERIC,
  p_shipping_address JSONB,
  p_items JSONB,
  p_user_id UUID DEFAULT NULL,
  p_guest_phone TEXT DEFAULT NULL,
  p_guest_email TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_calculated_subtotal NUMERIC := 0;
  v_calculated_total NUMERIC;
BEGIN
  -- Validate items array is not empty
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Validate and calculate prices from database (server-side price validation)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get actual price from products table if product_id exists
    IF v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' != 'null' THEN
      SELECT price, sale_price, name INTO v_product
      FROM products 
      WHERE id = (v_item->>'product_id')::UUID AND is_active = true;
      
      IF v_product IS NULL THEN
        RAISE EXCEPTION 'Product not found or inactive: %', v_item->>'product_id';
      END IF;
      
      -- Use sale_price if available, otherwise regular price
      v_calculated_subtotal := v_calculated_subtotal + 
        (COALESCE(v_product.sale_price, v_product.price) * (v_item->>'quantity')::INTEGER);
    ELSE
      -- For legacy/sample products without ID, trust the provided price
      v_calculated_subtotal := v_calculated_subtotal + 
        ((v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER);
    END IF;
  END LOOP;

  -- Calculate total with delivery fee
  v_calculated_total := v_calculated_subtotal + p_delivery_fee;

  -- Validate delivery fee is reasonable (between 0 and 500)
  IF p_delivery_fee < 0 OR p_delivery_fee > 500 THEN
    RAISE EXCEPTION 'Invalid delivery fee';
  END IF;

  -- Create the order
  INSERT INTO orders (
    order_number,
    user_id,
    guest_phone,
    guest_email,
    subtotal,
    delivery_fee,
    total,
    shipping_address,
    notes,
    status
  ) VALUES (
    p_order_number,
    p_user_id,
    p_guest_phone,
    p_guest_email,
    v_calculated_subtotal,
    p_delivery_fee,
    v_calculated_total,
    p_shipping_address,
    p_notes,
    'pending'
  )
  RETURNING id INTO v_order_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_image,
      size,
      color,
      quantity,
      price
    ) VALUES (
      v_order_id,
      CASE WHEN v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' != 'null' 
           THEN (v_item->>'product_id')::UUID 
           ELSE NULL END,
      v_item->>'product_name',
      v_item->>'product_image',
      v_item->>'size',
      v_item->>'color',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC
    );
  END LOOP;

  -- Return success with order details
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', p_order_number,
    'total', v_calculated_total
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.create_order_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items TO anon;

-- Add restrictive policy for order_items - only allow via the secure function
-- The function uses SECURITY DEFINER so it bypasses RLS
CREATE POLICY "Order items created via secure function only"
ON public.order_items
FOR INSERT
WITH CHECK (false);