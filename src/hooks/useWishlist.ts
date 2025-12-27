import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export function useWishlist() {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistIds([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setWishlistIds(data?.map(item => item.product_id) || []);
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast({ title: 'Please sign in to add items to wishlist', variant: 'destructive' });
      return false;
    }

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert({ user_id: user.id, product_id: productId });

      if (error) throw error;
      
      setWishlistIds(prev => [...prev, productId]);
      toast({ title: 'Added to wishlist' });
      return true;
    } catch (error) {
      console.error('Add to wishlist error:', error);
      toast({ title: 'Failed to add to wishlist', variant: 'destructive' });
      return false;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      
      setWishlistIds(prev => prev.filter(id => id !== productId));
      toast({ title: 'Removed from wishlist' });
      return true;
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      toast({ title: 'Failed to remove from wishlist', variant: 'destructive' });
      return false;
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (wishlistIds.includes(productId)) {
      return removeFromWishlist(productId);
    } else {
      return addToWishlist(productId);
    }
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  return {
    wishlistIds,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    refetch: fetchWishlist,
  };
}
