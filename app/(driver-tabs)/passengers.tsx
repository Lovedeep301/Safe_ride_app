import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput
} from 'react-native';
import { Users, Search, MapPin, CircleCheck as CheckCircle, Clock, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { DriverService } from '@/services/DriverService';

export default function DriverPassengers() {
  const [passengers, setPassengers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPassengers, setFilteredPassengers] = useState<any[]>([]);
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    loadPassengers();
  }, []);

  useEffect(() => {
    filterPassengers();
  }, [searchQuery, passengers]);

  const loadPassengers = async () => {
    if (user) {
      const driverPassengers = await DriverService.getAssignedPassengers(user.id);
      setPassengers(driverPassengers);
    }
  };

  const filterPassengers = () => {
    if (!searchQuery.trim()) {
      setFilteredPassengers(passengers);
    } else {
      const filtered = passengers.filter(passenger =>
        passenger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        passenger.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPassengers(filtered);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked-up': return '#059669';
      case 'waiting': return '#D97706';
      case 'confirmed': return '#2563EB';
      case 'absent': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'picked-up': return CheckCircle;
      case 'waiting': return Clock;
      case 'confirmed': return CheckCircle;
      case 'absent': return AlertTriangle;
      default: return Clock;
    }
  };

  const handleUpdateStatus = async (passengerId: string, newStatus: string) => {
    if (user) {
      await DriverService.updatePassengerStatus(user.id, passengerId, newStatus);
      loadPassengers();
    }
  };

  const renderPassengerCard = ({ item }: { item: any }) => {
    const StatusIcon = getStatusIcon(item.status);
    
    return (
      <View style={styles.passengerCard}>
        <View style={styles.passengerHeader}>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>{item.name}</Text>
            <View style={styles.passengerDetail}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.passengerDetailText}>{item.pickupLocation}</Text>
            </View>
            <View style={styles.passengerDetail}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.passengerDetailText}>{item.pickupTime}</Text>
            </View>
          </View>
        </View>
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            <StatusIcon size={16} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('-', ' ')}
            </Text>
          </View>

          {item.status === 'confirmed' && (
            <TouchableOpacity 
              style={styles.pickupButton}
              onPress={() => handleUpdateStatus(item.id, 'picked-up')}
            >
              <Text style={styles.pickupButtonText}>Mark Picked Up</Text>
            </TouchableOpacity>
          )}

          {item.status === 'waiting' && (
            <View style={styles.statusActions}>
              <TouchableOpacity 
                style={styles.absentButton}
                onPress={() => handleUpdateStatus(item.id, 'absent')}
              >
                <Text style={styles.absentButtonText}>Mark Absent</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.pickupButton}
                onPress={() => handleUpdateStatus(item.id, 'picked-up')}
              >
                <Text style={styles.pickupButtonText}>Picked Up</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Passengers</Text>
        <Text style={styles.headerSubtitle}>
          Manage your assigned passengers
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search passengers..."
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{passengers.filter(p => p.status === 'picked-up').length}</Text>
          <Text style={styles.statLabel}>Picked Up</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{passengers.filter(p => p.status === 'waiting').length}</Text>
          <Text style={styles.statLabel}>Waiting</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{passengers.filter(p => p.status === 'absent').length}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
      </View>

      <FlatList
        data={filteredPassengers}
        keyExtractor={(item) => item.id}
        renderItem={renderPassengerCard}
        style={styles.passengersList}
        contentContainerStyle={styles.passengersContent}
        showsVerticalScrollIndicator={false}
      />
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
    paddingBottom: 16,
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
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 4,
  },
  passengersList: {
    flex: 1,
  },
  passengersContent: {
    paddingHorizontal: 24,
  },
  passengerCard: {
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
  passengerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  passengerInfo: {
    flex: 1,
    marginRight: 12,
  },
  passengerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 6,
  },
  passengerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  passengerDetailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 6,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  pickupButton: {
    backgroundColor: '#059669',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pickupButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  absentButton: {
    backgroundColor: '#6B7280',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  absentButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});