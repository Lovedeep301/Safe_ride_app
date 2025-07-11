export interface RouteMonitor {
  id: string;
  routeId: string;
  driverId: string;
  driverName: string;
  passengers: string[];
  scheduledStartTime: Date;
  actualStartTime?: Date;
  estimatedArrival: Date;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  status: 'scheduled' | 'in_progress' | 'delayed' | 'completed' | 'cancelled';
  delayMinutes: number;
  delayReason?: string;
  isMonitoring: boolean;
}

export interface RouteAlert {
  id: string;
  routeId: string;
  type: 'delay' | 'breakdown' | 'route_change' | 'emergency' | 'traffic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  isResolved: boolean;
  resolvedAt?: Date;
}

class RouteMonitoringServiceClass {
  private routeMonitors: Map<string, RouteMonitor> = new Map();
  private routeAlerts: RouteAlert[] = [];
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Monitoring configuration
  private readonly MONITORING_CONFIG = {
    UPDATE_INTERVAL: 30000,     // 30 seconds
    DELAY_THRESHOLD: 5,         // 5 minutes before considering delayed
    MAJOR_DELAY_THRESHOLD: 15,  // 15 minutes for major delay
    LOCATION_TIMEOUT: 300000,   // 5 minutes without location update
    MAX_DELAY_ALERTS: 3         // Maximum delay alerts per route
  };

  async startRouteMonitoring(routeId: string, driverId: string, driverName: string, passengers: string[], scheduledStartTime: Date, estimatedArrival: Date): Promise<void> {
    // Stop existing monitoring for this route
    await this.stopRouteMonitoring(routeId);

    const monitor: RouteMonitor = {
      id: `monitor_${routeId}_${Date.now()}`,
      routeId,
      driverId,
      driverName,
      passengers,
      scheduledStartTime,
      estimatedArrival,
      status: 'scheduled',
      delayMinutes: 0,
      isMonitoring: true
    };

    this.routeMonitors.set(routeId, monitor);

    // Start monitoring interval
    const intervalId = setInterval(async () => {
      await this.checkRouteStatus(routeId);
    }, this.MONITORING_CONFIG.UPDATE_INTERVAL);

    this.monitoringIntervals.set(routeId, intervalId);

    console.log(`🚌 Started monitoring route ${routeId} with driver ${driverName}`);
  }

  async stopRouteMonitoring(routeId: string): Promise<void> {
    const monitor = this.routeMonitors.get(routeId);
    if (monitor) {
      monitor.isMonitoring = false;
    }

    // Clear monitoring interval
    const intervalId = this.monitoringIntervals.get(routeId);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(routeId);
    }

