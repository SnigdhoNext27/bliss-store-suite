import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  ShoppingCart, 
  Package, 
  RefreshCw, 
  UserPlus,
  Loader2,
  Settings,
  Mail,
  Bell,
  Clock,
  Save,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Trigger {
  id: string;
  trigger_type: string;
  is_active: boolean;
  delay_minutes: number;
  title_template: string;
  message_template: string;
  send_email: boolean;
  send_push: boolean;
}

const triggerIcons: Record<string, typeof Zap> = {
  abandoned_cart: ShoppingCart,
  order_status: Package,
  restock: RefreshCw,
  welcome: UserPlus,
};

const triggerLabels: Record<string, string> = {
  abandoned_cart: 'Abandoned Cart Reminder',
  order_status: 'Order Status Update',
  restock: 'Restock Alert',
  welcome: 'Welcome Message',
};

const triggerDescriptions: Record<string, string> = {
  abandoned_cart: 'Send reminders to users who left items in their cart',
  order_status: 'Notify users when their order status changes',
  restock: 'Alert users when products they wanted are back in stock',
  welcome: 'Send a welcome message to new users after signup',
};

export function AutomatedTriggersCard() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const fetchTriggers = async () => {
    const { data, error } = await supabase
      .from('notification_triggers')
      .select('*')
      .order('created_at');

    if (!error && data) {
      setTriggers(data as Trigger[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTriggers();
  }, []);

  const handleToggle = async (trigger: Trigger, field: keyof Trigger, value: boolean) => {
    setSaving(trigger.id);
    
    const { error } = await supabase
      .from('notification_triggers')
      .update({ [field]: value })
      .eq('id', trigger.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update trigger.',
        variant: 'destructive',
      });
    } else {
      setTriggers(prev => prev.map(t => 
        t.id === trigger.id ? { ...t, [field]: value } : t
      ));
    }
    setSaving(null);
  };

  const handleUpdate = async (trigger: Trigger, updates: Partial<Trigger>) => {
    setSaving(trigger.id);

    const { error } = await supabase
      .from('notification_triggers')
      .update(updates)
      .eq('id', trigger.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save changes.',
        variant: 'destructive',
      });
    } else {
      setTriggers(prev => prev.map(t => 
        t.id === trigger.id ? { ...t, ...updates } : t
      ));
      toast({ title: 'Trigger updated' });
    }
    setSaving(null);
  };

  const runTriggers = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-notification-triggers');
      
      if (error) throw error;

      toast({
        title: 'Triggers processed',
        description: `Sent ${data.results?.abandoned_carts || 0} cart reminders, ${data.results?.restock_alerts || 0} restock alerts.`,
      });
    } catch (error) {
      console.error('Error running triggers:', error);
      toast({
        title: 'Error',
        description: 'Failed to run triggers.',
        variant: 'destructive',
      });
    }
    setRunning(false);
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automated Triggers
          </CardTitle>
          <CardDescription>
            Configure automatic notifications based on user actions
          </CardDescription>
        </div>
        <Button onClick={runTriggers} disabled={running} size="sm" className="gap-2">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Now
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {triggers.map((trigger, index) => {
          const Icon = triggerIcons[trigger.trigger_type] || Zap;
          
          return (
            <motion.div
              key={trigger.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-border rounded-lg p-4 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    trigger.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{triggerLabels[trigger.trigger_type]}</h4>
                      <Badge variant={trigger.is_active ? 'default' : 'secondary'}>
                        {trigger.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {triggerDescriptions[trigger.trigger_type]}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={trigger.is_active}
                  onCheckedChange={(v) => handleToggle(trigger, 'is_active', v)}
                  disabled={saving === trigger.id}
                />
              </div>

              {trigger.is_active && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title Template</Label>
                      <Input
                        value={trigger.title_template}
                        onChange={(e) => setTriggers(prev => prev.map(t => 
                          t.id === trigger.id ? { ...t, title_template: e.target.value } : t
                        ))}
                        onBlur={() => handleUpdate(trigger, { title_template: trigger.title_template })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Delay (minutes)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={trigger.delay_minutes}
                        onChange={(e) => setTriggers(prev => prev.map(t => 
                          t.id === trigger.id ? { ...t, delay_minutes: parseInt(e.target.value) || 0 } : t
                        ))}
                        onBlur={() => handleUpdate(trigger, { delay_minutes: trigger.delay_minutes })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Message Template</Label>
                    <Textarea
                      value={trigger.message_template}
                      onChange={(e) => setTriggers(prev => prev.map(t => 
                        t.id === trigger.id ? { ...t, message_template: e.target.value } : t
                      ))}
                      onBlur={() => handleUpdate(trigger, { message_template: trigger.message_template })}
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{{variable}}'} for dynamic content like {'{{order_number}}'}, {'{{product_name}}'}, {'{{status}}'}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${trigger.id}-email`}
                        checked={trigger.send_email}
                        onCheckedChange={(v) => handleToggle(trigger, 'send_email', v)}
                        disabled={saving === trigger.id}
                      />
                      <Label htmlFor={`${trigger.id}-email`} className="flex items-center gap-1 cursor-pointer">
                        <Mail className="h-3 w-3" />
                        Send Email
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${trigger.id}-push`}
                        checked={trigger.send_push}
                        onCheckedChange={(v) => handleToggle(trigger, 'send_push', v)}
                        disabled={saving === trigger.id}
                      />
                      <Label htmlFor={`${trigger.id}-push`} className="flex items-center gap-1 cursor-pointer">
                        <Bell className="h-3 w-3" />
                        Push Notification
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
