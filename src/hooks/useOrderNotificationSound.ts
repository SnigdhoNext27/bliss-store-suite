import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useOrderNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Create audio element with a notification sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQAAACAAAABtdHJrAAAAEAD/UQMDrYAADQD/LwBNVHJrAAAAHAD/IQEAAACQPHqBgJA8AIAFAAA/AIAH/y8A');
    
    // Subscribe to new orders
    const channel = supabase
      .channel('order-sound-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const orderId = payload.new.id;
          
          // Prevent duplicate sounds for the same order
          if (!hasPlayedRef.current.has(orderId)) {
            hasPlayedRef.current.add(orderId);
            playNotificationSound();
            
            // Clean up old order IDs to prevent memory leak
            if (hasPlayedRef.current.size > 100) {
              const entries = Array.from(hasPlayedRef.current);
              entries.slice(0, 50).forEach(id => hasPlayedRef.current.delete(id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log('Audio play failed:', err);
      });
    }
    
    // Also try to show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Order Received!', {
        body: 'A new order has been placed.',
        icon: '/favicon.ico',
      });
    }
  };

  // Request notification permission on first interaction
  const requestPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return { requestPermission };
}
