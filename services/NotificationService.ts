export interface Notification {
  id: string;
  type: 'emergency_alert' | 'pickup_arrival' | 'home_arrival' | 'office_arrival' | 'journey_start' | 'route_delay' | 'safety_reminder' | 'weather_alert';
  title: string;
  message: string;
  data?: any;
  recipients: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  isRead: boolean;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface NotificationPreferences {
  userId: string;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  emergencyAlerts: boolean;
  safetyReminders: boolean;
  routeUpdates: boolean;
  arrivalNotifications: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;
  };
}

class NotificationServiceClass {
  private notifications: Notification[] = [];
  private preferences: Map<string, NotificationPreferences> = new Map();
  private pushSubscriptions: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    // Initialize push notification service
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async sendNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'deliveryStatus' | 'priority'>): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date(),
      isRead: false,
      deliveryStatus: 'pending',
      priority: this.determinePriority(notification.type)
    };

    this.notifications.push(newNotification);

    // Send to recipients
    await this.deliverNotification(newNotification);

    return newNotification;
  }

  async sendEmergencyAlert(userId: string, userName: string, alertType: string, location: any, message: string): Promise<void> {
    await this.sendNotification({
      type: 'emergency_alert',
      title: `🚨 EMERGENCY ALERT - ${alertType.toUpperCase()}`,
      message: `${userName}: ${message}`,
      data: {
        userId,
        userName,
        alertType,
        location,
        timestamp: new Date()
      },
      recipients: ['admins', 'emergency_contacts', 'drivers']
    });

    // Also send browser notification for immediate attention
    await this.sendBrowserNotification({
      title: '🚨 EMERGENCY ALERT',
      body: `${userName} needs immediate assistance`,
      icon: '/emergency-icon.png',
      badge: '/emergency-badge.png',
      tag: 'emergency',
      requireInteraction: true,
      actions: [
        { action: 'respond', title: 'Respond' },
        { action: 'call', title: 'Call Emergency' }
      ]
    });
  }

  async sendRouteDelayAlert(routeId: string, driverId: string, driverName: string, delay: number, reason: string): Promise<void> {
    await this.sendNotification({
      type: 'route_delay',
      title: 'Route Delay Alert',
      message: `${driverName} is running ${delay} minutes late. Reason: ${reason}`,
      data: {
        routeId,
        driverId,
        driverName,
        delay,
        reason,
        timestamp: new Date()
      },
      recipients: ['passengers', 'admins']
    });
  }

  async sendSafetyReminder(userId: string, userName: string, reminderType: 'check_in' | 'location_update' | 'arrival_confirmation'): Promise<void> {
    const messages = {
      check_in: 'Please confirm your safety status',
      location_update: 'Please update your current location',
      arrival_confirmation: 'Please confirm your safe arrival'
    };

    await this.sendNotification({
      type: 'safety_reminder',
      title: 'Safety Check-in Reminder',
      message: messages[reminderType],
      data: {
        userId,
        userName,
        reminderType,
        timestamp: new Date()
      },
      recipients: [userId]
    });

    // Send browser notification for better visibility
    await this.sendBrowserNotification({
      title: '🛡️ Safety Check-in',
      body: messages[reminderType],
      icon: '/safety-icon.png',
      tag: 'safety-reminder',
      requireInteraction: true
    });
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    try {
      // Send push notifications
      await this.sendPushNotifications(notification);
      
      // Send browser notifications for high priority
      if (notification.priority === 'critical' || notification.priority === 'high') {
        await this.sendBrowserNotification({
          title: notification.title,
          body: notification.message,
          icon: this.getNotificationIcon(notification.type),
          tag: notification.type,
          requireInteraction: notification.priority === 'critical'
        });
      }

      // Update delivery status
      notification.deliveryStatus = 'sent';
      
      // Log notification for debugging
      console.log(`📱 Notification sent: ${notification.title}`);
      
    } catch (error) {
      console.error('Failed to deliver notification:', error);
      notification.deliveryStatus = 'failed';
    }
  }

  private async sendPushNotifications(notification: Notification): Promise<void> {
    // In a real implementation, this would send to FCM/APNS
    // For now, we'll simulate push notification delivery
    
    for (const recipient of notification.recipients) {
      const subscription = this.pushSubscriptions.get(recipient);
      if (subscription) {
        try {
          // Simulate push notification
          console.log(`Push notification sent to ${recipient}:`, notification.title);
        } catch (error) {
          console.error(`Failed to send push to ${recipient}:`, error);
        }
      }
    }
  }

  private async sendBrowserNotification(options: NotificationOptions & { title: string; body: string }): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/default-icon.png',
        badge: options.badge || '/default-badge.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        actions: options.actions,
        data: options.data
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(options.title, options);
      }
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async subscribeToPushNotifications(userId: string): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY || '')
      });

      this.pushSubscriptions.set(userId, subscription);
      
      // In a real app, send this subscription to your server
      console.log('Push subscription created for user:', userId);
      
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private determinePriority(type: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'emergency_alert': return 'critical';
      case 'route_delay': return 'high';
      case 'safety_reminder': return 'high';
      case 'pickup_arrival': return 'medium';
      case 'home_arrival': return 'medium';
      case 'office_arrival': return 'low';
      case 'journey_start': return 'medium';
      default: return 'low';
    }
  }

  private getNotificationIcon(type: string): string {
    const icons = {
      emergency_alert: '/emergency-icon.png',
      pickup_arrival: '/pickup-icon.png',
      home_arrival: '/home-icon.png',
      office_arrival: '/office-icon.png',
      journey_start: '/journey-icon.png',
      route_delay: '/delay-icon.png',
      safety_reminder: '/safety-icon.png',
      weather_alert: '/weather-icon.png'
    };
    return icons[type as keyof typeof icons] || '/default-icon.png';
  }

  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return this.notifications
      .filter(n => n.recipients.includes(userId) || n.recipients.includes('all'))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifications.filter(n => 
      !n.isRead && 
      (n.recipients.includes(userId) || n.recipients.includes('all'))
    ).length;
  }

  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    const existing = this.preferences.get(userId) || {
      userId,
      enablePushNotifications: true,
      enableEmailNotifications: true,
      enableSMSNotifications: false,
      emergencyAlerts: true,
      safetyReminders: true,
      routeUpdates: true,
      arrivalNotifications: true,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00'
      }
    };

    this.preferences.set(userId, { ...existing, ...preferences });
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    return this.preferences.get(userId) || {
      userId,
      enablePushNotifications: true,
      enableEmailNotifications: true,
      enableSMSNotifications: false,
      emergencyAlerts: true,
      safetyReminders: true,
      routeUpdates: true,
      arrivalNotifications: true,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00'
      }
    };
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { startTime, endTime } = preferences.quietHours;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }
}

export const NotificationService = new NotificationServiceClass();