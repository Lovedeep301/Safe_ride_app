export interface Route {
  id: string;
  name: string;
  pickup: string;
  destination: string;
  scheduledTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  driverId: string;
  passengers: Passenger[];
  passengerCount: number;
  estimatedDuration: number;
  distance: number;
}

export interface Passenger {
  id: string;
  name: string;
  pickupPoint: string;
  pickupTime: string;
  status: 'confirmed' | 'waiting' | 'picked-up' | 'absent';
  phone?: string;
  emergencyContact?: string;
}

export interface VehicleStatus {
  id: string;
  driverId: string;
  fuelLevel: number;
  mileage: number;
  lastMaintenance: Date;
  nextMaintenance: Date;
  status: 'good' | 'needs-attention' | 'maintenance-required';
}

class DriverServiceClass {
  private routes: Route[] = [
    {
      id: 'route1',
      name: 'Morning Downtown Route',
      pickup: 'Downtown Transit Hub',
      destination: 'Tech Park Office Complex',
      scheduledTime: '8:30 AM',
      status: 'scheduled',
      driverId: 'DRV001',
      passengerCount: 8,
      estimatedDuration: 45,
      distance: 12.5,
      passengers: [
        {
          id: 'EMP001',
          name: 'Alice Johnson',
          pickupPoint: 'Downtown Transit Hub - Gate A',
          pickupTime: '8:30 AM',
          status: 'confirmed',
          phone: '+1-555-0301'
        },
        {
          id: 'EMP002',
          name: 'Bob Smith',
          pickupPoint: 'Downtown Transit Hub - Gate A',
          pickupTime: '8:30 AM',
          status: 'confirmed',
          phone: '+1-555-0302'
        }
      ]
    },
    {
      id: 'route2',
      name: 'Evening Return Route',
      pickup: 'Tech Park Office Complex',
      destination: 'Downtown Transit Hub',
      scheduledTime: '6:00 PM',
      status: 'scheduled',
      driverId: 'DRV001',
      passengerCount: 8,
      estimatedDuration: 50,
      distance: 12.5,
      passengers: []
    },
    {
      id: 'route3',
      name: 'Westside Morning Route',
      pickup: 'Westside Mall',
      destination: 'Tech Park Office Complex',
      scheduledTime: '9:00 AM',
      status: 'completed',
      driverId: 'DRV002',
      passengerCount: 6,
      estimatedDuration: 35,
      distance: 8.2,
      passengers: []
    }
  ];

  private vehicleStatuses: VehicleStatus[] = [
    {
      id: 'vehicle1',
      driverId: 'DRV001',
      fuelLevel: 85,
      mileage: 45230,
      lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
      nextMaintenance: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
      status: 'good'
    },
    {
      id: 'vehicle2',
      driverId: 'DRV002',
      fuelLevel: 92,
      mileage: 38450,
      lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
      nextMaintenance: new Date(Date.now() + 1000 * 60 * 60 * 24 * 22),
      status: 'good'
    }
  ];

  private dutyStatuses: Record<string, boolean> = {
    'DRV001': false,
    'DRV002': true,
    'DRV003': false
  };

  async getTodayRoutes(driverId: string): Promise<Route[]> {
    return this.routes.filter(route => 
      route.driverId === driverId && 
      (route.status === 'scheduled' || route.status === 'in-progress' || route.status === 'completed')
    );
  }

  async getAllRoutes(driverId: string): Promise<Route[]> {
    return this.routes.filter(route => route.driverId === driverId);
  }

  async getRouteDetails(routeId: string): Promise<Route | null> {
    return this.routes.find(route => route.id === routeId) || null;
  }

  async getVehicleStatus(driverId: string): Promise<VehicleStatus | null> {
    return this.vehicleStatuses.find(status => status.driverId === driverId) || null;
  }

  async getDutyStatus(driverId: string): Promise<boolean> {
    return this.dutyStatuses[driverId] || false;
  }

  async getCurrentRoute(driverId: string): Promise<Route | null> {
    return this.routes.find(route => 
      route.driverId === driverId && route.status === 'in-progress'
    ) || null;
  }

  async toggleDutyStatus(driverId: string): Promise<boolean> {
    this.dutyStatuses[driverId] = !this.dutyStatuses[driverId];
    return this.dutyStatuses[driverId];
  }

  async startRoute(driverId: string, routeId: string): Promise<Route | null> {
    const route = this.routes.find(r => r.id === routeId && r.driverId === driverId);
    if (route && route.status === 'scheduled') {
      route.status = 'in-progress';
      return route;
    }
    return null;
  }

  async completeRoute(driverId: string, routeId: string): Promise<boolean> {
    const route = this.routes.find(r => r.id === routeId && r.driverId === driverId);
    if (route && route.status === 'in-progress') {
      route.status = 'completed';
      return true;
    }
    return false;
  }

  async getAssignedPassengers(driverId: string): Promise<Passenger[]> {
    const driverRoutes = this.routes.filter(route => 
      route.driverId === driverId && 
      (route.status === 'scheduled' || route.status === 'in-progress')
    );
    
    const passengers: Passenger[] = [];
    driverRoutes.forEach(route => {
      passengers.push(...route.passengers);
    });
    
    return passengers;
  }

  async updatePassengerStatus(driverId: string, passengerId: string, newStatus: string): Promise<boolean> {
    const driverRoutes = this.routes.filter(route => route.driverId === driverId);
    
    for (const route of driverRoutes) {
      const passenger = route.passengers.find(p => p.id === passengerId);
      if (passenger) {
        passenger.status = newStatus as any;
        return true;
      }
    }
    
    return false;
  }

  async updateVehicleStatus(driverId: string, updates: Partial<VehicleStatus>): Promise<VehicleStatus | null> {
    const vehicleIndex = this.vehicleStatuses.findIndex(v => v.driverId === driverId);
    if (vehicleIndex === -1) return null;

    this.vehicleStatuses[vehicleIndex] = { ...this.vehicleStatuses[vehicleIndex], ...updates };
    return this.vehicleStatuses[vehicleIndex];
  }

  async reportIssue(driverId: string, issueType: string, description: string): Promise<boolean> {
    // In a real app, this would send the issue report to admin
    console.log('Issue reported:', { driverId, issueType, description });
    return true;
  }

  async getDriverStats(driverId: string): Promise<any> {
    // Mock driver statistics
    return {
      totalTrips: 156,
      rating: 4.8,
      milesDriven: 2340,
      onTimePercentage: 94,
      safetyScore: 98
    };
  }
}

export const DriverService = new DriverServiceClass();