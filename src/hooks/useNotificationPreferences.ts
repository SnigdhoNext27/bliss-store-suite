import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  order_updates: boolean;
  promotions: boolean;
  new_products: boolean;
  restock_alerts: boolean;
  abandoned_cart: boolean;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: true,
  email_enabled: true,
  order_updates: true,
  promotions: true,
  new_products: true,
  restock_alerts: true,
  abandoned_cart: true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching preferences:', error);
    } else if (data) {
      setPreferences({
        push_enabled: data.push_enabled ?? true,
        email_enabled: data.email_enabled ?? true,
        order_updates: data.order_updates ?? true,
        promotions: data.promotions ?? true,
        new_products: data.new_products ?? true,
        restock_alerts: data.restock_alerts ?? true,
        abandoned_cart: data.abandoned_cart ?? true,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!user) return false;

    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...newPreferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error updating preferences:', error);
      setPreferences(preferences);
      return false;
    }

    return true;
  }, [user, preferences]);

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
