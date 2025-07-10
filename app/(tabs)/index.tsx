import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  Modal
} from 'react-native';
import { Chrome as Home, MapPin, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Users, MessageCircle, X, Calendar, UserCheck } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { EmployeeService } from '@/services/EmployeeService';
import { LocationService } from '@/services/LocationService';
import EmergencyButton from '@/components/EmergencyButton';
import RealTimeMap from '@/components/RealTimeMap';

type StatusOption = 'home' | 'leave' | 'absent';

export default function HomeScreen() {
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [hasConfirmedArrival, setHasConfirmedArrival] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusOption>('home');

  useEffect(() => {
    loadTodayStatus();
    // Update location periodically
    const interval = setInterval(updateLocation, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const loadTodayStatus = async () => {
    if (user) {
      const status = await EmployeeService.getTodayStatus(user.id);
      setTodayStatus(status);
      setHasConfirmedArrival(status?.arrivedHome || false);
    }
  };

  const updateLocation = async () => {
    if (!user) return;
    
    try {
      const location = await LocationService.getCurrentLocation();
      AuthService.updateUserLocation(user.id, location);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleStatusConfirmation = async () => {
    if (!user) return;

    setIsLoading(true);
    
    try {
      const location = await LocationService.getCurrentLocation();
      let success = false;

      switch (selectedStatus) {
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
        setShowStatusModal(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle;
      case 'pending': return Clock;
      case 'absent': return AlertCircle;
      case 'leave': return Calendar;
      default: return Clock;
    }
  };

  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowStatusModal(false)}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Update Status</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.modalContent}>
          <View style={styles.statusSection}>
            <UserCheck size={48} color="#2563EB" />
            <Text style={styles.statusTitle}>Select Your Current Status</Text>
            <Text style={styles.statusText}>
              Choose the option that best describes your current situation.
            </Text>
          </View>

          <View style={styles.statusOptions}>
            <TouchableOpacity
              style={[
                styles.statusOption,
                selectedStatus === 'home' && styles.statusOptionSelected,
                { borderLeftColor: '#10B981' }
              ]}
              onPress={() => setSelectedStatus('home')}
            >
              <View style={[styles.statusOptionIcon, { backgroundColor: '#ECFDF5' }]}>
                <CheckCircle size={24} color="#10B981" />
              </View>
              <View style={styles.statusOptionInfo}>
                <Text style={styles.statusOptionTitle}>Safely Arrived Home</Text>
                <Text style={styles.statusOptionDescription}>
                  Confirm that you have reached home safely
                </Text>
              </View>
              <View style={[
                styles.radioButton,
                selectedStatus === 'home' && styles.radioButtonSelected
              ]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusOption,
                selectedStatus === 'leave' && styles.statusOptionSelected,
                { borderLeftColor: '#8B5CF6' }
              ]}
              onPress={() => setSelectedStatus('leave')}
            >
              <View style={[styles.statusOptionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Calendar size={24} color="#8B5CF6" />
              </View>
              <View style={styles.statusOptionInfo}>
                <Text style={styles.statusOptionTitle}>On Leave</Text>
                <Text style={styles.statusOptionDescription}>
                  Mark yourself as on leave for today
                </Text>
              </View>
              <View style={[
                styles.radioButton,
                selectedStatus === 'leave' && styles.radioButtonSelected
              ]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusOption,
                selectedStatus === 'absent' && styles.statusOptionSelected,
                { borderLeftColor: '#6B7280' }
              ]}
              onPress={() => setSelectedStatus('absent')}
            >
              <View style={[styles.statusOptionIcon, { backgroundColor: '#F3F4F6' }]}>
                <AlertCircle size={24} color="#6B7280" />
              </View>
              <View style={styles.statusOptionInfo}>
                <Text style={styles.statusOptionTitle}>Absent</Text>
                <Text style={styles.statusOptionDescription}>
                  Mark yourself as absent for today
                </Text>
              </View>
              <View style={[
                styles.radioButton,
                selectedStatus === 'absent' && styles.radioButtonSelected
              ]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.confirmStatusButton, isLoading && styles.confirmStatusButtonDisabled]}
            onPress={handleStatusConfirmation}
            disabled={isLoading}
          >
            <Text style={styles.confirmStatusButtonText}>
              {isLoading ? 'Updating...' : 'Confirm Status'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderMapModal = () => (
    <Modal
      visible={showMapModal}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.mapModalContainer}>
        <View style={styles.mapModalHeader}>
          <TouchableOpacity onPress={() => setShowMapModal(false)}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.mapModalTitle}>Real-time Cab Tracking</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <RealTimeMap showControls={true} />
      </SafeAreaView>
    </Modal>
  );

  const StatusIcon = getStatusIcon(todayStatus?.status || 'pending');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{user?.name || 'Employee'}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIcon}>
              <StatusIcon size={24} color={getStatusColor(todayStatus?.status || 'pending')} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Today's Status</Text>
              <Text style={[
                styles.statusSubtitle,
                { color: getStatusColor(todayStatus?.status || 'pending') }
              ]}>
                {getStatusText(todayStatus?.status || 'pending')}
              </Text>
            </View>
          </View>

          {!hasConfirmedArrival && !todayStatus?.isAbsent && !todayStatus?.isOnLeave && (
            <TouchableOpacity
              style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
              onPress={() => setShowStatusModal(true)}
              disabled={isLoading}
            >
              <UserCheck size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>
                Update Status
              </Text>
            </TouchableOpacity>
          )}

          {todayStatus?.isAbsent && (
            <View style={styles.statusBanner}>
              <AlertCircle size={20} color="#6B7280" />
              <Text style={styles.statusBannerText}>You are marked as absent today</Text>
            </View>
          )}

          {todayStatus?.isOnLeave && (
            <View style={[styles.statusBanner, { backgroundColor: '#F3E8FF' }]}>
              <Calendar size={20} color="#8B5CF6" />
              <Text style={[styles.statusBannerText, { color: '#8B5CF6' }]}>You are on leave today</Text>
            </View>
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Users size={24} color="#2563EB" />
              </View>
              <Text style={styles.actionTitle}>My Groups</Text>
              <Text style={styles.actionSubtitle}>View cab groups</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <MessageCircle size={24} color="#2563EB" />
              </View>
              <Text style={styles.actionTitle}>Messages</Text>
              <Text style={styles.actionSubtitle}>Team chat</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowMapModal(true)}
            >
              <View style={styles.actionIcon}>
                <MapPin size={24} color="#059669" />
              </View>
              <Text style={styles.actionTitle}>Live Map</Text>
              <Text style={styles.actionSubtitle}>Track cab location</Text>
            </TouchableOpacity>
          </View>
        </View>

        {todayStatus?.arrivalTime && (
          <View style={styles.arrivalInfo}>
            <Text style={styles.sectionTitle}>Status Details</Text>
            <View style={styles.arrivalCard}>
              <View style={styles.arrivalRow}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.arrivalText}>
                  Updated at {new Date(todayStatus.arrivalTime).toLocaleTimeString()}
                </Text>
              </View>
              {todayStatus.location && (
                <View style={styles.arrivalRow}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.arrivalText}>
                    Location: {todayStatus.location.address || 'Current Location'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Emergency Button */}
      <EmergencyButton style={styles.emergencyButton} />

      {/* Status Modal */}
      {renderStatusModal()}

      {/* Map Modal */}
      {renderMapModal()}
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
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  statusCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  statusSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statusBanner: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBannerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  quickActions: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
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
    minWidth: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  arrivalInfo: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  arrivalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  arrivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  arrivalText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  emergencyButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
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
  statusSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusOptions: {
    marginBottom: 32,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusOptionSelected: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  statusOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusOptionInfo: {
    flex: 1,
  },
  statusOptionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  statusOptionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  radioButtonSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  confirmStatusButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmStatusButtonDisabled: {
    opacity: 0.6,
  },
  confirmStatusButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mapModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
});