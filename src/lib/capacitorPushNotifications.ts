import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// Check if we're running on a native platform
const isNativePlatform = Capacitor.isNativePlatform();

interface PushNotificationCallbacks {
  onRegistration?: (token: string) => void;
  onRegistrationError?: (error: any) => void;
  onNotificationReceived?: (notification: PushNotificationSchema) => void;
  onNotificationActionPerformed?: (notification: ActionPerformed) => void;
}

class CapacitorPushNotificationService {
  private isInitialized = false;
  private callbacks: PushNotificationCallbacks = {};

  async initialize(callbacks: PushNotificationCallbacks = {}): Promise<boolean> {
    if (!isNativePlatform) {
      console.log('Push notifications are only available on native platforms');
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    this.callbacks = callbacks;

    try {
      // Request permission
      const permissionStatus = await PushNotifications.requestPermissions();
      
      if (permissionStatus.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return false;
      }

      // Register with Apple / Google for push notifications
      await PushNotifications.register();

      // Set up listeners
      this.setupListeners();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  private setupListeners(): void {
    // On successful registration
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      this.callbacks.onRegistration?.(token.value);
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
      this.callbacks.onRegistrationError?.(error);
    });

    // When a notification is received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      this.callbacks.onNotificationReceived?.(notification);
    });

    // When user taps on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed:', notification);
      this.callbacks.onNotificationActionPerformed?.(notification);
    });
  }

  async getDeliveredNotifications(): Promise<PushNotificationSchema[]> {
    if (!isNativePlatform) return [];
    
    const { notifications } = await PushNotifications.getDeliveredNotifications();
    return notifications;
  }

  async removeDeliveredNotifications(ids: string[]): Promise<void> {
    if (!isNativePlatform) return;
    
    const { notifications } = await PushNotifications.getDeliveredNotifications();
    const notificationsToRemove = notifications.filter(n => ids.includes(n.id));
    if (notificationsToRemove.length > 0) {
      await PushNotifications.removeDeliveredNotifications({ notifications: notificationsToRemove });
    }
  }

  async removeAllDeliveredNotifications(): Promise<void> {
    if (!isNativePlatform) return;
    
    await PushNotifications.removeAllDeliveredNotifications();
  }

  isAvailable(): boolean {
    return isNativePlatform;
  }
}

export const capacitorPushService = new CapacitorPushNotificationService();
