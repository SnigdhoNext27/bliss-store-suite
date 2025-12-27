import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  tagline: string;
  slogan: string;
  delivery_fee_dhaka: string;
  delivery_fee_outside: string;
  business_email: string;
  business_phone: string;
  social_facebook: string;
  social_instagram: string;
  social_whatsapp: string;
}

const defaultSettings: SiteSettings = {
  tagline: 'Timeless Style 2025',
  slogan: 'Where your vibes meet our vision',
  delivery_fee_dhaka: '60',
  delivery_fee_outside: '120',
  business_email: 'rijvialomrafa@gmail.com',
  business_phone: '+8801930278877',
  social_facebook: 'https://www.facebook.com/profile.php?id=61584375982557',
  social_instagram: 'https://www.instagram.com/almans.bd',
  social_whatsapp: '8801930278877',
};

async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*');

  if (error) throw error;

  if (data && data.length > 0) {
    const settingsMap: Record<string, string> = {};
    data.forEach((item: { key: string; value: string | null }) => {
      settingsMap[item.key] = item.value || defaultSettings[item.key as keyof SiteSettings] || '';
    });
    return { ...defaultSettings, ...settingsMap };
  }

  return defaultSettings;
}

export function useSiteSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading: loading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSiteSettings,
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    initialData: defaultSettings,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('site-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
        },
        () => {
          // Invalidate and refetch when any setting changes
          queryClient.invalidateQueries({ queryKey: ['site-settings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { settings: settings || defaultSettings, loading };
}