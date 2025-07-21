export interface MapplsLocation {
  latitude: number;
  longitude: number;
  address: string;
  placeName?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface MapplsRoute {
  distance: number;
  duration: number;
  geometry: string;
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }>;
}

class MapplsServiceClass {
  private readonly API_KEY = '278ed98e01becfac7e27d5e78ba8a94f';
  private readonly BASE_URL = 'https://apis.mappls.com/advancedmaps/v1';

  async reverseGeocode(latitude: number, longitude: number): Promise<MapplsLocation> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_KEY}/rev_geocode?lat=${latitude}&lng=${longitude}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          latitude,
          longitude,
          address: result.formatted_address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          placeName: result.house_name || result.poi,
          city: result.city,
          state: result.state,
          pincode: result.pincode
        };
      }

      // Fallback if no results
      return {
        latitude,
        longitude,
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      };
    } catch (error) {
      console.error('Mappls reverse geocoding failed:', error);
      // Fallback to coordinates
      return {
        latitude,
        longitude,
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      };
    }
  }

  async geocode(address: string): Promise<MapplsLocation[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_KEY}/geocode?address=${encodeURIComponent(address)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results.map((result: any) => ({
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lng),
          address: result.formatted_address,
          placeName: result.house_name || result.poi,
          city: result.city,
          state: result.state,
          pincode: result.pincode
        }));
      }

      return [];
    } catch (error) {
      console.error('Mappls geocoding failed:', error);
      return [];
    }
  }

  async getRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): Promise<MapplsRoute | null> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_KEY}/route_adv/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&steps=true`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distance: route.distance,
          duration: route.duration,
          geometry: JSON.stringify(route.geometry),
          steps: route.legs[0]?.steps?.map((step: any) => ({
            instruction: step.maneuver?.instruction || '',
            distance: step.distance,
            duration: step.duration
          })) || []
        };
      }

      return null;
    } catch (error) {
      console.error('Mappls routing failed:', error);
      return null;
    }
  }

  async getNearbyPlaces(
    latitude: number,
    longitude: number,
    category: string = 'FINATM',
    radius: number = 1000
  ): Promise<MapplsLocation[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_KEY}/nearby?keywords=${category}&refLocation=${latitude},${longitude}&radius=${radius}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.suggestedLocations && data.suggestedLocations.length > 0) {
        return data.suggestedLocations.map((location: any) => ({
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          address: location.placeName,
          placeName: location.placeName,
          city: location.city,
          state: location.state
        }));
      }

      return [];
    } catch (error) {
      console.error('Mappls nearby search failed:', error);
      return [];
    }
  }

  async getDistanceMatrix(
    origins: Array<{ lat: number; lng: number }>,
    destinations: Array<{ lat: number; lng: number }>
  ): Promise<any> {
    try {
      const originsStr = origins.map(o => `${o.lng},${o.lat}`).join(';');
      const destinationsStr = destinations.map(d => `${d.lng},${d.lat}`).join(';');

      const response = await fetch(
        `${this.BASE_URL}/${this.API_KEY}/distance_matrix/driving/${originsStr}?destinations=${destinationsStr}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Mappls distance matrix failed:', error);
      return null;
    }
  }
}

export const MapplsService = new MapplsServiceClass();