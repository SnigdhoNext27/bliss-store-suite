import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Store, Truck, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Settings {
  tagline: string;
  slogan: string;
  delivery_fee_dhaka: string;
  delivery_fee_outside: string;
  business_email: string;
  business_phone: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    tagline: 'Timeless Style 2025',
    slogan: 'Where your vibes meet our vision',
    delivery_fee_dhaka: '60',
    delivery_fee_outside: '120',
    business_email: 'rijvialomrafa@gmail.com',
    business_phone: '+8801930278877',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((item: { key: string; value: string | null }) => {
          settingsMap[item.key] = item.value || '';
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .upsert(update, { onConflict: 'key' });
        if (error) throw error;
      }

      toast({ title: 'Settings saved successfully' });
    } catch (error) {
      console.error('Save settings error:', error);
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your store settings</p>
      </div>

      {/* Store Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Store className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Store Branding</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tagline">Hero Tagline (e.g., "Timeless Style 2025")</Label>
            <Input
              id="tagline"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              placeholder="Timeless Style 2025"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Change the year or tagline displayed on the hero section
            </p>
          </div>

          <div>
            <Label htmlFor="slogan">Brand Slogan</Label>
            <Input
              id="slogan"
              value={settings.slogan}
              onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
              placeholder="Where your vibes meet our vision"
              className="mt-1"
            />
          </div>
        </div>
      </motion.div>

      {/* Delivery Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border p-6 space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Truck className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Delivery Fees</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dhaka">Inside Dhaka (৳)</Label>
            <Input
              id="dhaka"
              type="number"
              value={settings.delivery_fee_dhaka}
              onChange={(e) => setSettings({ ...settings, delivery_fee_dhaka: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="outside">Outside Dhaka (৳)</Label>
            <Input
              id="outside"
              type="number"
              value={settings.delivery_fee_outside}
              onChange={(e) => setSettings({ ...settings, delivery_fee_outside: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      </motion.div>

      {/* Contact Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border p-6 space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Contact & Notifications</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Business Email</Label>
            <Input
              id="email"
              type="email"
              value={settings.business_email}
              onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
              placeholder="orders@almans.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">Business Phone / WhatsApp</Label>
            <Input
              id="phone"
              value={settings.business_phone}
              onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
              placeholder="+8801930278877"
              className="mt-1"
            />
          </div>
        </div>
      </motion.div>

      <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
