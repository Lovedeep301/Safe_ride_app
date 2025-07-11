export interface Geofence {
  id: string;
  name: string;
  type: 'pickup_point' | 'home' | 'office' | 'emergency_zone';
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
  userId?: string; // for personal geofences like home
  isActive: boolean;
  createdAt: Date;
}

export interface GeofenceEvent {
  id: string;
  geofenceId: string;
  userId: string;
  userName: string;
  eventType: 'enter' | 'exit';
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  notificationSent: boolean;
}

class GeofencingServiceClass {
  private geofences: Geofence[] = [
    // Default pickup points
    {
      id: 'pickup_downtown',
      name: 'Downtown Transit Hub',
      type: 'pickup_point',
      center: { latitude: 40.7614, longitude: -73.9776 },
      radius: 100,
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'pickup_westside',
      name: 'Westside Mall',
      type: 'pickup_point',
      center: { latitude: 40.7505, longitude: -73.9934 },
      radius: 100,
      isActive: true,
      createdAt: new Date()
    },
    // Office location
    {
      id: 'office_main',
      name: 'Main Office',
      type: 'office',
      center: { latitude: 40.7589, longitude: -73.9851 },
      radius: 150,
      isActive: true,
      createdAt: new Date()
    }
  ];

  private events: GeofenceEvent[] = [];
  private activeWatchers: Map<string, number> = new Map();

  async createGeofence(geofence: Omit<Geofence, 'id' | 'createdAt'>): Promise<Geofence> {
    const newGeofence: Geofence = {
      ...geofence,
      id: `geofence_${Date.now()}`,
      createdAt: new Date()
    };

    this.geofences.push(newGeofence);
    return newGeofence;
  }

  async createHomeGeofence(userId: string, userName: string, location: { latitude: number; longitude: number; address?: string }): Promise<Geofence> {
    // Remove existing home geofence for this user
    this.geofences = this.geofences.filter(g => !(g.type === 'home' && g.userId === userId));

    const homeGeofence: Geofence = {
      id: `home_${userId}`,
      name: `${userName}'s Home`,
      type: 'home',
      center: location,
      radius: 100, // 100 meter radius around home
      userId,
      isActive: true,
      createdAt: new Date()
    };

    this.geofences.push(homeGeofence);
    return homeGeofence;
  }

  async getGeofences(userId?: string): Promise<Geofence[]> {
    if (userId) {
      return this.geofences.filter(g => 
        g.userId === userId || 
        g.type === 'pickup_point' || 
        g.type === 'office'
      );
    }
    return this.geofences;
  }

