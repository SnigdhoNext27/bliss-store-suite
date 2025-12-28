import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export function useRestockAlert(productId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAlertSet, setIsAlertSet] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkAlert = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('restock_alerts')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .eq('notified', false)
      .maybeSingle();

    setIsAlertSet(!!data);
  }, [productId, user]);

  const setAlert = useCallback(async (email?: string) => {
    setLoading(true);

    try {
      const { error } = await supabase.from('restock_alerts').insert({
        product_id: productId,
        user_id: user?.id || null,
        email: email || user?.email || null,
      });

      if (error) throw error;

      setIsAlertSet(true);
      toast({
        title: 'Alert set!',
        description: "We'll notify you when this item is back in stock.",
      });
      return true;
    } catch (error) {
      console.error('Error setting restock alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to set restock alert.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [productId, user, toast]);

  const removeAlert = useCallback(async () => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('restock_alerts')
        .delete()
        .eq('product_id', productId)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsAlertSet(false);
      toast({
        title: 'Alert removed',
        description: 'You will no longer be notified about this product.',
      });
      return true;
    } catch (error) {
      console.error('Error removing alert:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [productId, user, toast]);

  return {
    isAlertSet,
    loading,
    checkAlert,
    setAlert,
    removeAlert,
  };
}
