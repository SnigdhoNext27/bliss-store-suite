import { useEffect, useState, useCallback } from 'react';
import { capacitorPushService } from '@/lib/capacitorPushNotifications';
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface UseCapacitorPushNotificationsOptions {
  autoInitialize?: boolean;
}

export function useCapacitorPushNotifications(options: UseCapacitorPushNotificationsOptions = {}) {
  const { autoInitialize = true } = options;
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRegistration = useCallback((token: string) => {
    setPushToken(token);
    console.log('Push token received:', token);
    // Here you could send the token to your backend to store it
  }, []);

  const handleRegistrationError = useCallback((err: any) => {
    setError(err?.message || 'Failed to register for push notifications');
    console.error('Push registration error:', err);
  }, []);

  const handleNotificationReceived = useCallback((notification: PushNotificationSchema) => {
    // Show a toast when notification is received in foreground
    toast({
      title: notification.title || 'New Notification',
      description: notification.body || '',
    });
  }, [toast]);

  const handleNotificationAction = useCallback((action: ActionPerformed) => {
    // Handle notification tap - navigate based on notification data
    const data = action.notification.data;
    
    if (data?.link) {
      // If notification has a link, navigate to it
      navigate(data.link);
    } else if (data?.orderId) {
      // If it's an order notification, go to order tracking
      navigate(`/order-tracking?id=${data.orderId}`);
    } else if (data?.productId) {
      // If it's a product notification, go to product detail
      navigate(`/product/${data.productId}`);
    }
  }, [navigate]);

  const initialize = useCallback(async () => {
    if (!capacitorPushService.isAvailable()) {
      console.log('Push notifications not available on this platform');
      return false;
    }

    const success = await capacitorPushService.initialize({
      onRegistration: handleRegistration,
      onRegistrationError: handleRegistrationError,
      onNotificationReceived: handleNotificationReceived,
      onNotificationActionPerformed: handleNotificationAction,
    });

    setIsInitialized(success);
    return success;
  }, [handleRegistration, handleRegistrationError, handleNotificationReceived, handleNotificationAction]);

  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }
  }, [autoInitialize, initialize]);

  return {
    isInitialized,
    pushToken,
    error,
    isAvailable: capacitorPushService.isAvailable(),
    initialize,
    getDeliveredNotifications: capacitorPushService.getDeliveredNotifications.bind(capacitorPushService),
    removeDeliveredNotifications: capacitorPushService.removeDeliveredNotifications.bind(capacitorPushService),
    removeAllDeliveredNotifications: capacitorPushService.removeAllDeliveredNotifications.bind(capacitorPushService),
  };
}
