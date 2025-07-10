export interface EmergencyAlert {
  id: string;
  userId: string;
  userName: string;
  userRole: 'employee' | 'driver';
  type: 'panic' | 'medical' | 'accident' | 'breakdown' | 'security';
  message: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved' | 'false-alarm';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  responseTeam?: string[];
  notes?: string;
}

class EmergencyServiceClass {
  private alerts: EmergencyAlert[] = [
    {
      id: 'alert1',
      userId: 'emp001',
      userName: 'Alice Johnson',
      userRole: 'employee',
      type: 'panic',
      message: 'Emergency assistance needed - feeling unsafe',
      location: {
        latitude: 40.7614,
        longitude: -73.9776,
        address: '123 Main St, New York, NY'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      status: 'acknowledged',
      acknowledgedBy: 'admin001',
      acknowledgedAt: new Date(Date.now() - 1000 * 60 * 10),
      priority: 'critical'
    },
    {
      id: 'alert2',
      userId: 'driver001',
      userName: 'Michael Rodriguez',
      userRole: 'driver',
      type: 'breakdown',
      message: 'Vehicle breakdown - need assistance',
      location: {
        latitude: 40.7589,
        longitude: -73.9851,
        address: 'Times Square, New York, NY'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'resolved',
      acknowledgedBy: 'admin001',
      acknowledgedAt: new Date(Date.now() - 1000 * 60 * 25),
      resolvedBy: 'admin001',
      resolvedAt: new Date(Date.now() - 1000 * 60 * 5),
      priority: 'medium'
    }
  ];

  async createEmergencyAlert(
    userId: string,
    userName: string,
    userRole: 'employee' | 'driver',
    type: EmergencyAlert['type'],
    message: string,
    location: { latitude: number; longitude: number; address?: string }
  ): Promise<EmergencyAlert> {
    const alert: EmergencyAlert = {
      id: `alert_${Date.now()}`,
      userId,
      userName,
      userRole,
      type,
      message,
      location,
      timestamp: new Date(),
      status: 'active',
      priority: this.determinePriority(type)
    };

    this.alerts.unshift(alert);
    return alert;
  }

  async getActiveAlerts(): Promise<EmergencyAlert[]> {
    return this.alerts
      .filter(alert => alert.status === 'active')
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  async getAllAlerts(): Promise<EmergencyAlert[]> {
    return this.alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async acknowledgeAlert(alertId: string, adminId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert || alert.status !== 'active') return false;

    alert.status = 'acknowledged';
    alert.acknowledgedBy = adminId;
    alert.acknowledgedAt = new Date();
    return true;
  }

  async resolveAlert(alertId: string, adminId: string, notes?: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedBy = adminId;
    alert.resolvedAt = new Date();
    if (notes) alert.notes = notes;
    return true;
  }

  async markFalseAlarm(alertId: string, adminId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.status = 'false-alarm';
    alert.resolvedBy = adminId;
    alert.resolvedAt = new Date();
    return true;
  }

  async getAlertsByUser(userId: string): Promise<EmergencyAlert[]> {
    return this.alerts.filter(alert => alert.userId === userId);
  }

  async getAlertStats(): Promise<{
    total: number;
    active: number;
    resolved: number;
    falseAlarms: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const stats = {
      total: this.alerts.length,
      active: this.alerts.filter(a => a.status === 'active').length,
      resolved: this.alerts.filter(a => a.status === 'resolved').length,
      falseAlarms: this.alerts.filter(a => a.status === 'false-alarm').length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    this.alerts.forEach(alert => {
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      stats.byPriority[alert.priority] = (stats.byPriority[alert.priority] || 0) + 1;
    });

    return stats;
  }

  private determinePriority(type: EmergencyAlert['type']): EmergencyAlert['priority'] {
    switch (type) {
      case 'panic':
      case 'medical':
        return 'critical';
      case 'accident':
      case 'security':
        return 'high';
      case 'breakdown':
        return 'medium';
      default:
        return 'low';
    }
  }
}

export const EmergencyService = new EmergencyServiceClass();