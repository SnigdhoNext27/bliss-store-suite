import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useNewOrdersCount() {
  const queryClient = useQueryClient();
  const [hasNewOrder, setHasNewOrder] = useState(false);

  const { data: count = 0 } = useQuery({
    queryKey: ['pending-orders-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Subscribe to real-time order changes
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // New order inserted, invalidate count and show indicator
          queryClient.invalidateQueries({ queryKey: ['pending-orders-count'] });
          setHasNewOrder(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // Order status changed, refresh count
          queryClient.invalidateQueries({ queryKey: ['pending-orders-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const clearNewOrderIndicator = () => {
    setHasNewOrder(false);
  };

  return { count, hasNewOrder, clearNewOrderIndicator };
}
