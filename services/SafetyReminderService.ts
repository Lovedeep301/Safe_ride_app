export interface SafetyReminder {
  id: string;
  userId: string;
  userName: string;
  type: 'journey_start' | 'periodic_check' | 'arrival_overdue' | 'location_update';
  scheduledTime: Date;
  message: string;
  isActive: boolean;
  isSent: boolean;
  createdAt: Date;
}

export interface JourneyTracker {
  userId: string;
  userName: string;
  startTime: Date;
  expectedDuration: number; // in minutes
  lastCheckIn: Date;
  isActive: boolean;
  remindersSent: number;
  maxReminders: number;
}

class SafetyReminderServiceClass {
  private reminders: SafetyReminder[] = [];
  private journeyTrackers: Map<string, JourneyTracker> = new Map();
  private reminderIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Default reminder intervals (in minutes)
  private readonly REMINDER_INTERVALS = {
    FIRST_CHECK: 15,      // First check-in after 15 minutes
    PERIODIC_CHECK: 30,   // Then every 30 minutes
    OVERDUE_ALERT: 60,    // Alert if no response after 60 minutes
    MAX_REMINDERS: 5      // Maximum number of reminders
  };

  async startJourneyReminders(userId: string, userName: string, expectedDuration: number = 60): Promise<void> {
    // Stop any existing reminders for this user
    await this.stopJourneyReminders(userId);

    const tracker: JourneyTracker = {
      userId,
      userName,
      startTime: new Date(),
      expectedDuration,
      lastCheckIn: new Date(),
      isActive: true,
      remindersSent: 0,
      maxReminders: this.REMINDER_INTERVALS.MAX_REMINDERS
    };

    this.journeyTrackers.set(userId, tracker);

    // Schedule first reminder
    await this.scheduleNextReminder(userId);

    console.log(`🛡️ Started safety reminders for ${userName}`);
  }

  async stopJourneyReminders(userId: string): Promise<void> {
    // Clear any existing intervals
    const intervalId = this.reminderIntervals.get(userId);
    if (intervalId) {
      clearTimeout(intervalId);
      this.reminderIntervals.delete(userId);
    }

    // Mark tracker as inactive
    const tracker = this.journeyTrackers.get(userId);
    if (tracker) {
      tracker.isActive = false;
    }

    console.log(`🛡️ Stopped safety reminders for user ${userId}`);
  }

  async confirmSafetyCheckIn(userId: string): Promise<void> {
    const tracker = this.journeyTrackers.get(userId);
    if (!tracker || !tracker.isActive) return;

    // Update last check-in time
    tracker.lastCheckIn = new Date();
    tracker.remindersSent = 0; // Reset reminder count

    // Schedule next reminder
    await this.scheduleNextReminder(userId);

    console.log(`✅ Safety check-in confirmed for ${tracker.userName}`);
  }

  async confirmArrival(userId: string): Promise<void> {
    const tracker = this.journeyTrackers.get(userId);
    if (!tracker) return;

    // Stop all reminders
    await this.stopJourneyReminders(userId);

    // Send arrival confirmation
    const { NotificationService } = await import('./NotificationService');
    await NotificationService.sendNotification({
      type: 'home_arrival',
      title: 'Safe Arrival Confirmed',
      message: `${tracker.userName} has safely arrived at their destination`,
      data: {
        userId,
        userName: tracker.userName,
        journeyDuration: Date.now() - tracker.startTime.getTime()
      },
      recipients: ['admins', 'emergency_contacts']
    });

    console.log(`🏠 Arrival confirmed for ${tracker.userName}`);
  }

  private async scheduleNextReminder(userId: string): Promise<void> {
    const tracker = this.journeyTrackers.get(userId);
    if (!tracker || !tracker.isActive) return;

    // Clear existing reminder
    const existingInterval = this.reminderIntervals.get(userId);
    if (existingInterval) {
      clearTimeout(existingInterval);
    }

    // Determine next reminder time
    let reminderDelay: number;
    let reminderType: SafetyReminder['type'];
    let message: string;

    if (tracker.remindersSent === 0) {
      // First reminder
      reminderDelay = this.REMINDER_INTERVALS.FIRST_CHECK * 60 * 1000;
      reminderType = 'journey_start';
      message = 'Please confirm you are safe and on your way home';
    } else if (tracker.remindersSent < tracker.maxReminders) {
      // Periodic reminders
      reminderDelay = this.REMINDER_INTERVALS.PERIODIC_CHECK * 60 * 1000;
      reminderType = 'periodic_check';
      message = 'Safety check-in: Please confirm your current status';
    } else {
      // Maximum reminders reached - escalate
      await this.escalateToEmergency(userId);
      return;
    }

    // Schedule the reminder
    const timeoutId = setTimeout(async () => {
      await this.sendSafetyReminder(userId, reminderType, message);
    }, reminderDelay);

    this.reminderIntervals.set(userId, timeoutId);
  }

