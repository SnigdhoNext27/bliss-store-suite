import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Package, Megaphone, ShoppingBag, Sparkles, Volume2, VolumeX, Trash2, Settings, ChevronLeft, Mail, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'product' | 'order' | 'promo';
  image_url: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationPreferences {
  info: boolean;
  product: boolean;
  order: boolean;
  promo: boolean;
}

interface ExtendedPreferences extends NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
}

const notificationIcons: Record<string, React.ReactNode> = {
  info: <Megaphone className="h-4 w-4" />,
  product: <Package className="h-4 w-4" />,
  order: <ShoppingBag className="h-4 w-4" />,
  promo: <Sparkles className="h-4 w-4" />,
};

const notificationColors: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-500',
  product: 'bg-green-500/10 text-green-500',
  order: 'bg-orange-500/10 text-orange-500',
  promo: 'bg-purple-500/10 text-purple-500',
};

const notificationLabels: Record<string, string> = {
  info: 'General Announcements',
  product: 'New Products',
  order: 'Order Updates',
  promo: 'Promotions & Sales',
};

// Local storage keys
const READ_NOTIFICATIONS_KEY = 'alman_read_notifications';
const NOTIFICATION_PREFS_KEY = 'alman_notification_prefs';

const defaultPreferences: ExtendedPreferences = {
  info: true,
  product: true,
  order: true,
  promo: true,
  pushEnabled: false,
  emailEnabled: true,
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [preferences, setPreferences] = useState<ExtendedPreferences>(defaultPreferences);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isSupported: pushSupported, permission: pushPermission, requestPermission: requestPushPermission, showNotification: showPushNotification } = usePushNotifications();

  // Load preferences from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (stored) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
      }
    } catch {
      // Use defaults
    }
  }, []);

  // Save preferences to local storage
  const savePreferences = useCallback((newPrefs: ExtendedPreferences) => {
    setPreferences(newPrefs);
    try {
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(newPrefs));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const togglePreference = (type: keyof ExtendedPreferences) => {
    const newPrefs = { ...preferences, [type]: !preferences[type] };
    savePreferences(newPrefs);
  };

  // Get locally read notification IDs (for guests)
  const getLocalReadIds = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Save locally read notification IDs
  const saveLocalReadIds = useCallback((ids: string[]) => {
    try {
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(ids));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Create audio context lazily
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Pleasant chime sound
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1108, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      // Audio not supported
    }
  }, [soundEnabled]);

  // Cleanup audio context
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Filter notifications based on preferences
  const filteredNotifications = notifications.filter(n => preferences[n.type as keyof NotificationPreferences] !== false);

  // Calculate unread count considering local storage for guests and preferences
  const calculateUnreadCount = useCallback((notifs: Notification[]) => {
    const localReadIds = getLocalReadIds();
    return notifs
      .filter(n => preferences[n.type as keyof NotificationPreferences] !== false)
      .filter(n => !n.is_read && !localReadIds.includes(n.id)).length;
  }, [getLocalReadIds, preferences]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data as Notification[]);
      setUnreadCount(calculateUnreadCount(data as Notification[]));
    }
  }, [calculateUnreadCount]);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Check if this notification type is enabled
          const typeKey = newNotification.type as keyof NotificationPreferences;
          if (preferences[typeKey] === false) {
            return; // Skip if this type is disabled
          }
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          playNotificationSound();
          
          // Show browser push notification if enabled
          if (preferences.pushEnabled && pushPermission === 'granted') {
            showPushNotification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.jpg',
              data: { url: newNotification.link || '/' },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, playNotificationSound, preferences, pushPermission, showPushNotification]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    // Update local state immediately
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Save to local storage for guests
    const localReadIds = getLocalReadIds();
    if (!localReadIds.includes(id)) {
      saveLocalReadIds([...localReadIds, id]);
    }

    // If logged in, also update in database
    if (user) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

    // Update local state immediately
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    // Save all to local storage
    const localReadIds = getLocalReadIds();
    const newReadIds = [...new Set([...localReadIds, ...unreadIds])];
    saveLocalReadIds(newReadIds);

    // If logged in, also update in database
    if (user) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
    }
  };

  const clearAllNotifications = async () => {
    // Clear local state immediately
    setNotifications([]);
    setUnreadCount(0);
    
    // Clear local storage
    saveLocalReadIds([]);
    
    // If logged in as admin, delete from database
    if (user) {
      await supabase
        .from('notifications')
        .delete()
        .eq('is_global', true);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    
    if (notification.link) {
      // Check if it's an internal link (starts with /) or external
      if (notification.link.startsWith('/')) {
        navigate(notification.link);
      } else if (notification.link.startsWith('http')) {
        window.open(notification.link, '_blank');
      } else {
        // Treat as internal link
        navigate(`/${notification.link}`);
      }
    } else {
      // Default navigation based on notification type
      switch (notification.type) {
        case 'promo':
          navigate('/sales');
          break;
        case 'product':
          navigate('/shop');
          break;
        case 'order':
          navigate('/account');
          break;
        default:
          navigate('/shop');
          break;
      }
    }
  };

  // Check if notification is read (considering local storage)
  const isNotificationRead = (notification: Notification): boolean => {
    if (notification.is_read) return true;
    const localReadIds = getLocalReadIds();
    return localReadIds.includes(notification.id);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={() => {
          // Clear badge when opening (store all current notification IDs as "seen")
          if (!isOpen && unreadCount > 0) {
            const allIds = notifications.map(n => n.id);
            const localReadIds = getLocalReadIds();
            const newReadIds = [...new Set([...localReadIds, ...allIds])];
            saveLocalReadIds(newReadIds);
            setUnreadCount(0);
          }
          setIsOpen(!isOpen);
        }}
        className="relative"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-16 md:top-full md:mt-2 md:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-[80vh] md:max-h-none"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  {showSettings ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -ml-2"
                      onClick={() => setShowSettings(false)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <h3 className="font-semibold text-foreground">
                    {showSettings ? 'Preferences' : 'Notifications'}
                  </h3>
                  {!showSettings && unreadCount > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!showSettings && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
                      >
                        {soundEnabled ? (
                          <Volume2 className="h-4 w-4" />
                        ) : (
                          <VolumeX className="h-4 w-4 opacity-50" />
                        )}
                      </Button>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="text-xs text-primary h-8"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark all read
                        </Button>
                      )}
                      {filteredNotifications.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={clearAllNotifications}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Clear all notifications"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowSettings(true)}
                        title="Notification preferences"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Settings View */}
              {showSettings ? (
                <ScrollArea className="h-[400px] md:h-[400px]">
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose which types of notifications you want to receive:
                    </p>
                    {(Object.keys(notificationLabels) as Array<keyof NotificationPreferences>).map((type) => (
                      <div key={type} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notificationColors[type]}`}>
                            {notificationIcons[type]}
                          </div>
                          <Label htmlFor={`pref-${type}`} className="text-sm font-medium cursor-pointer">
                            {notificationLabels[type]}
                          </Label>
                        </div>
                        <Switch
                          id={`pref-${type}`}
                          checked={preferences[type]}
                          onCheckedChange={() => togglePreference(type)}
                        />
                      </div>
                    ))}
                    
                    {/* Delivery Methods */}
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                        Delivery Methods
                      </p>
                      
                      {/* Push Notifications */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                            <BellRing className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <Label htmlFor="push-pref" className="text-sm font-medium cursor-pointer block">
                              Browser Notifications
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {!pushSupported 
                                ? 'Not supported in this browser' 
                                : pushPermission === 'denied'
                                  ? 'Blocked by browser'
                                  : 'Get notified even when app is closed'}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="push-pref"
                          checked={preferences.pushEnabled && pushPermission === 'granted'}
                          disabled={!pushSupported || pushPermission === 'denied'}
                          onCheckedChange={async (checked) => {
                            if (checked && pushPermission !== 'granted') {
                              const granted = await requestPushPermission();
                              if (granted) {
                                togglePreference('pushEnabled');
                              }
                            } else {
                              togglePreference('pushEnabled');
                            }
                          }}
                        />
                      </div>

                      {/* Email Notifications */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-500/10">
                            <Mail className="h-4 w-4 text-orange-500" />
                          </div>
                          <div>
                            <Label htmlFor="email-pref" className="text-sm font-medium cursor-pointer block">
                              Email Notifications
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Receive sale alerts and updates via email
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="email-pref"
                          checked={preferences.emailEnabled}
                          onCheckedChange={() => togglePreference('emailEnabled')}
                        />
                      </div>

                      {/* Sound */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                            <Volume2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Label htmlFor="sound-pref" className="text-sm font-medium cursor-pointer">
                            Notification sounds
                          </Label>
                        </div>
                        <Switch
                          id="sound-pref"
                          checked={soundEnabled}
                          onCheckedChange={setSoundEnabled}
                        />
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                /* Notifications List */
                <ScrollArea className="h-[400px] md:h-[400px]">
                  {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Bell className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredNotifications.map((notification) => {
                        const isRead = isNotificationRead(notification);
                        return (
                          <motion.button
                            key={notification.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                              !isRead ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              {/* Icon */}
                              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                notificationColors[notification.type] || notificationColors.info
                              }`}>
                                {notificationIcons[notification.type] || notificationIcons.info}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm font-medium line-clamp-1 ${
                                    !isRead ? 'text-foreground' : 'text-muted-foreground'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  {!isRead && (
                                    <span className="shrink-0 w-2 h-2 bg-primary rounded-full mt-1.5" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                  {notification.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground/70 mt-1">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
