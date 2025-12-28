import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Package, 
  Megaphone, 
  ShoppingBag, 
  Sparkles,
  Send,
  Loader2,
  Clock,
  Calendar,
  CalendarClock,
  Tag,
  Zap,
  Gift,
  Truck,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, isFuture } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  image_url: string | null;
  link: string | null;
  is_global: boolean;
  is_sent: boolean;
  scheduled_at: string | null;
  created_at: string;
}

const notificationTypes = [
  { value: 'info', label: 'General Info', icon: Megaphone },
  { value: 'product', label: 'New Product', icon: Package },
  { value: 'order', label: 'Order Update', icon: ShoppingBag },
  { value: 'promo', label: 'Promotion', icon: Sparkles },
];

const notificationTemplates = [
  { 
    id: 'flash-sale', 
    name: 'Flash Sale', 
    icon: Zap,
    type: 'promo',
    title: '⚡ Flash Sale - Limited Time!',
    message: 'Hurry! Get up to 50% off on selected items. Sale ends tonight!',
    link: '/sales'
  },
  { 
    id: 'new-arrivals', 
    name: 'New Arrivals', 
    icon: Star,
    type: 'product',
    title: '✨ New Collection Just Dropped!',
    message: 'Check out our latest arrivals. Fresh styles for the new season!',
    link: '/shop'
  },
  { 
    id: 'free-shipping', 
    name: 'Free Shipping', 
    icon: Truck,
    type: 'promo',
    title: '🚚 Free Shipping This Weekend!',
    message: 'Enjoy free delivery on all orders. No minimum purchase required!',
    link: '/shop'
  },
  { 
    id: 'discount-code', 
    name: 'Discount Code', 
    icon: Tag,
    type: 'promo',
    title: '🎫 Exclusive Discount Code Inside!',
    message: 'Use code SAVE20 to get 20% off your next order. Limited time offer!',
    link: '/shop'
  },
  { 
    id: 'seasonal-sale', 
    name: 'Seasonal Sale', 
    icon: Gift,
    type: 'promo',
    title: '🎉 Seasonal Clearance Sale!',
    message: 'Massive discounts on seasonal items. Shop now before stock runs out!',
    link: '/sales'
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sent');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    link: '',
    is_global: true,
    scheduleEnabled: false,
    scheduledDate: '',
    scheduledTime: '',
  });

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const sentNotifications = notifications.filter(n => n.is_sent);
  const scheduledNotifications = notifications.filter(n => !n.is_sent && n.scheduled_at);

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in title and message.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.scheduleEnabled && (!formData.scheduledDate || !formData.scheduledTime)) {
      toast({
        title: 'Schedule required',
        description: 'Please select a date and time for the scheduled notification.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    let scheduledAt: string | null = null;
    let isSent = true;

    if (formData.scheduleEnabled && formData.scheduledDate && formData.scheduledTime) {
      scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      isSent = false;
    }

    const { error } = await supabase.from('notifications').insert({
      title: formData.title,
      message: formData.message,
      type: formData.type,
      link: formData.link || null,
      is_global: formData.is_global,
      user_id: null,
      scheduled_at: scheduledAt,
      is_sent: isSent,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send notification.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: formData.scheduleEnabled ? 'Notification scheduled!' : 'Notification sent!',
        description: formData.scheduleEnabled 
          ? `Will be sent on ${format(new Date(scheduledAt!), 'PPp')}`
          : 'All users will receive this notification.',
      });
      setDialogOpen(false);
      setFormData({ 
        title: '', 
        message: '', 
        type: 'info', 
        link: '', 
        is_global: true,
        scheduleEnabled: false,
        scheduledDate: '',
        scheduledTime: '',
      });
      fetchNotifications();
      if (formData.scheduleEnabled) {
        setActiveTab('scheduled');
      }
    }
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({ title: 'Notification deleted' });
    }
  };

  const handleSendNow = async (notification: Notification) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_sent: true, scheduled_at: null })
      .eq('id', notification.id);

    if (!error) {
      toast({ title: 'Notification sent!' });
      fetchNotifications();
    }
  };

  const getTypeIcon = (type: string) => {
    const found = notificationTypes.find(t => t.value === type);
    return found ? <found.icon className="h-4 w-4" /> : <Bell className="h-4 w-4" />;
  };

  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Send and schedule notifications to customers</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Notification</DialogTitle>
              <DialogDescription>
                Send immediately or schedule for later delivery.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Quick Templates */}
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {notificationTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setFormData(p => ({
                        ...p,
                        title: template.title,
                        message: template.message,
                        type: template.type,
                        link: template.link,
                      }))}
                      className="flex items-center gap-2 p-2 text-xs border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <template.icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{template.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Notification Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <t.icon className="h-4 w-4" />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., New Collection Arrived!"
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your notification message..."
                    value={formData.message}
                    onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link">Link (Optional)</Label>
                <Input
                  id="link"
                  placeholder="e.g., /shop or /product/123"
                  value={formData.link}
                  onChange={(e) => setFormData(p => ({ ...p, link: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Send to all users</Label>
                  <p className="text-xs text-muted-foreground">Global notification visible to everyone</p>
                </div>
                <Switch
                  checked={formData.is_global}
                  onCheckedChange={(v) => setFormData(p => ({ ...p, is_global: v }))}
                />
              </div>

              {/* Schedule Section */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>Schedule for later</Label>
                      <p className="text-xs text-muted-foreground">Send at a specific date and time</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.scheduleEnabled}
                    onCheckedChange={(v) => setFormData(p => ({ ...p, scheduleEnabled: v }))}
                  />
                </div>

                {formData.scheduleEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledDate" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Date
                      </Label>
                      <Input
                        id="scheduledDate"
                        type="date"
                        value={formData.scheduledDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormData(p => ({ ...p, scheduledDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Time
                      </Label>
                      <Input
                        id="scheduledTime"
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData(p => ({ ...p, scheduledTime: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending} className="gap-2">
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : formData.scheduleEnabled ? (
                  <CalendarClock className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {formData.scheduleEnabled ? 'Schedule' : 'Send Now'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for Sent and Scheduled */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Sent ({sentNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            Scheduled ({scheduledNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sent Notifications</CardTitle>
              <CardDescription>View and manage sent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sentNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No notifications sent yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.type === 'promo' ? 'bg-purple-500/10 text-purple-500' :
                        notification.type === 'product' ? 'bg-green-500/10 text-green-500' :
                        notification.type === 'order' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{notification.title}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                            {notification.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(notification.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Notifications</CardTitle>
              <CardDescription>Notifications waiting to be sent</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : scheduledNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No scheduled notifications</p>
                  <p className="text-xs mt-1">Schedule a notification to see it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.type === 'promo' ? 'bg-purple-500/10 text-purple-500' :
                        notification.type === 'product' ? 'bg-green-500/10 text-green-500' :
                        notification.type === 'order' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">{notification.title}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                            {notification.type}
                          </span>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {notification.scheduled_at && format(new Date(notification.scheduled_at), 'PPp')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {notification.scheduled_at && isFuture(new Date(notification.scheduled_at)) 
                            ? `Sends ${formatDistanceToNow(new Date(notification.scheduled_at), { addSuffix: true })}`
                            : 'Processing...'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendNow(notification)}
                          className="gap-1"
                        >
                          <Send className="h-3 w-3" />
                          Send Now
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(notification.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
