import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  uses_count: number | null;
  expires_at: string | null;
  is_active: boolean;
}

interface UseCouponResult {
  coupon: Coupon | null;
  discount: number;
  loading: boolean;
  error: string | null;
  applyCoupon: (code: string, subtotal: number) => Promise<boolean>;
  removeCoupon: () => void;
}

export function useCoupon(): UseCouponResult {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyCoupon = async (code: string, subtotal: number): Promise<boolean> => {
    if (!code.trim()) {
      setError('Please enter a coupon code');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch coupon by code
      const { data, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (fetchError || !data) {
        setError('Invalid coupon code');
        setLoading(false);
        return false;
      }

      const couponData = data as Coupon;

      // Check if expired
      if (couponData.expires_at && new Date(couponData.expires_at) < new Date()) {
        setError('This coupon has expired');
        setLoading(false);
        return false;
      }

      // Check max uses
      if (couponData.max_uses && (couponData.uses_count || 0) >= couponData.max_uses) {
        setError('This coupon has reached its usage limit');
        setLoading(false);
        return false;
      }

      // Check minimum order amount
      if (couponData.min_order_amount && subtotal < couponData.min_order_amount) {
        setError(`Minimum order amount is ৳${couponData.min_order_amount}`);
        setLoading(false);
        return false;
      }

      // Calculate discount
      let calculatedDiscount = 0;
      if (couponData.discount_type === 'percentage') {
        calculatedDiscount = (subtotal * couponData.discount_value) / 100;
      } else {
        calculatedDiscount = couponData.discount_value;
      }

      // Ensure discount doesn't exceed subtotal
      calculatedDiscount = Math.min(calculatedDiscount, subtotal);

      setCoupon(couponData);
      setDiscount(calculatedDiscount);
      setLoading(false);
      return true;
    } catch (err) {
      setError('Failed to apply coupon');
      setLoading(false);
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setDiscount(0);
    setError(null);
  };

  return {
    coupon,
    discount,
    loading,
    error,
    applyCoupon,
    removeCoupon,
  };
}