  private async sendSafetyReminder(userId: string, type: SafetyReminder['type'], message: string): Promise<void> {
    const tracker = this.journeyTrackers.get(userId);
    if (!tracker || !tracker.isActive) return;

    const reminder: SafetyReminder = {
      id: `reminder_${Date.now()}`,
      userId,
      userName: tracker.userName,
      type,
      scheduledTime: new Date(),
      message,
      isActive: true,
      isSent: false,
      createdAt: new Date()
    };

    this.reminders.push(reminder);

    // Send notification
    const { NotificationService } = await import('./NotificationService');
    await NotificationService.sendSafetyReminder(userId, tracker.userName, 'check_in');

    // Update tracker
    tracker.remindersSent++;
    reminder.isSent = true;

    // Schedule next reminder if not at max
    if (tracker.remindersSent < tracker.maxReminders) {
      await this.scheduleNextReminder(userId);
    } else {
      // Escalate to emergency
      await this.escalateToEmergency(userId);
    }

    console.log(`📱 Safety reminder sent to ${tracker.userName} (${tracker.remindersSent}/${tracker.maxReminders})`);
  }

  private async escalateToEmergency(userId: string): Promise<void> {
    const tracker = this.journeyTrackers.get(userId);
    if (!tracker) return;

    // Create emergency alert
    const { EmergencyService } = await import('./EmergencyService');
    const { LocationService } = await import('./LocationService');

    try {
      // Try to get last known location
      const location = await LocationService.getCurrentLocation();
      
      await EmergencyService.createEmergencyAlert(
        userId,
        tracker.userName,
        'employee', // Assume employee for now
        'panic',
        `AUTOMATED ALERT: ${tracker.userName} has not responded to safety check-ins for over ${this.REMINDER_INTERVALS.OVERDUE_ALERT} minutes`,
        location
      );
    } catch (error) {
      // If location fails, create alert without location
      await EmergencyService.createEmergencyAlert(
        userId,
        tracker.userName,
        'employee',
        'panic',
        `AUTOMATED ALERT: ${tracker.userName} has not responded to safety check-ins`,
        { latitude: 0, longitude: 0, address: 'Location unavailable' }
      );
    }

    // Send high-priority notification
    const { NotificationService } = await import('./NotificationService');
    await NotificationService.sendEmergencyAlert(
      userId,
      tracker.userName,
      'No Response',
      { latitude: 0, longitude: 0 },
      'Employee has not responded to multiple safety check-ins'
    );

    // Stop reminders
    await this.stopJourneyReminders(userId);

    console.log(`🚨 ESCALATED TO EMERGENCY: ${tracker.userName} not responding to safety check-ins`);
  }

  async getActiveJourneys(): Promise<JourneyTracker[]> {
    return Array.from(this.journeyTrackers.values()).filter(t => t.isActive);
  }

  async getJourneyStatus(userId: string): Promise<JourneyTracker | null> {
    return this.journeyTrackers.get(userId) || null;
  }

  async getUserReminders(userId: string): Promise<SafetyReminder[]> {
    return this.reminders.filter(r => r.userId === userId);
  }

  async getAllActiveReminders(): Promise<SafetyReminder[]> {
    return this.reminders.filter(r => r.isActive && !r.isSent);
  }

  // Manual reminder methods for admin use
  async sendManualReminder(userId: string, message: string): Promise<void> {
    const { AuthService } = await import('./AuthService');
    const user = await AuthService.getUserById(userId);
    
    if (!user) return;

    const reminder: SafetyReminder = {
      id: `manual_${Date.now()}`,
      userId,
      userName: user.name,
      type: 'location_update',
      scheduledTime: new Date(),
      message,
      isActive: true,
      isSent: false,
      createdAt: new Date()
    };

    this.reminders.push(reminder);

    const { NotificationService } = await import('./NotificationService');
    await NotificationService.sendSafetyReminder(userId, user.name, 'check_in');

    reminder.isSent = true;
  }

  async scheduleDelayedReminder(userId: string, delayMinutes: number, message: string): Promise<void> {
    const { AuthService } = await import('./AuthService');
    const user = await AuthService.getUserById(userId);
    
    if (!user) return;

    const reminder: SafetyReminder = {
      id: `delayed_${Date.now()}`,
      userId,
      userName: user.name,
      type: 'periodic_check',
      scheduledTime: new Date(Date.now() + delayMinutes * 60 * 1000),
      message,
      isActive: true,
      isSent: false,
      createdAt: new Date()
    };

    this.reminders.push(reminder);

    // Schedule the reminder
    setTimeout(async () => {
      const { NotificationService } = await import('./NotificationService');
      await NotificationService.sendSafetyReminder(userId, user.name, 'check_in');
      reminder.isSent = true;
    }, delayMinutes * 60 * 1000);
  }

  // Cleanup old reminders and trackers
  async cleanup(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Remove old reminders
    this.reminders = this.reminders.filter(r => r.createdAt > oneDayAgo);

    // Remove inactive trackers
    for (const [userId, tracker] of this.journeyTrackers.entries()) {
      if (!tracker.isActive && tracker.startTime < oneDayAgo) {
        this.journeyTrackers.delete(userId);
        
        // Clear any remaining intervals
        const intervalId = this.reminderIntervals.get(userId);
        if (intervalId) {
          clearTimeout(intervalId);
          this.reminderIntervals.delete(userId);
        }
      }
    }
  }
}

export const SafetyReminderService = new SafetyReminderServiceClass();