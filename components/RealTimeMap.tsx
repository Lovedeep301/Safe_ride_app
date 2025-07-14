import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Alert
} from 'react-native';
import { MapPin, Users, Car, RefreshCw, Zap, Clock, Navigation, Crosshair } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { LocationService } from '@/services/LocationService';
import { FirebaseLocationService } from '@/services/FirebaseLocationService';

interface MapUser {
  id: string;
  name: string;
  role: 'employee' | 'driver' | 'admin';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: Date;
    accuracy?: number;
  };
  status: 'online' | 'offline' | 'emergency';
  vehicleInfo?: {
    plateNumber: string;
    model: string;
  };
  batteryLevel?: number;
}

interface RealTimeMapProps {
  showControls?: boolean;
  filterRole?: 'employee' | 'driver' | 'all';
  height?: number;
}

export default function RealTimeMap({ 
  showControls = false, 
  filterRole = 'all',
  height = 400 
}: RealTimeMapProps) {
  const [users, setUsers] = useState<MapUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MapUser | null>(null);
  const [mapCenter, setMapCenter] = useState({ latitude: 40.7128, longitude: -74.0060 });
  const [currentUserLocation, setCurrentUserLocation] = useState<any>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<(() => void) | null>(null);
  const currentUser = AuthService.getCurrentUser();

  // Start real-time location tracking for current user
  const startLocationTracking = useCallback(async () => {
    if (!currentUser || isTrackingLocation) return;

    try {
      setIsTrackingLocation(true);
      
      // Get initial location
      const initialLocation = await LocationService.getCurrentLocation();
      setCurrentUserLocation(initialLocation);
      setMapCenter({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude
      });

      // Update Firebase with current location
      await FirebaseLocationService.updateUserLocation(
        currentUser.id,
        currentUser.name,
        currentUser.role as 'employee' | 'driver' | 'admin',
        initialLocation,
        85 // Mock battery level
      );

      // Start continuous tracking
      LocationService.startTracking(
        async (location) => {
          setCurrentUserLocation(location);
          
          // Update Firebase with new location
          try {
            await FirebaseLocationService.updateUserLocation(
              currentUser.id,
              currentUser.name,
              currentUser.role as 'employee' | 'driver' | 'admin',
              location,
              85 // Mock battery level
            );
          } catch (error) {
            console.error('Error updating location to Firebase:', error);
          }
        },
        {
          interval: 30000, // Update every 30 seconds
          movementThreshold: 10, // Only update if moved 10+ meters
          enableBatteryMonitoring: true
        }
      );

    } catch (error) {
      console.error('Error starting location tracking:', error);
      setError('Failed to start location tracking');
      setIsTrackingLocation(false);
    }
  }, [currentUser, isTrackingLocation]);

  // Stop location tracking
  const stopLocationTracking = useCallback(() => {
    LocationService.stopTracking();
    setIsTrackingLocation(false);
  }, []);

  // Load real-time location data from Firebase
  const loadRealTimeUsers = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get recent location updates from Firebase
      const locationUpdates = await FirebaseLocationService.getRecentLocations(
        filterRole === 'all' ? undefined : filterRole
      );
      
      // Convert Firebase location updates to MapUser format
      const mapUsers: MapUser[] = locationUpdates.map(update => ({
        id: update.userId,
        name: update.userName,
        role: update.userRole,
        location: {
          latitude: update.location.latitude,
          longitude: update.location.longitude,
          address: update.location.address,
          timestamp: update.timestamp?.toDate ? update.timestamp.toDate() : new Date(),
          accuracy: update.location.accuracy
        },
        status: update.isEmergency ? 'emergency' : 'online',
        batteryLevel: update.batteryLevel,
        // Add vehicle info for drivers (mock data)
        ...(update.userRole === 'driver' && {
          vehicleInfo: {
            plateNumber: `${update.userId.slice(-3)}-${Math.floor(Math.random() * 1000)}`,
            model: 'Toyota Hiace'
          }
        })
      }));

      // Remove duplicates (keep most recent for each user)
      const uniqueUsers = mapUsers.reduce((acc, user) => {
        const existing = acc.find(u => u.id === user.id);
        if (!existing || user.location.timestamp > existing.location.timestamp) {
          return [...acc.filter(u => u.id !== user.id), user];
        }
        return acc;
      }, [] as MapUser[]);

      setUsers(uniqueUsers);
      
    } catch (err) {
      setError('Failed to load real-time location data');
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, filterRole]);

  // Set up real-time Firebase subscription
  useEffect(() => {
    if (locationSubscription) {
      locationSubscription();
    }

    // Subscribe to real-time location updates
    const unsubscribe = FirebaseLocationService.subscribeToLocationUpdates(
      (locationUpdates) => {
        // Convert to MapUser format
        const mapUsers: MapUser[] = locationUpdates.map(update => ({
          id: update.userId,
          name: update.userName,
          role: update.userRole,
          location: {
            latitude: update.location.latitude,
            longitude: update.location.longitude,
            address: update.location.address,
            timestamp: update.timestamp?.toDate ? update.timestamp.toDate() : new Date(),
            accuracy: update.location.accuracy
          },
          status: update.isEmergency ? 'emergency' : 'online',
          batteryLevel: update.batteryLevel,
          ...(update.userRole === 'driver' && {
            vehicleInfo: {
              plateNumber: `${update.userId.slice(-3)}-${Math.floor(Math.random() * 1000)}`,
              model: 'Toyota Hiace'
            }
          })
        }));

        // Filter by role if specified
        const filteredUsers = filterRole === 'all' 
          ? mapUsers 
          : mapUsers.filter(user => user.role === filterRole);

        // Remove duplicates (keep most recent for each user)
        const uniqueUsers = filteredUsers.reduce((acc, user) => {
          const existing = acc.find(u => u.id === user.id);
          if (!existing || user.location.timestamp > existing.location.timestamp) {
            return [...acc.filter(u => u.id !== user.id), user];
          }
          return acc;
        }, [] as MapUser[]);

        setUsers(uniqueUsers);
      },
      filterRole === 'all' ? undefined : filterRole
    );

    setLocationSubscription(() => unsubscribe);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [filterRole]);

  // Start location tracking on mount
  useEffect(() => {
    if (currentUser) {
      startLocationTracking();
    }

    return () => {
      stopLocationTracking();
      if (locationSubscription) {
        locationSubscription();
      }
    };
  }, [currentUser]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRealTimeUsers();
    
    // Also refresh current user location
    if (currentUser) {
      try {
        const location = await LocationService.getCurrentLocation();
        setCurrentUserLocation(location);
        await FirebaseLocationService.updateUserLocation(
          currentUser.id,
          currentUser.name,
          currentUser.role as 'employee' | 'driver' | 'admin',
          location,
          85
        );
      } catch (error) {
        console.error('Error refreshing location:', error);
      }
    }
    
    setRefreshing(false);
  }, [loadRealTimeUsers, currentUser]);

  const centerOnCurrentUser = useCallback(async () => {
    if (!currentUser) return;

    try {
      const location = await LocationService.getCurrentLocation();
      setMapCenter({
        latitude: location.latitude,
        longitude: location.longitude
      });
      setCurrentUserLocation(location);
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('Unable to get current location. Please enable location services.');
      } else {
        Alert.alert('Location Error', 'Unable to get current location. Please enable location services.');
      }
    }
  }, [currentUser]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'driver': return Car;
      case 'employee': return Users;
      default: return MapPin;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'driver': return '#059669';
      case 'employee': return '#2563EB';
      case 'admin': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'emergency': return '#EF4444';
      case 'offline': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const formatLastSeen = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const calculateMapBounds = () => {
    if (users.length === 0 && !currentUserLocation) return null;

    const allLocations = [
      ...users.map(u => u.location),
      ...(currentUserLocation ? [currentUserLocation] : [])
    ];

    const lats = allLocations.map(l => l.latitude);
    const lngs = allLocations.map(l => l.longitude);

    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      centerLat: (Math.min(...lats) + Math.max(...lats)) / 2,
      centerLng: (Math.min(...lngs) + Math.max(...lngs)) / 2
    };
  };

  const renderInteractiveMap = () => {
    const bounds = calculateMapBounds();
    const mapWidth = 300;
    const mapHeight = height - 40;

    return (
      <View style={[styles.interactiveMap, { height: mapHeight }]}>
        {/* Map Background */}
        <View style={styles.mapBackground}>
          <Text style={styles.mapTitle}>Live GPS Tracking</Text>
          <Text style={styles.mapSubtitle}>
            {users.length} users • {isTrackingLocation ? 'GPS Active' : 'GPS Inactive'}
          </Text>
        </View>
        {/* Current User Location */}
        {currentUserLocation && (
          <View style={[
            styles.userPin,
            {
              left: mapWidth * 0.5 - 15,
              top: mapHeight * 0.5 - 15,
              backgroundColor: '#2563EB',
              borderColor: '#FFFFFF',
              borderWidth: 3
            }
          ]}>
            <Users size={16} color="#FFFFFF" />
          </View>
        )}

        {/* Other Users */}
        {users.map((user, index) => {
          if (user.id === currentUser?.id) return null;
          
          const RoleIcon = getRoleIcon(user.role);
          // Position users in a circle around current user
          const angle = (index * 2 * Math.PI) / Math.max(users.length - 1, 1);
          const radius = 60;
          const x = mapWidth * 0.5 + Math.cos(angle) * radius - 15;
          const y = mapHeight * 0.5 + Math.sin(angle) * radius - 15;
          
          return (
            <TouchableOpacity
              key={user.id}
              style={[
                styles.userPin,
                {
                  left: Math.max(5, Math.min(x, mapWidth - 35)),
                  top: Math.max(5, Math.min(y, mapHeight - 35)),
                  backgroundColor: getRoleColor(user.role)
                }
              ]}
              onPress={() => setSelectedUser(user)}
            >
              <RoleIcon size={16} color="#FFFFFF" />
              {user.status === 'emergency' && (
                <View style={styles.emergencyIndicator} />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Location Accuracy Circle for Current User */}
        {currentUserLocation?.accuracy && (
          <View style={[
            styles.accuracyCircle,
            {
              left: mapWidth * 0.5 - 30,
              top: mapHeight * 0.5 - 30,
              width: Math.min(60, currentUserLocation.accuracy / 2),
              height: Math.min(60, currentUserLocation.accuracy / 2)
            }
          ]} />
        )}

        {/* GPS Status Indicator */}
        <View style={styles.gpsStatus}>
          <View style={[
            styles.gpsIndicator,
            { backgroundColor: isTrackingLocation ? '#10B981' : '#6B7280' }
          ]} />
          <Text style={styles.gpsStatusText}>
            {isTrackingLocation ? 'GPS Active' : 'GPS Inactive'}
          </Text>
        </View>
      </View>
    );
  };

  const renderMapView = () => (
    <View style={[styles.mapContainer, { height }]}>
      {renderInteractiveMap()}
      
      {/* Map Controls */}
      {showControls && (
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleRefresh}>
            <RefreshCw size={20} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={centerOnCurrentUser}>
            <Crosshair size={20} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: isTrackingLocation ? '#10B981' : '#6B7280' }]}
            onPress={isTrackingLocation ? stopLocationTracking : startLocationTracking}
          >
            <Navigation size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderUserList = () => (
    <ScrollView 
      style={styles.userList}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Current User Card */}
      {currentUserLocation && (
        <View style={[styles.userCard, styles.currentUserCard]}>
          <View style={styles.userCardLeft}>
            <View style={[styles.userIcon, { backgroundColor: '#2563EB15' }]}>
              <Users size={20} color="#2563EB" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{currentUser?.name} (You)</Text>
              <Text style={styles.userRole}>{currentUser?.role}</Text>
              <Text style={styles.location}>
                Accuracy: ±{currentUserLocation.accuracy?.toFixed(0) || 'Unknown'}m
              </Text>
            </View>
          </View>
          
          <View style={styles.userCardRight}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.lastSeen}>Live</Text>
            <Text style={styles.location} numberOfLines={1}>
              {currentUserLocation.address || 'Current location'}
            </Text>
          </View>
        </View>
      )}

      {users.filter(u => u.id !== currentUser?.id).map((user) => {
        const RoleIcon = getRoleIcon(user.role);
        return (
          <TouchableOpacity
            key={user.id}
            style={styles.userCard}
            onPress={() => setSelectedUser(user)}
          >
            <View style={styles.userCardLeft}>
              <View style={[styles.userIcon, { backgroundColor: `${getRoleColor(user.role)}15` }]}>
                <RoleIcon size={20} color={getRoleColor(user.role)} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userRole}>{user.role}</Text>
                {user.vehicleInfo && (
                  <Text style={styles.vehicleInfo}>
                    {user.vehicleInfo.model} • {user.vehicleInfo.plateNumber}
                  </Text>
                )}
                {user.location.accuracy && (
                  <Text style={styles.accuracyText}>
                    ±{user.location.accuracy.toFixed(0)}m accuracy
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.userCardRight}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(user.status) }]} />
              <Text style={styles.lastSeen}>
                {formatLastSeen(user.location.timestamp)}
              </Text>
              <Text style={styles.location} numberOfLines={1}>
                {user.location.address || 'Unknown location'}
              </Text>
              {user.batteryLevel && (
                <Text style={styles.batteryLevel}>
                  🔋 {user.batteryLevel}%
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderSelectedUserDetails = () => {
    if (!selectedUser) return null;
    
    const RoleIcon = getRoleIcon(selectedUser.role);
    
    return (
      <View style={styles.userDetails}>
        <View style={styles.userDetailsHeader}>
          <View style={styles.userDetailsLeft}>
            <View style={[styles.userDetailsIcon, { backgroundColor: `${getRoleColor(selectedUser.role)}15` }]}>
              <RoleIcon size={24} color={getRoleColor(selectedUser.role)} />
            </View>
            <View>
              <Text style={styles.userDetailsName}>{selectedUser.name}</Text>
              <Text style={styles.userDetailsRole}>{selectedUser.role}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setSelectedUser(null)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.userDetailsContent}>
          <View style={styles.detailRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {selectedUser.location.address || 'Unknown location'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              Last seen: {formatLastSeen(selectedUser.location.timestamp)}
            </Text>
          </View>
          
          {selectedUser.location.accuracy && (
            <View style={styles.detailRow}>
              <Crosshair size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                Accuracy: ±{selectedUser.location.accuracy.toFixed(0)} meters
              </Text>
            </View>
          )}
          
          {selectedUser.vehicleInfo && (
            <View style={styles.detailRow}>
              <Car size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                {selectedUser.vehicleInfo.model} • {selectedUser.vehicleInfo.plateNumber}
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedUser.status) }]} />
            <Text style={styles.detailText}>
              Status: {selectedUser.status}
            </Text>
          </View>

          {selectedUser.batteryLevel && (
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>🔋</Text>
              <Text style={styles.detailText}>
                Battery: {selectedUser.batteryLevel}%
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Zap size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>GPS Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <RefreshCw size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderMapView()}
      
      {selectedUser && renderSelectedUserDetails()}
      
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Users size={16} color="#2563EB" />
          <Text style={styles.statText}>
            {users.filter(u => u.role === 'employee').length} Employees
          </Text>
        </View>
        <View style={styles.statItem}>
          <Car size={16} color="#059669" />
          <Text style={styles.statText}>
            {users.filter(u => u.role === 'driver').length} Drivers
          </Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.statText}>
            {users.filter(u => u.status === 'online').length} Online
          </Text>
        </View>
        <View style={styles.statItem}>
          <Navigation size={16} color={isTrackingLocation ? '#10B981' : '#6B7280'} />
          <Text style={styles.statText}>
            GPS {isTrackingLocation ? 'On' : 'Off'}
          </Text>
        </View>
      </View>
      
      {renderUserList()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mapContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  interactiveMap: {
    position: 'relative',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
  },
  mapBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
  },
  mapTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  userPin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emergencyIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  accuracyCircle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  gpsStatus: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gpsIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  gpsStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  mapControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFC',
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  userRole: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  vehicleInfo: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#059669',
    marginTop: 2,
  },
  accuracyText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  userCardRight: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  lastSeen: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  location: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    maxWidth: 100,
  },
  batteryLevel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#059669',
    marginTop: 2,
  },
  userDetails: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userDetailsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetailsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetailsName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  userDetailsRole: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  closeButton: {
    fontSize: 18,
    color: '#6B7280',
    padding: 4,
  },
  userDetailsContent: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});