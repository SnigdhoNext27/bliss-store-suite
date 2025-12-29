import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// A proper notification beep sound (base64 encoded WAV)
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRl9vT19teleQAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU91T1+' + 
'9AAAA/v7+/f39/Pz89/f39/f3+Pj4+fn5+vr6+/v7/Pz8/f39/v7+////AAAB' +
'AQECAgIDAwMEBAQFBQUGBgYHBwcICAgJCQkKCgoLCwsMDAwNDQ0ODg4PDw8Q' +
'EBARERESEhITExMUFBQVFRUWFhYXFxcYGBgZGRkaGhobGxscHBwdHR0eHh4f' +
'Hx8gICAhISEiIiIjIyMkJCQlJSUmJiYnJycoKCgpKSkqKiorKyssLCwtLS0u' +
'Li4vLy8wMDAxMTEyMjIzMzM0NDQ1NTU2NjY3Nzc4ODg5OTk6Ojo7Ozs8PDw9' +
'PT0+Pj4/Pz9AQEBBQUFCQkJDQ0NERERFRUVGRkZHR0dISEhJSUlKSkpLS0tM' +
'TExNTU1OTk5PT09QUFBRUVFSUlJTU1NUVFRVVVVWVlZXV1dYWFhZWVlaWlpb' +
'W1tcXFxdXV1eXl5fX19gYGBhYWFiYmJjY2NkZGRlZWVmZmZnZ2doaGhpaWlq' +
'ampra2tsbGxtbW1ubm5vb29wcHBxcXFycnJzc3N0dHR1dXV2dnZ3d3d4eHh5' +
'eXl6enp7e3t8fHx9fX1+fn5/f3+AgICBgYGCgoKDg4OEhISFhYWGhoaHh4eI' +
'iIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaX' +
'l5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWm' +
'pqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1' +
'tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PE' +
'xMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT' +
'09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4ODh4eHi';

export function useOrderNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 0.5;
    
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
          const orderId = payload.new.id as string;
          
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

  const playNotificationSound = useCallback(() => {
    // Try to play audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log('Audio play blocked by browser:', err.message);
      });
    }
    
    // Try browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🛒 New Order Received!', {
        body: 'A new order has been placed on your store.',
        icon: '/favicon.png',
        tag: 'new-order',
      });
    }
  }, []);

  // Request notification permission on user interaction
  const requestPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Pre-load audio to enable playback after user interaction
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, []);

  return { requestPermission, playNotificationSound };
}
