import * as ExpoLocation from 'expo-location';
import { MapplsService } from './MapplsService';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  address: string;
}

class LocationServiceClass {
  private watchSubscription: any = null;

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const result = await MapplsService.reverseGeocode(latitude, longitude);
      return result.address;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  }

  async startTracking(
    callback: (location: Location) => void,
    options?: { interval?: number; movementThreshold?: number }
  ): Promise<void> {
    this.stopTracking();

    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      this.watchSubscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.High,
          timeInterval: options?.interval || 30000, // default: 30 seconds
          distanceInterval: options?.movementThreshold || 10, // default: 10 meters
        },
        async (position) => {
          const coords = position.coords;
          const address = await this.reverseGeocode(coords.latitude, coords.longitude);
          
          const location: Location = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            altitudeAccuracy: coords.altitudeAccuracy,
            heading: coords.heading,
            speed: coords.speed,
            timestamp: position.timestamp,
            address,
          };
          callback(location);
        }
      );
    } catch (error) {
      this.logError(error, 'startTracking');
    }
  }

  stopTracking(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  private logError(error: any, context: string) {
    console.error(`LocationService ${context} error:`, error);
  }
}

export const LocationService = new LocationServiceClass();