    console.log(`🚌 Stopped monitoring route ${routeId}`);
  }

  async updateRouteLocation(routeId: string, location: { latitude: number; longitude: number }): Promise<void> {
    const monitor = this.routeMonitors.get(routeId);
    if (!monitor) return;

    monitor.currentLocation = {
      ...location,
      timestamp: new Date()
    };

    // Update status if route just started
    if (monitor.status === 'scheduled' && !monitor.actualStartTime) {
      monitor.actualStartTime = new Date();
      monitor.status = 'in_progress';

      // Check for start delay
      const startDelay = (monitor.actualStartTime.getTime() - monitor.scheduledStartTime.getTime()) / (1000 * 60);
      if (startDelay > this.MONITORING_CONFIG.DELAY_THRESHOLD) {
        await this.handleRouteDelay(routeId, Math.round(startDelay), 'Late start');
      }
    }

    console.log(`📍 Updated location for route ${routeId}`);
  }

  async reportRouteDelay(routeId: string, delayMinutes: number, reason: string): Promise<void> {
    const monitor = this.routeMonitors.get(routeId);
    if (!monitor) return;

    monitor.delayMinutes = delayMinutes;
    monitor.delayReason = reason;
    monitor.status = 'delayed';

    // Update estimated arrival
    monitor.estimatedArrival = new Date(monitor.estimatedArrival.getTime() + delayMinutes * 60 * 1000);

    await this.handleRouteDelay(routeId, delayMinutes, reason);
  }

  private async handleRouteDelay(routeId: string, delayMinutes: number, reason: string): Promise<void> {
    const monitor = this.routeMonitors.get(routeId);
    if (!monitor) return;

    // Determine severity
    let severity: RouteAlert['severity'] = 'low';
    if (delayMinutes >= this.MONITORING_CONFIG.MAJOR_DELAY_THRESHOLD) {
      severity = 'high';
    } else if (delayMinutes >= this.MONITORING_CONFIG.DELAY_THRESHOLD) {
      severity = 'medium';
    }

    // Create route alert
    const alert: RouteAlert = {
      id: `alert_${Date.now()}`,
      routeId,
      type: 'delay',
      severity,
      message: `Route delayed by ${delayMinutes} minutes. Reason: ${reason}`,
      timestamp: new Date(),
      isResolved: false
    };

    this.routeAlerts.push(alert);

    // Send notifications
    const { NotificationService } = await import('./NotificationService');
    
    // Notify passengers
    for (const passengerId of monitor.passengers) {
      await NotificationService.sendRouteDelayAlert(
        routeId,
        monitor.driverId,
        monitor.driverName,
        delayMinutes,
        reason
      );
    }

    // Notify admins for major delays
    if (severity === 'high') {
      await NotificationService.sendNotification({
        type: 'route_delay',
        title: 'Major Route Delay',
        message: `Route ${routeId} is delayed by ${delayMinutes} minutes`,
        data: {
          routeId,
          driverId: monitor.driverId,
          driverName: monitor.driverName,
          delayMinutes,
          reason,
          severity
        },
        recipients: ['admins']
      });
    }

    console.log(`⚠️ Route delay reported: ${routeId} - ${delayMinutes} minutes`);
  }

  private async checkRouteStatus(routeId: string): Promise<void> {
    const monitor = this.routeMonitors.get(routeId);
    if (!monitor || !monitor.isMonitoring) return;

    const now = new Date();

    // Check for location timeout
    if (monitor.currentLocation) {
      const locationAge = now.getTime() - monitor.currentLocation.timestamp.getTime();
      if (locationAge > this.MONITORING_CONFIG.LOCATION_TIMEOUT) {
        await this.handleLocationTimeout(routeId);
      }
    }

    // Check for schedule delays
    if (monitor.status === 'scheduled' && now > monitor.scheduledStartTime) {
      const delay = (now.getTime() - monitor.scheduledStartTime.getTime()) / (1000 * 60);
      if (delay > this.MONITORING_CONFIG.DELAY_THRESHOLD) {
        await this.handleRouteDelay(routeId, Math.round(delay), 'Route not started on time');
      }
    }

    // Check for arrival delays
    if (monitor.status === 'in_progress' && now > monitor.estimatedArrival) {
      const delay = (now.getTime() - monitor.estimatedArrival.getTime()) / (1000 * 60);
      if (delay > monitor.delayMinutes + this.MONITORING_CONFIG.DELAY_THRESHOLD) {
        await this.handleRouteDelay(routeId, Math.round(delay), 'Route running behind schedule');
      }
    }
  }

  private async handleLocationTimeout(routeId: string): Promise<void> {
    const monitor = this.routeMonitors.get(routeId);
    if (!monitor) return;

    const alert: RouteAlert = {
      id: `alert_${Date.now()}`,
      routeId,
      type: 'emergency',
      severity: 'high',
      message: `No location update from driver ${monitor.driverName} for over 5 minutes`,
      timestamp: new Date(),
      isResolved: false
    };

    this.routeAlerts.push(alert);

    // Send emergency notification
    const { NotificationService } = await import('./NotificationService');
    await NotificationService.sendNotification({
      type: 'emergency_alert',
      title: 'Driver Location Timeout',
      message: `No location update from ${monitor.driverName} for over 5 minutes`,
      data: {
        routeId,
        driverId: monitor.driverId,
        driverName: monitor.driverName,
        lastLocation: monitor.currentLocation
      },
      recipients: ['admins', 'emergency_contacts']
    });

    console.log(`🚨 Location timeout for route ${routeId}`);
  }

  async completeRoute(routeId: string): Promise<void> {
    const monitor = this.routeMonitors.get(routeId);
    if (!monitor) return;

    monitor.status = 'completed';
    monitor.isMonitoring = false;

    // Stop monitoring
    await this.stopRouteMonitoring(routeId);

    // Resolve any open alerts
    this.routeAlerts
      .filter(alert => alert.routeId === routeId && !alert.isResolved)
      .forEach(alert => {
        alert.isResolved = true;
        alert.resolvedAt = new Date();
      });

    // Send completion notification
    const { NotificationService } = await import('./NotificationService');
    await NotificationService.sendNotification({
      type: 'route_delay', // Reusing type for route updates
      title: 'Route Completed',
      message: `${monitor.driverName} has completed the route`,
      data: {
        routeId,
        driverId: monitor.driverId,
        driverName: monitor.driverName,
        completedAt: new Date()
      },
      recipients: ['admins']
    });

    console.log(`✅ Route ${routeId} completed`);
  }

  async cancelRoute(routeId: string, reason: string): Promise<void> {
    const monitor = this.routeMonitors.get(routeId);
    if (!monitor) return;

    monitor.status = 'cancelled';
    monitor.isMonitoring = false;

    // Stop monitoring
    await this.stopRouteMonitoring(routeId);

    // Create cancellation alert
    const alert: RouteAlert = {
      id: `alert_${Date.now()}`,
      routeId,
      type: 'route_change',
      severity: 'high',
      message: `Route cancelled. Reason: ${reason}`,
      timestamp: new Date(),
      isResolved: false
    };

    this.routeAlerts.push(alert);

    // Notify all passengers
    const { NotificationService } = await import('./NotificationService');
    for (const passengerId of monitor.passengers) {
      await NotificationService.sendNotification({
        type: 'route_delay',
        title: 'Route Cancelled',
        message: `Your route has been cancelled. Reason: ${reason}`,
        data: {
          routeId,
          driverId: monitor.driverId,
          driverName: monitor.driverName,
          reason
        },
        recipients: [passengerId]
      });
    }

    console.log(`❌ Route ${routeId} cancelled: ${reason}`);
  }

  async getRouteStatus(routeId: string): Promise<RouteMonitor | null> {
    return this.routeMonitors.get(routeId) || null;
  }

  async getActiveRoutes(): Promise<RouteMonitor[]> {
    return Array.from(this.routeMonitors.values()).filter(m => m.isMonitoring);
  }

  async getRouteAlerts(routeId?: string): Promise<RouteAlert[]> {
    if (routeId) {
      return this.routeAlerts.filter(alert => alert.routeId === routeId);
    }
    return this.routeAlerts;
  }

  async getActiveAlerts(): Promise<RouteAlert[]> {
    return this.routeAlerts.filter(alert => !alert.isResolved);
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.routeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.isResolved = true;
      alert.resolvedAt = new Date();
    }
  }

  // Traffic and weather integration
  async checkTrafficConditions(routeId: string): Promise<void> {
    const monitor = this.routeMonitors.get(routeId);
    if (!monitor || !monitor.currentLocation) return;

    // In a real implementation, this would integrate with traffic APIs
    // For now, we'll simulate traffic detection
    const hasTrafficDelay = Math.random() > 0.8; // 20% chance of traffic

    if (hasTrafficDelay) {
      const trafficDelay = Math.floor(Math.random() * 20) + 5; // 5-25 minutes
      
      const alert: RouteAlert = {
        id: `traffic_${Date.now()}`,
        routeId,
        type: 'traffic',
        severity: trafficDelay > 15 ? 'high' : 'medium',
        message: `Heavy traffic detected. Expected delay: ${trafficDelay} minutes`,
        timestamp: new Date(),
        isResolved: false
      };

      this.routeAlerts.push(alert);

      // Update route delay
      monitor.delayMinutes += trafficDelay;
      monitor.estimatedArrival = new Date(monitor.estimatedArrival.getTime() + trafficDelay * 60 * 1000);

      console.log(`🚦 Traffic delay detected for route ${routeId}: ${trafficDelay} minutes`);
    }
  }

  // Cleanup old data
  async cleanup(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Remove old alerts
    this.routeAlerts = this.routeAlerts.filter(alert => alert.timestamp > oneDayAgo);

    // Remove completed/cancelled routes older than 1 day
    for (const [routeId, monitor] of this.routeMonitors.entries()) {
      if ((monitor.status === 'completed' || monitor.status === 'cancelled') && 
          monitor.scheduledStartTime < oneDayAgo) {
        this.routeMonitors.delete(routeId);
        
        // Clear any remaining intervals
        const intervalId = this.monitoringIntervals.get(routeId);
        if (intervalId) {
          clearInterval(intervalId);
          this.monitoringIntervals.delete(routeId);
        }
      }
    }
  }
}

export const RouteMonitoringService = new RouteMonitoringServiceClass();