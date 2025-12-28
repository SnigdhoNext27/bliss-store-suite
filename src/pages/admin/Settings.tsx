import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Store, Truck, Bell, Share2, Flame, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logAdminAction } from '@/lib/auditLog';

interface Settings {
  tagline: string;
  slogan: string;
  delivery_fee_dhaka: string;
  delivery_fee_outside: string;
  business_email: string;
  business_phone: string;
  whatsapp_notification_phone: string;
  social_facebook: string;
  social_instagram: string;
  social_whatsapp: string;
  flash_sale_enabled: string;
  flash_sale_discount: string;
  flash_sale_end_date: string;
  banner_theme: string;
  banner_animation: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    tagline: 'Timeless Style 2025',
    slogan: 'Where your vibes meet our vision',
    delivery_fee_dhaka: '60',
    delivery_fee_outside: '120',
    business_email: 'rijvialomrafa@gmail.com',
    business_phone: '+8801930278877',
    whatsapp_notification_phone: '+8801930278877',
    social_facebook: '',
    social_instagram: '',
    social_whatsapp: '',
    flash_sale_enabled: 'true',
    flash_sale_discount: '50',
    flash_sale_end_date: '',
    banner_theme: 'default',
    banner_animation: 'shimmer',
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

      await logAdminAction({ action: 'update', entityType: 'settings', details: { updated_keys: Object.keys(settings) } });
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

      {/* Flash Sale Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border p-6 space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Flame className="h-5 w-5 text-destructive" />
          <h2 className="font-display text-xl font-semibold">Flash Sale</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Flash Sale Banner</Label>
              <p className="text-xs text-muted-foreground">Show the flash sale banner on the shop page</p>
            </div>
            <Switch
              checked={settings.flash_sale_enabled === 'true'}
              onCheckedChange={(checked) => setSettings({ ...settings, flash_sale_enabled: checked ? 'true' : 'false' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount">Discount Percentage (%)</Label>
              <Input
                id="discount"
                type="number"
                min="1"
                max="100"
                value={settings.flash_sale_discount}
                onChange={(e) => setSettings({ ...settings, flash_sale_discount: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end_date">Sale End Date & Time</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={settings.flash_sale_end_date ? settings.flash_sale_end_date.slice(0, 16) : ''}
                onChange={(e) => setSettings({ ...settings, flash_sale_end_date: new Date(e.target.value).toISOString() })}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Banner Customization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-xl border border-border p-6 space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Banner Appearance</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="banner_theme">Color Theme</Label>
            <Select
              value={settings.banner_theme}
              onValueChange={(value) => setSettings({ ...settings, banner_theme: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-primary to-almans-brown-dark" />
                    Default (Brown/Gold)
                  </div>
                </SelectItem>
                <SelectItem value="fire">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500" />
                    Fire (Red/Orange)
                  </div>
                </SelectItem>
                <SelectItem value="ocean">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                    Ocean (Blue/Cyan)
                  </div>
                </SelectItem>
                <SelectItem value="midnight">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600" />
                    Midnight (Purple)
                  </div>
                </SelectItem>
                <SelectItem value="forest">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-600 to-emerald-500" />
                    Forest (Green)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="banner_animation">Animation Style</Label>
            <Select
              value={settings.banner_animation}
              onValueChange={(value) => setSettings({ ...settings, banner_animation: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select animation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shimmer">Shimmer (Moving gradient)</SelectItem>
                <SelectItem value="pulse">Pulse (Breathing effect)</SelectItem>
                <SelectItem value="glow">Glow (Subtle glow)</SelectItem>
                <SelectItem value="none">None (Static)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

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
            <Label htmlFor="phone">Business Phone (displayed to customers)</Label>
            <Input
              id="phone"
              value={settings.business_phone}
              onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
              placeholder="+8801930278877"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This phone number is shown to customers on the website
            </p>
          </div>
          <div>
            <Label htmlFor="whatsapp_notification">WhatsApp Notification Number (for admin alerts)</Label>
            <Input
              id="whatsapp_notification"
              value={settings.whatsapp_notification_phone}
              onChange={(e) => setSettings({ ...settings, whatsapp_notification_phone: e.target.value })}
              placeholder="+8801930278877"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              New order notifications will be sent to this WhatsApp number. Include country code (e.g., 8801XXXXXXXXX)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Social Media Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border p-6 space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Social Media Links</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-4">
          These links appear in the "Follow us" section of your website header
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="social_facebook">Facebook Page URL</Label>
            <Input
              id="social_facebook"
              value={settings.social_facebook}
              onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
              placeholder="https://www.facebook.com/yourpage"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="social_instagram">Instagram Profile URL</Label>
            <Input
              id="social_instagram"
              value={settings.social_instagram}
              onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
              placeholder="https://www.instagram.com/yourprofile"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="social_whatsapp">WhatsApp Number (for Follow us link)</Label>
            <Input
              id="social_whatsapp"
              value={settings.social_whatsapp}
              onChange={(e) => setSettings({ ...settings, social_whatsapp: e.target.value })}
              placeholder="8801930278877"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter number without + sign. This is used in the "Follow us" section.
            </p>
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
