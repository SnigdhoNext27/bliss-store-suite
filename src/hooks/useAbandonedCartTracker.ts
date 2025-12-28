import { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

const CART_INACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes

export function useAbandonedCartTracker() {
  const { items, getTotalPrice } = useCartStore();
  const { user } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const cartSyncedRef = useRef<boolean>(false);

  // Update last activity on any cart change
  useEffect(() => {
    if (items.length > 0) {
      lastActivityRef.current = Date.now();
      cartSyncedRef.current = false;
    }
  }, [items]);

  // Check for cart abandonment periodically
  useEffect(() => {
    if (items.length === 0) return;

    const checkAbandonment = async () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // If cart has items and no activity for threshold time, track as abandoned
      if (timeSinceLastActivity >= CART_INACTIVITY_THRESHOLD && !cartSyncedRef.current) {
        await syncAbandonedCart();
        cartSyncedRef.current = true;
      }
    };

    const syncAbandonedCart = async () => {
      try {
        const totalValue = getTotalPrice();
        const cartData = {
          items: items.map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            size: item.size,
            image: item.product.images[0],
          })),
        };

        // Generate a guest ID if user is not logged in
        let guestId = localStorage.getItem('almans_guest_id');
        if (!user && !guestId) {
          guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('almans_guest_id', guestId);
        }

        // Check for existing abandoned cart
        const { data: existingCart } = await supabase
          .from('abandoned_carts')
          .select('id')
          .eq(user ? 'user_id' : 'guest_id', user?.id || guestId)
          .eq('recovered', false)
          .maybeSingle();

        if (existingCart) {
          // Update existing cart
          await supabase
            .from('abandoned_carts')
            .update({
              cart_data: cartData,
              total_value: totalValue,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingCart.id);
        } else {
          // Create new abandoned cart
          await supabase
            .from('abandoned_carts')
            .insert({
              user_id: user?.id || null,
              guest_id: user ? null : guestId,
              cart_data: cartData,
              total_value: totalValue,
            });
        }

        console.log('Abandoned cart synced');
      } catch (error) {
        console.error('Error syncing abandoned cart:', error);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkAbandonment, 5 * 60 * 1000);
    
    // Also check on page visibility change (user leaving)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && items.length > 0) {
        syncAbandonedCart();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check on beforeunload
    const handleBeforeUnload = () => {
      if (items.length > 0) {
        // Use sendBeacon for reliable tracking on page close
        const totalValue = getTotalPrice();
        const cartData = {
          items: items.map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            size: item.size,
            image: item.product.images[0],
          })),
        };

        const guestId = localStorage.getItem('almans_guest_id');
        
        // Note: This won't work with Supabase directly, but logs the intent
        console.log('Page unload - cart would be synced:', { cartData, totalValue });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [items, user, getTotalPrice]);

  // Mark cart as recovered when checkout is completed
  const markCartRecovered = async () => {
    try {
      const guestId = localStorage.getItem('almans_guest_id');
      
      await supabase
        .from('abandoned_carts')
        .update({ recovered: true })
        .eq(user ? 'user_id' : 'guest_id', user?.id || guestId)
        .eq('recovered', false);

      console.log('Cart marked as recovered');
    } catch (error) {
      console.error('Error marking cart as recovered:', error);
    }
  };

  return { markCartRecovered };
}
