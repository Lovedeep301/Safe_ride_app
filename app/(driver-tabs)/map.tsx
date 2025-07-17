import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LocationService, Location } from '@/services/LocationService'; // Adjust import if path is different

export default function MapScreen() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const loc = await LocationService.getCurrentLocation();
        setLocation(loc);
      } catch (error) {
        console.error('Error fetching location:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Fetching location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Your Current Location</Text>
      {location ? (
        <>
          <Text>Latitude: {location.latitude}</Text>
          <Text>Longitude: {location.longitude}</Text>
          <Text>Address: {location.address ?? 'N/A'}</Text>
          <Text>Time: {new Date(location.timestamp).toLocaleString()}</Text>
        </>
      ) : (
        <Text>Location not available</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold'
  }
});
