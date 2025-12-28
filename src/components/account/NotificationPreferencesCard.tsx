import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Package, Tag, Sparkles, ShoppingCart, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useToast } from '@/hooks/use-toast';

export function NotificationPreferencesCard() {
  const { preferences, loading, updatePreferences } = useNotificationPreferences();
  const { isSubscribed, isSupported, permission, subscribe, unsubscribe } = usePushSubscription();
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    setUpdating(key);
    const success = await updatePreferences({ [key]: value });
    if (success) {
      toast({
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved.',
      });
    }
    setUpdating(null);
  };

  const handlePushToggle = async () => {
    setUpdating('push');
    if (isSubscribed) {
      await unsubscribe();
      await updatePreferences({ push_enabled: false });
    } else {
      const success = await subscribe();
      if (success) {
        await updatePreferences({ push_enabled: true });
        toast({
          title: 'Push notifications enabled',
          description: 'You will now receive push notifications.',
        });
      } else if (permission === 'denied') {
        toast({
          title: 'Notifications blocked',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const preferenceItems = [
    {
      key: 'order_updates' as const,
      label: 'Order Updates',
      description: 'Get notified about your order status',
      icon: Package,
    },
    {
      key: 'promotions' as const,
      label: 'Promotions & Sales',
      description: 'Receive special offers and discounts',
      icon: Tag,
    },
    {
      key: 'new_products' as const,
      label: 'New Products',
      description: 'Be the first to know about new arrivals',
      icon: Sparkles,
    },
    {
      key: 'restock_alerts' as const,
      label: 'Restock Alerts',
      description: 'Get notified when items are back in stock',
      icon: RefreshCw,
    },
    {
      key: 'abandoned_cart' as const,
      label: 'Cart Reminders',
      description: 'Reminder about items left in your cart',
      icon: ShoppingCart,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Methods */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">Delivery Methods</h4>
          
          {isSupported && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label className="font-medium">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    {permission === 'denied' 
                      ? 'Blocked in browser settings' 
                      : 'Receive notifications in your browser'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isSubscribed && preferences.push_enabled}
                onCheckedChange={handlePushToggle}
                disabled={updating === 'push' || permission === 'denied'}
              />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(v) => handleToggle('email_enabled', v)}
              disabled={updating === 'email_enabled'}
            />
          </motion.div>
        </div>

        {/* Notification Types */}
        <div className="space-y-4 border-t border-border pt-4">
          <h4 className="text-sm font-medium text-foreground">Notification Types</h4>
          
          {preferenceItems.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 2) }}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="font-medium">{item.label}</Label>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Switch
                checked={preferences[item.key]}
                onCheckedChange={(v) => handleToggle(item.key, v)}
                disabled={updating === item.key}
              />
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
