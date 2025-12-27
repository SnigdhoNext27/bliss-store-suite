import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  tagline: string;
  slogan: string;
  delivery_fee_dhaka: string;
  delivery_fee_outside: string;
  business_email: string;
  business_phone: string;
}

const defaultSettings: SiteSettings = {
  tagline: 'Timeless Style 2025',
  slogan: 'Where your vibes meet our vision',
  delivery_fee_dhaka: '60',
  delivery_fee_outside: '120',
  business_email: 'rijvialomrafa@gmail.com',
  business_phone: '+8801930278877',
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*');

        if (error) throw error;

        if (data && data.length > 0) {
          const settingsMap: Record<string, string> = {};
          data.forEach((item: { key: string; value: string | null }) => {
            settingsMap[item.key] = item.value || defaultSettings[item.key as keyof SiteSettings] || '';
          });
          setSettings(prev => ({ ...prev, ...settingsMap }));
        }
      } catch (error) {
        console.error('Fetch site settings error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading };
}
