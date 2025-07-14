import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList
} from 'react-native';
import { Car, Users, MapPin, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Navigation, Fuel, Activity } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { DriverService } from '@/services/DriverService';

export default function DriverDashboard() {
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [todayRoutes, setTodayRoutes] = useState<any[]>([]);
  const [vehicleStatus, setVehicleStatus] = useState<any>(null);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    if (user) {
      const routes = await DriverService.getTodayRoutes(user.id);
      const vehicle = await DriverService.getVehicleStatus(user.id);
      const dutyStatus = await DriverService.getDutyStatus(user.id);
      const activeRoute = await DriverService.getCurrentRoute(user.id);
      
      setTodayRoutes(routes);
      setVehicleStatus(vehicle);
      setIsOnDuty(dutyStatus);
      setCurrentRoute(activeRoute);
    }
  };

  const handleDutyToggle = async () => {
    if (user) {
      const newStatus = await DriverService.toggleDutyStatus(user.id);
      setIsOnDuty(newStatus);
    }
  };

  const handleStartRoute = async (routeId: string) => {
    if (user) {
      const route = await DriverService.startRoute(user.id, routeId);
      setCurrentRoute(route);
      loadDriverData();
    }
  };

  const handleCompleteRoute = async () => {
    if (user && currentRoute) {
      await DriverService.completeRoute(user.id, currentRoute.id);
      setCurrentRoute(null);
      loadDriverData();
    }
  };

  const getRouteStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'in-progress': return '#D97706';
      case 'scheduled': return '#2563EB';
      default: return '#6B7280';
    }
  };

  const renderRouteCard = ({ item }: { item: any }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{item.name}</Text>
          <View style={styles.routeDetails}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.routeText}>{item.pickup} → {item.destination}</Text>
          </View>
          <View style={styles.routeDetails}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.routeText}>{item.scheduledTime}</Text>
          </View>
          <View style={styles.routeDetails}>
            <Users size={14} color="#6B7280" />
            <Text style={styles.routeText}>{item.passengers.length} passengers</Text>
          </View>
        </View>
        
        <View style={styles.routeActions}>
          <View style={[styles.statusBadge, { backgroundColor: `${getRouteStatusColor(item.status)}15` }]}>
            <Text style={[styles.statusText, { color: getRouteStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
          
          {item.status === 'scheduled' && isOnDuty && (
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => handleStartRoute(item.id)}
            >
              <Navigation size={16} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{user?.name || 'Driver'}</Text>
          <Text style={styles.vehicleText}>
            {user?.vehicleInfo?.model} • {user?.vehicleInfo?.plateNumber}
          </Text>
        </View>

        {/* Duty Status Card */}
        <View style={styles.dutyCard}>
          <View style={styles.dutyHeader}>
            <View style={styles.dutyInfo}>
              <Text style={styles.dutyTitle}>Duty Status</Text>
              <Text style={[styles.dutyStatus, { color: isOnDuty ? '#059669' : '#6B7280' }]}>
                {isOnDuty ? 'On Duty' : 'Off Duty'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.dutyToggle, { backgroundColor: isOnDuty ? '#059669' : '#6B7280' }]}
              onPress={handleDutyToggle}
            >
              <Text style={styles.dutyToggleText}>
                {isOnDuty ? 'Go Off Duty' : 'Go On Duty'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Current Route Card */}
        {currentRoute && (
          <View style={styles.currentRouteCard}>
            <View style={styles.currentRouteHeader}>
              <Activity size={24} color="#D97706" />
              <Text style={styles.currentRouteTitle}>Current Route</Text>
            </View>
            
            <Text style={styles.currentRouteName}>{currentRoute.name}</Text>
            <View style={styles.currentRouteDetails}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.currentRouteText}>
                {currentRoute.pickup} → {currentRoute.destination}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={handleCompleteRoute}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Complete Route</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Vehicle Status */}
        {vehicleStatus && (
          <View style={styles.vehicleCard}>
            <Text style={styles.sectionTitle}>Vehicle Status</Text>
            <View style={styles.vehicleStats}>
              <View style={styles.vehicleStat}>
                <Fuel size={20} color="#2563EB" />
                <Text style={styles.vehicleStatLabel}>Fuel</Text>
                <Text style={styles.vehicleStatValue}>{vehicleStatus.fuelLevel}%</Text>
              </View>
              <View style={styles.vehicleStat}>
                <Car size={20} color="#2563EB" />
                <Text style={styles.vehicleStatLabel}>Mileage</Text>
                <Text style={styles.vehicleStatValue}>{vehicleStatus.mileage} km</Text>
              </View>
              <View style={styles.vehicleStat}>
                <CheckCircle size={20} color="#059669" />
                <Text style={styles.vehicleStatLabel}>Status</Text>
                <Text style={[styles.vehicleStatValue, { color: '#059669' }]}>Good</Text>
              </View>
            </View>
          </View>
        )}

        {/* Today's Routes */}
        <View style={styles.routesSection}>
          <Text style={styles.sectionTitle}>Today's Routes</Text>
          <FlatList
            data={todayRoutes}
            keyExtractor={(item) => item.id}
            renderItem={renderRouteCard}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  nameText: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 4,
  },
  vehicleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#059669',
    marginTop: 4,
  },
  dutyCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dutyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dutyInfo: {
    flex: 1,
  },
  dutyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  dutyStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  dutyToggle: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dutyToggleText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  currentRouteCard: {
    marginHorizontal: 24,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  currentRouteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentRouteTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
    marginLeft: 8,
  },
  currentRouteName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  currentRouteDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentRouteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 6,
  },
  completeButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  vehicleCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  vehicleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehicleStat: {
    alignItems: 'center',
    flex: 1,
  },
  vehicleStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 8,
  },
  vehicleStatValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 4,
  },
  routesSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeInfo: {
    flex: 1,
    marginRight: 12,
  },
  routeName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 6,
  },
  routeActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  startButton: {
    backgroundColor: '#059669',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});