import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Modal,
  ScrollView
} from 'react-native';
import { MapPin, Clock, Users, Navigation, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, X, Phone } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { DriverService } from '@/services/DriverService';

export default function DriverRoutes() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    if (user) {
      const driverRoutes = await DriverService.getAllRoutes(user.id);
      setRoutes(driverRoutes);
    }
  };

  const handleRoutePress = async (route: any) => {
    const routeDetails = await DriverService.getRouteDetails(route.id);
    setSelectedRoute(routeDetails);
    setShowRouteDetails(true);
  };

  const handleStartRoute = async (routeId: string) => {
    if (user) {
      await DriverService.startRoute(user.id, routeId);
      setShowRouteDetails(false);
      loadRoutes();
    }
  };

  const getRouteStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'in-progress': return '#D97706';
      case 'scheduled': return '#2563EB';
      case 'cancelled': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getRouteStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in-progress': return Navigation;
      case 'scheduled': return Clock;
      case 'cancelled': return AlertTriangle;
      default: return Clock;
    }
  };

  const renderRouteCard = ({ item }: { item: any }) => {
    const StatusIcon = getRouteStatusIcon(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.routeCard}
        onPress={() => handleRoutePress(item)}
      >
        <View style={styles.routeHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{item.name}</Text>
            <View style={styles.routeDetail}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.routeDetailText}>{item.pickup} → {item.destination}</Text>
            </View>
            <View style={styles.routeDetail}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.routeDetailText}>{item.scheduledTime}</Text>
            </View>
            <View style={styles.routeDetail}>
              <Users size={14} color="#6B7280" />
              <Text style={styles.routeDetailText}>{item.passengerCount} passengers</Text>
            </View>
          </View>
          
          <View style={styles.routeStatus}>
            <View style={[styles.statusBadge, { backgroundColor: `${getRouteStatusColor(item.status)}15` }]}>
              <StatusIcon size={16} color={getRouteStatusColor(item.status)} />
              <Text style={[styles.statusText, { color: getRouteStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRouteDetailsModal = () => (
    <Modal
      visible={showRouteDetails}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowRouteDetails(false)}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Route Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {selectedRoute && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.routeDetailsCard}>
              <Text style={styles.routeDetailsName}>{selectedRoute.name}</Text>
              
              <View style={styles.routeDetailsSection}>
                <Text style={styles.sectionTitle}>Route Information</Text>
                <View style={styles.detailRow}>
                  <MapPin size={20} color="#2563EB" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Pickup Location</Text>
                    <Text style={styles.detailValue}>{selectedRoute.pickup}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <MapPin size={20} color="#DC2626" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Destination</Text>
                    <Text style={styles.detailValue}>{selectedRoute.destination}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={20} color="#6B7280" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Scheduled Time</Text>
                    <Text style={styles.detailValue}>{selectedRoute.scheduledTime}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.routeDetailsSection}>
                <Text style={styles.sectionTitle}>Passengers ({selectedRoute.passengers?.length || 0})</Text>
                {selectedRoute.passengers?.map((passenger: any, index: number) => (
                  <View key={index} style={styles.passengerItem}>
                    <View style={styles.passengerInfo}>
                      <Text style={styles.passengerName}>{passenger.name}</Text>
                      <Text style={styles.passengerLocation}>{passenger.pickupPoint}</Text>
                    </View>
                    <TouchableOpacity style={styles.callButton}>
                      <Phone size={16} color="#2563EB" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {selectedRoute.status === 'scheduled' && (
                <TouchableOpacity 
                  style={styles.startRouteButton}
                  onPress={() => handleStartRoute(selectedRoute.id)}
                >
                  <Navigation size={20} color="#FFFFFF" />
                  <Text style={styles.startRouteButtonText}>Start Route</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Routes</Text>
        <Text style={styles.headerSubtitle}>
          Manage your assigned routes and passengers
        </Text>
      </View>

      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={renderRouteCard}
        style={styles.routesList}
        contentContainerStyle={styles.routesContent}
        showsVerticalScrollIndicator={false}
      />

      {renderRouteDetailsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  routesList: {
    flex: 1,
  },
  routesContent: {
    paddingHorizontal: 24,
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
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeDetailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 6,
  },
  routeStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  routeDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  routeDetailsName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  routeDetailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 2,
  },
  passengerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  passengerLocation: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startRouteButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startRouteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});