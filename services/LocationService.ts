
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  address?: string;
  batteryLevel?: number;
}

interface PositionOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

interface TrackingOptions {
  interval?: number;
  movementThreshold?: number; // meters
  enableBatteryMonitoring?: boolean;
}

class LocationService {
  private watchId: number | null = null;
  private lastPosition: Location | null = null;


  /**
   * Get current location with optional address
   * @returns Promise<Location>
   */
  async getCurrentLocation(): Promise<Location> {
    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }
      
      const permission = await this.checkPermission();
      if (permission !== 'granted') {
        // Try to request permission by attempting to get position
        try {
          const position = await this.getPosition('single');
          return this.processPosition(position);
        } catch (error) {
          throw new Error('Location permission not granted');
        }
      }

      const position = await this.getPosition('single');
      return this.processPosition(position);
    } catch (error) {
      this.logError(error, 'getCurrentLocation');
      return this.getDefaultLocation();
    }
  }

  /**
   * Start real-time location tracking
   * @param callback - Function to receive location updates
   * @param options - Tracking configuration
   */
  startTracking(
    callback: (location: Location) => void,
    options: TrackingOptions = {}
  ): void {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }
    
    this.stopTracking(); // Clear any existing watcher

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location = await this.processPosition(position);
        
        // Only trigger callback if significant movement
        if (!this.lastPosition || 
            this.calculateDistance(this.lastPosition, location) > (options.movementThreshold || 10)) {
          callback(location);
          this.lastPosition = location;
        }
      },
      (error) => this.logError(error, 'watchPosition'),
      this.getPositionOptions('tracking')
    );

    if (options.enableBatteryMonitoring) {
      this.monitorBattery();
    }
  }

  /**
   * Stop real-time tracking
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }


  private async processPosition(position: GeolocationPosition): Promise<Location> {
    const location: Location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp
    };

    try {
      location.address = await this.reverseGeocode(location.latitude, location.longitude);
    } catch (error) {
      console.warn('Geocoding failed:', error);
    }

    return location;
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // For demo purposes, return a formatted address
      // In production, integrate with a real geocoding service
    return `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Geocoding error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  private getPosition(mode: 'single' | 'tracking'): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        this.getPositionOptions(mode)
      );
    });
  }

  private getPositionOptions(mode: 'single' | 'tracking'): PositionOptions {
    return {
      enableHighAccuracy: mode === 'tracking',
      timeout: mode === 'tracking' ? 5000 : 10000,
      maximumAge: mode === 'tracking' ? 0 : 60000
    };
  }

  private calculateDistance(loc1: Location, loc2: Location): number {
    // Haversine formula implementation
    const R = 6371e3; // Earth radius in meters
    const φ1 = loc1.latitude * Math.PI/180;
    const φ2 = loc2.latitude * Math.PI/180;
    const Δφ = (loc2.latitude-loc1.latitude) * Math.PI/180;
    const Δλ = (loc2.longitude-loc1.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }


  private async checkPermission(): Promise<PermissionState> {
    try {
      if (navigator?.permissions?.query) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state;
      }
      return 'prompt'; // Assume we can prompt if Permissions API not available
    } catch (error) {
      this.logError(error, 'checkPermission');
      return 'prompt';
    }
  }

  /**
   * Request location permission
   * @returns Promise<boolean> - true if granted
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!navigator.geolocation) {
        return false;
      }
      const position = await this.getPosition('single');
      return true;
    } catch (error) {
      this.logError(error, 'requestPermission');
      return false;
    }
  }


  private getDefaultLocation(): Location {
    return {
      latitude: 40.7128, // Default to New York
      longitude: -74.0060,
      address: 'Default Location',
      timestamp: Date.now()
    };
  }

  private logError(error: any, context: string): void {
    const errorInfo = {
      context,
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    };
    console.error('Location Error:', errorInfo);
  }


  private monitorBattery(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2) {
            // Reduce tracking frequency when battery is low
            this.adjustTrackingForBattery();
          }
        });
      }).catch((error: any) => {
        console.warn('Battery monitoring not available:', error);
      });
    }
  }

  private adjustTrackingForBattery(): void {
    // Implement battery-saving adjustments
    console.warn('Battery level low - consider reducing tracking frequency');
  }
}

export const LocationService = new LocationService();