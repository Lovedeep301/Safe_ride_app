import * as ExpoLocation from 'expo-location';

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

class LocationServiceClass {
  private watchSubscription: ExpoLocation.LocationSubscription | null = null;

  async getCurrentLocation(): Promise<Location> {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });

      const coords = position.coords;

      const location: Location = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        speed: coords.speed,
        timestamp: position.timestamp,
        address: await this.reverseGeocode(coords.latitude, coords.longitude)
      };

      return location;
    } catch (error: any) {
      this.logError(error, 'getCurrentLocation');
      return this.getDefaultLocation();
    }
  }

  startTracking(callback: (location: Location) => void): void {
    this.stopTracking();

    ExpoLocation.watchPositionAsync(
      {
        accuracy: ExpoLocation.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      async (position) => {
        const coords = position.coords;
        const location: Location = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          altitude: coords.altitude,
          altitudeAccuracy: coords.altitudeAccuracy,
          heading: coords.heading,
          speed: coords.speed,
          timestamp: position.timestamp,
          address: await this.reverseGeocode(coords.latitude, coords.longitude)
        };
        callback(location);
      }
    ).then(subscription => {
      this.watchSubscription = subscription;
    });
  }

  stopTracking(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const [place] = await ExpoLocation.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (place) {
        return `${place.name ?? ''}, ${place.city ?? ''}, ${place.region ?? ''}, ${place.country ?? ''}`;
      }
    } catch (error) {
      console.warn('Geocoding failed:', error);
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  private getDefaultLocation(): Location {
    return {
      latitude: 28.6139,
      longitude: 77.2090,
      address: 'Default: New Delhi, India',
      timestamp: Date.now()
    };
  }

  private logError(error: any, context: string): void {
    console.error(`[${context}]`, error.message || error);
  }
}

export const LocationService = new LocationServiceClass();
