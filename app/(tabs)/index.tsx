import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Chrome as Home, MapPin, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Users, MessageCircle, Settings } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { EmployeeService } from '@/services/EmployeeService';
import { LocationService } from '@/services/LocationService';
import EmergencyButton from '@/components/EmergencyButton';

type StatusOption = 'home' | 'leave' | 'absent';

export default function HomeScreen() {
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [hasConfirmedArrival, setHasConfirmedArrival] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [todayStatus, setTodayStatus] = useState<any>(null);

  useEffect(() => {
    loadTodayStatus();
  }, []);

  const loadTodayStatus = async () => {
    if (user) {
      const status = await EmployeeService.getTodayStatus(user.id);
      setTodayStatus(status);
      setHasConfirmedArrival(status?.arrivedHome || false);
    }
  };

  const handleStatusConfirmation = async (statusType: StatusOption) => {
    if (!user) return;

    setIsLoading(true);
    
    try {
      const location = await LocationService.getCurrentLocation();
      let success = false;

      switch (statusType) {
        case 'home':
          success = await EmployeeService.confirmArrival(user.id, location);
          if (success) {
            setHasConfirmedArrival(true);
            if (Platform.OS === 'web') {
              alert('Home arrival confirmed successfully!');
            } else {
              Alert.alert('Success', 'Home arrival confirmed successfully!');
            }
          }
          break;
        case 'leave':
          success = await EmployeeService.markOnLeave(user.id);
          if (success) {
            if (Platform.OS === 'web') {
              alert('Leave status updated successfully!');
            } else {
              Alert.alert('Success', 'Leave status updated successfully!');
            }
          }
          break;
        case 'absent':
          success = await EmployeeService.markAbsent(user.id);
          if (success) {
            if (Platform.OS === 'web') {
              alert('Absent status updated successfully!');
            } else {
              Alert.alert('Success', 'Absent status updated successfully!');
            }
          }
          break;
      }

      if (!success) {
        if (Platform.OS === 'web') {
          alert('Failed to update status. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to update status. Please try again.');
        }
      } else {
        loadTodayStatus();
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('Failed to get location. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to get location. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'absent': return '#6B7280';
      case 'leave': return '#8B5CF6';
      default: return '#EF4444';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Arrived Home';
      case 'pending': return 'Journey in Progress';
      case 'absent': return 'Absent';
      case 'leave': return 'On Leave';
      default: return 'Not Confirmed';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.nameText}>{user?.name || 'Employee'}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Today's Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(todayStatus?.status || 'pending') }]}>
              <Text style={styles.statusBadgeText}>
                {getStatusText(todayStatus?.status || 'pending')}
              </Text>
            </View>
          </View>

          {!hasConfirmedArrival && !todayStatus?.isAbsent && !todayStatus?.isOnLeave && (
            <View style={styles.statusActions}>
              <TouchableOpacity
                style={[styles.statusButton, styles.homeButton]}
                onPress={() => handleStatusConfirmation('home')}
                disabled={isLoading}
              >
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.statusButtonText}>Arrived Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusButton, styles.leaveButton]}
                onPress={() => handleStatusConfirmation('leave')}
                disabled={isLoading}
              >
                <Clock size={20} color="#FFFFFF" />
                <Text style={styles.statusButtonText}>On Leave</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusButton, styles.absentButton]}
                onPress={() => handleStatusConfirmation('absent')}
                disabled={isLoading}
              >
                <AlertCircle size={20} color="#FFFFFF" />
                <Text style={styles.statusButtonText}>Absent</Text>
              </TouchableOpacity>
            </View>
          )}

          {todayStatus?.isAbsent && (
            <View style={styles.statusMessage}>
              <AlertCircle size={20} color="#6B7280" />
              <Text style={styles.statusMessageText}>You are marked as absent today</Text>
            </View>
          )}

          {todayStatus?.isOnLeave && (
            <View style={styles.statusMessage}>
              <Clock size={20} color="#8B5CF6" />
              <Text style={styles.statusMessageText}>You are on leave today</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Users size={24} color="#2563EB" />
              <Text style={styles.actionTitle}>Groups</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <MessageCircle size={24} color="#2563EB" />
              <Text style={styles.actionTitle}>Messages</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <MapPin size={24} color="#2563EB" />
              <Text style={styles.actionTitle}>Location</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Settings size={24} color="#2563EB" />
              <Text style={styles.actionTitle}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Details */}
        {todayStatus?.arrivalTime && (
          <View style={styles.statusDetails}>
            <Text style={styles.sectionTitle}>Status Details</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.detailText}>
                  Updated at {new Date(todayStatus.arrivalTime).toLocaleTimeString()}
                </Text>
              </View>
              {todayStatus.location && (
                <View style={styles.detailRow}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {todayStatus.location.address || 'Current Location'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        </ScrollView>
      <View style={styles.emergencyButtonContainer}>
        <EmergencyButton style={styles.emergencyButton} />
      </View>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  nameText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statusActions: {
    gap: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  homeButton: {
    backgroundColor: '#10B981',
  },
  leaveButton: {
    backgroundColor: '#8B5CF6',
  },
  absentButton: {
    backgroundColor: '#6B7280',
  },
  statusButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  statusMessageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  quickActions: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginTop: 8,
  },
  statusDetails: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 100,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  emergencyButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  emergencyButton: {
    // Remove absolute positioning since it's handled by container
  },
});