import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export interface SavedPaymentMethod {
  id: string;
  method_type: 'bkash' | 'nagad' | 'card';
  last_four: string | null;
  phone_number: string | null;
  card_brand: string | null;
  is_default: boolean;
  nickname: string | null;
  created_at: string;
}

export function useSavedPaymentMethods() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMethods = async () => {
    if (!user) {
      setMethods([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMethods(data as SavedPaymentMethod[]);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, [user]);

  const addMethod = async (method: {
    method_type: 'bkash' | 'nagad' | 'card';
    phone_number?: string;
    last_four?: string;
    card_brand?: string;
    nickname?: string;
    is_default?: boolean;
  }) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // If setting as default, unset other defaults first
      if (method.is_default) {
        await supabase
          .from('saved_payment_methods')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('saved_payment_methods')
        .insert({
          user_id: user.id,
          method_type: method.method_type,
          phone_number: method.phone_number || null,
          last_four: method.last_four || null,
          card_brand: method.card_brand || null,
          nickname: method.nickname || null,
          is_default: method.is_default || false,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchMethods();
      toast({ title: 'Payment method saved successfully' });
      return { data };
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast({ title: 'Failed to save payment method', variant: 'destructive' });
      return { error };
    }
  };

  const deleteMethod = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_payment_methods')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchMethods();
      toast({ title: 'Payment method removed' });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({ title: 'Failed to remove payment method', variant: 'destructive' });
    }
  };

  const setDefault = async (id: string) => {
    if (!user) return;

    try {
      // Unset all defaults first
      await supabase
        .from('saved_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('saved_payment_methods')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchMethods();
      toast({ title: 'Default payment method updated' });
    } catch (error) {
      console.error('Error setting default:', error);
      toast({ title: 'Failed to update default', variant: 'destructive' });
    }
  };

  return {
    methods,
    loading,
    addMethod,
    deleteMethod,
    setDefault,
    refetch: fetchMethods,
  };
}
