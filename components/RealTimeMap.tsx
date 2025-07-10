import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform
} from 'react-native';
import { MapPin, Users, Car, RefreshCw, Zap, Clock, Navigation } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { LocationService } from '@/services/LocationService';

interface MapUser {
  id: string;
  name: string;
  role: 'employee' | 'driver' | 'admin';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: Date;
  };
  status: 'online' | 'offline' | 'emergency';
  vehicleInfo?: {
    plateNumber: string;
    model: string;
  };
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
  const currentUser = AuthService.getCurrentUser();

  // Mock Python map data - In production, this would come from your Python backend
  const mockMapData: MapUser[] = [
    {
      id: 'emp001',
      name: 'Alice Johnson',
      role: 'employee',
      location: {
        latitude: 40.7614,
        longitude: -73.9776,
        address: '123 Main St, New York, NY',
        timestamp: new Date()
      },
      status: 'online'
    },
    {
      id: 'emp002',
      name: 'Bob Smith',
      role: 'employee',
      location: {
        latitude: 40.7505,
        longitude: -73.9934,
        address: '456 Oak Ave, New York, NY',
        timestamp: new Date()
      },
      status: 'online'
    },
    {
      id: 'driver001',
      name: 'Michael Rodriguez',
      role: 'driver',
      location: {
        latitude: 40.7589,
        longitude: -73.9851,
        address: 'Times Square, New York, NY',
        timestamp: new Date()
      },
      status: 'online',
      vehicleInfo: {
        plateNumber: 'ABC-1234',
        model: 'Toyota Hiace'
      }
    },
    {
      id: 'driver002',
      name: 'Jennifer Chen',
      role: 'driver',
      location: {
        latitude: 40.7282,
        longitude: -74.0776,
        address: 'Financial District, New York, NY',
        timestamp: new Date()
      },
      status: 'online',
      vehicleInfo: {
        plateNumber: 'XYZ-5678',
        model: 'Ford Transit'
      }
    }
  ];

  const loadMapUsers = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call to Python backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter users based on role
      let filteredUsers = mockMapData;
      if (filterRole !== 'all') {
        filteredUsers = mockMapData.filter(user => user.role === filterRole);
      }
      
      // Add some randomization to simulate real-time updates
      const updatedUsers = filteredUsers.map(user => ({
        ...user,
        location: {
          ...user.location,
          latitude: user.location.latitude + (Math.random() - 0.5) * 0.001,
          longitude: user.location.longitude + (Math.random() - 0.5) * 0.001,
          timestamp: new Date()
        }
      }));
      
      setUsers(updatedUsers);
    } catch (err) {
      setError('Failed to load map data');
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, filterRole]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMapUsers();
    setRefreshing(false);
  }, [loadMapUsers]);

  useEffect(() => {
    loadMapUsers();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadMapUsers, 30000);
    
    return () => clearInterval(interval);
  }, [loadMapUsers]);

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

  const renderMapView = () => (
    <View style={[styles.mapContainer, { height }]}>
      <View style={styles.mapPlaceholder}>
        <MapPin size={48} color="#9CA3AF" />
        <Text style={styles.mapPlaceholderText}>
          Real-time Map View
        </Text>
        <Text style={styles.mapPlaceholderSubtext}>
          Python-powered location tracking
        </Text>
        
        {/* Simulated map pins */}
        <View style={styles.mapPins}>
          {users.map((user, index) => {
            const RoleIcon = getRoleIcon(user.role);
            return (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.mapPin,
                  {
                    left: `${20 + (index * 15)}%`,
                    top: `${30 + (index * 10)}%`,
                    backgroundColor: getRoleColor(user.role)
                  }
                ]}
                onPress={() => setSelectedUser(user)}
              >
                <RoleIcon size={16} color="#FFFFFF" />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      {/* Map Controls */}
      {showControls && (
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleRefresh}>
            <RefreshCw size={20} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Navigation size={20} color="#2563EB" />
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
      {users.map((user) => {
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
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Zap size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Map Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMapUsers}>
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
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 12,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  mapPins: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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