  async startGeofenceMonitoring(userId: string, userName: string): Promise<void> {
    // Stop existing monitoring for this user
    this.stopGeofenceMonitoring(userId);

    const { LocationService } = await import('./LocationService');
    const { NotificationService } = await import('./NotificationService');

    // Get user's geofences
    const userGeofences = await this.getGeofences(userId);

    // Start location tracking
    LocationService.startTracking(
      async (location) => {
        // Check each geofence
        for (const geofence of userGeofences) {
          const distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            geofence.center.latitude,
            geofence.center.longitude
          );

          const isInside = distance <= geofence.radius;
          const wasInside = this.wasUserInGeofence(userId, geofence.id);

          // Detect entry
          if (isInside && !wasInside) {
            await this.handleGeofenceEntry(userId, userName, geofence, location);
          }
          // Detect exit
          else if (!isInside && wasInside) {
            await this.handleGeofenceExit(userId, userName, geofence, location);
          }

          // Update user's geofence status
          this.updateUserGeofenceStatus(userId, geofence.id, isInside);
        }
      },
      {
        interval: 15000, // Check every 15 seconds
        movementThreshold: 5 // 5 meter threshold
      }
    );
  }

  async stopGeofenceMonitoring(userId: string): Promise<void> {
    const watcherId = this.activeWatchers.get(userId);
    if (watcherId) {
      const { LocationService } = await import('./LocationService');
      LocationService.stopTracking();
      this.activeWatchers.delete(userId);
    }
  }

  private async handleGeofenceEntry(userId: string, userName: string, geofence: Geofence, location: any): Promise<void> {
    const event: GeofenceEvent = {
      id: `event_${Date.now()}`,
      geofenceId: geofence.id,
      userId,
      userName,
      eventType: 'enter',
      timestamp: new Date(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      },
      notificationSent: false
    };

    this.events.push(event);

    // Handle different geofence types
    switch (geofence.type) {
      case 'pickup_point':
        await this.handlePickupPointArrival(userId, userName, geofence, event);
        break;
      case 'home':
        await this.handleHomeArrival(userId, userName, geofence, event);
        break;
      case 'office':
        await this.handleOfficeArrival(userId, userName, geofence, event);
        break;
    }
  }

  private async handleGeofenceExit(userId: string, userName: string, geofence: Geofence, location: any): Promise<void> {
    const event: GeofenceEvent = {
      id: `event_${Date.now()}`,
      geofenceId: geofence.id,
      userId,
      userName,
      eventType: 'exit',
      timestamp: new Date(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      },
      notificationSent: false
    };

    this.events.push(event);

    // Handle office exit (start journey)
    if (geofence.type === 'office') {
      await this.handleOfficeExit(userId, userName, geofence, event);
    }
  }

  private async handlePickupPointArrival(userId: string, userName: string, geofence: Geofence, event: GeofenceEvent): Promise<void> {
    const { NotificationService } = await import('./NotificationService');
    const { EmployeeService } = await import('./EmployeeService');

    // Update employee status
    await EmployeeService.updateEmployeeStatus(userId, 'pending');

    // Send notification to driver and admin
    await NotificationService.sendNotification({
      type: 'pickup_arrival',
      title: 'Passenger Arrived at Pickup Point',
      message: `${userName} has arrived at ${geofence.name}`,
      data: {
        userId,
        userName,
        geofenceId: geofence.id,
        location: event.location
      },
      recipients: ['drivers', 'admins']
    });

    console.log(`📍 ${userName} arrived at pickup point: ${geofence.name}`);
  }

  private async handleHomeArrival(userId: string, userName: string, geofence: Geofence, event: GeofenceEvent): Promise<void> {
    const { NotificationService } = await import('./NotificationService');
    const { EmployeeService } = await import('./EmployeeService');

    // Confirm safe arrival
    await EmployeeService.confirmArrival(userId, event.location);

    // Send notification to admin and emergency contacts
    await NotificationService.sendNotification({
      type: 'home_arrival',
      title: 'Safe Arrival Confirmed',
      message: `${userName} has safely arrived home`,
      data: {
        userId,
        userName,
        location: event.location,
        timestamp: event.timestamp
      },
      recipients: ['admins', 'emergency_contacts']
    });

    console.log(`🏠 ${userName} safely arrived home`);
  }

  private async handleOfficeArrival(userId: string, userName: string, geofence: Geofence, event: GeofenceEvent): Promise<void> {
    const { NotificationService } = await import('./NotificationService');

    // Send arrival notification
    await NotificationService.sendNotification({
      type: 'office_arrival',
      title: 'Office Arrival',
      message: `${userName} has arrived at the office`,
      data: {
        userId,
        userName,
        location: event.location
      },
      recipients: ['admins']
    });

    console.log(`🏢 ${userName} arrived at office`);
  }

  private async handleOfficeExit(userId: string, userName: string, geofence: Geofence, event: GeofenceEvent): Promise<void> {
    const { NotificationService } = await import('./NotificationService');
    const { SafetyReminderService } = await import('./SafetyReminderService');

    // Start safety check-in reminders
    await SafetyReminderService.startJourneyReminders(userId, userName);

    // Send journey start notification
    await NotificationService.sendNotification({
      type: 'journey_start',
      title: 'Journey Started',
      message: `${userName} has left the office`,
      data: {
        userId,
        userName,
        location: event.location
      },
      recipients: ['admins', 'emergency_contacts']
    });

    console.log(`🚗 ${userName} started journey home`);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private wasUserInGeofence(userId: string, geofenceId: string): boolean {
    // Check recent events to determine if user was inside
    const recentEvents = this.events
      .filter(e => e.userId === userId && e.geofenceId === geofenceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (recentEvents.length === 0) return false;
    return recentEvents[0].eventType === 'enter';
  }

  private updateUserGeofenceStatus(userId: string, geofenceId: string, isInside: boolean): void {
    // This would typically update a local cache or database
    // For now, we'll just log the status
    console.log(`User ${userId} ${isInside ? 'inside' : 'outside'} geofence ${geofenceId}`);
  }

  async getGeofenceEvents(userId?: string): Promise<GeofenceEvent[]> {
    if (userId) {
      return this.events.filter(e => e.userId === userId);
    }
    return this.events;
  }

  async getRecentEvents(limit: number = 50): Promise<GeofenceEvent[]> {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const GeofencingService = new GeofencingServiceClass();