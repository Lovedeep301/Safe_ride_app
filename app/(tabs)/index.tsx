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
  Modal,
  Dimensions
} from 'react-native';
import { Chrome as Home, MapPin, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Users, MessageCircle, X, Calendar, UserCheck, Zap, TrendingUp, Shield } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { EmployeeService } from '@/services/EmployeeService';
import { LocationService } from '@/services/LocationService';
import EmergencyButton from '@/components/EmergencyButton';
import RealTimeMap from '@/components/RealTimeMap';
import { LinearGradient } from 'expo-linear-gradient';

type StatusOption = 'home' | 'leave' | 'absent';

const { width } = Dimensions.get('window');

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
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.modalGradient}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Update Status</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.statusSection}>
              <View style={styles.statusIconContainer}>
                <UserCheck size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.statusTitle}>Select Your Status</Text>
              <Text style={styles.statusText}>
                Choose the option that best describes your current situation.
              </Text>
            </View>

            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  selectedStatus === 'home' && styles.statusOptionSelected,
                ]}
                onPress={() => setSelectedStatus('home')}
              >
                <LinearGradient
                  colors={selectedStatus === 'home' ? ['#10B981', '#059669'] : ['#FFFFFF', '#F9FAFB']}
                  style={styles.statusOptionGradient}
                >
                  <View style={[styles.statusOptionIcon, { backgroundColor: selectedStatus === 'home' ? 'rgba(255,255,255,0.2)' : '#ECFDF5' }]}>
                    <CheckCircle size={24} color={selectedStatus === 'home' ? '#FFFFFF' : '#10B981'} />
                  </View>
                  <View style={styles.statusOptionInfo}>
                    <Text style={[styles.statusOptionTitle, { color: selectedStatus === 'home' ? '#FFFFFF' : '#1F2937' }]}>
                      Safely Arrived Home
                    </Text>
                    <Text style={[styles.statusOptionDescription, { color: selectedStatus === 'home' ? 'rgba(255,255,255,0.8)' : '#6B7280' }]}>
                      Confirm that you have reached home safely
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusOption,
                  selectedStatus === 'leave' && styles.statusOptionSelected,
                ]}
                onPress={() => setSelectedStatus('leave')}
              >
                <LinearGradient
                  colors={selectedStatus === 'leave' ? ['#8B5CF6', '#7C3AED'] : ['#FFFFFF', '#F9FAFB']}
                  style={styles.statusOptionGradient}
                >
                  <View style={[styles.statusOptionIcon, { backgroundColor: selectedStatus === 'leave' ? 'rgba(255,255,255,0.2)' : '#F3E8FF' }]}>
                    <Calendar size={24} color={selectedStatus === 'leave' ? '#FFFFFF' : '#8B5CF6'} />
                  </View>
                  <View style={styles.statusOptionInfo}>
                    <Text style={[styles.statusOptionTitle, { color: selectedStatus === 'leave' ? '#FFFFFF' : '#1F2937' }]}>
                      On Leave
                    </Text>
                    <Text style={[styles.statusOptionDescription, { color: selectedStatus === 'leave' ? 'rgba(255,255,255,0.8)' : '#6B7280' }]}>
                      Mark yourself as on leave for today
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusOption,
                  selectedStatus === 'absent' && styles.statusOptionSelected,
                ]}
                onPress={() => setSelectedStatus('absent')}
              >
                <LinearGradient
                  colors={selectedStatus === 'absent' ? ['#6B7280', '#4B5563'] : ['#FFFFFF', '#F9FAFB']}
                  style={styles.statusOptionGradient}
                >
                  <View style={[styles.statusOptionIcon, { backgroundColor: selectedStatus === 'absent' ? 'rgba(255,255,255,0.2)' : '#F3F4F6' }]}>
                    <AlertCircle size={24} color={selectedStatus === 'absent' ? '#FFFFFF' : '#6B7280'} />
                  </View>
                  <View style={styles.statusOptionInfo}>
                    <Text style={[styles.statusOptionTitle, { color: selectedStatus === 'absent' ? '#FFFFFF' : '#1F2937' }]}>
                      Absent
                    </Text>
                    <Text style={[styles.statusOptionDescription, { color: selectedStatus === 'absent' ? 'rgba(255,255,255,0.8)' : '#6B7280' }]}>
                      Mark yourself as absent for today
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.confirmStatusButton, isLoading && styles.confirmStatusButtonDisabled]}
              onPress={handleStatusConfirmation}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.confirmButtonGradient}
              >
                <Text style={styles.confirmStatusButtonText}>
                  {isLoading ? 'Updating...' : 'Confirm Status'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
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
          <Text style={styles.mapModalTitle}>Live Tracking</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <RealTimeMap showControls={true} />
      </SafeAreaView>
    </Modal>
  );

  const StatusIcon = getStatusIcon(todayStatus?.status || 'pending');

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      />
      
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
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
            style={styles.statusCardGradient}
          >
            <View style={styles.statusHeader}>
              <View style={[styles.statusIcon, { backgroundColor: `${getStatusColor(todayStatus?.status || 'pending')}20` }]}>
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
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {todayStatus?.status === 'confirmed' ? '✓' : '○'}
                </Text>
              </View>
            </View>

            {!hasConfirmedArrival && !todayStatus?.isAbsent && !todayStatus?.isOnLeave && (
              <TouchableOpacity
                style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
                onPress={() => setShowStatusModal(true)}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  style={styles.confirmButtonGradient}
                >
                  <UserCheck size={20} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>Update Status</Text>
                  <Zap size={16} color="#FFFFFF" />
                </LinearGradient>
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
          </LinearGradient>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.actionGradient}
              >
                <View style={styles.actionIcon}>
                  <Users size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.actionTitle}>My Groups</Text>
                <Text style={styles.actionSubtitle}>View cab groups</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.actionGradient}
              >
                <View style={styles.actionIcon}>
                  <MessageCircle size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.actionTitle}>Messages</Text>
                <Text style={styles.actionSubtitle}>Team chat</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowMapModal(true)}
            >
              <LinearGradient
                colors={['#11998e', '#38ef7d']}
                style={styles.actionGradient}
              >
                <View style={styles.actionIcon}>
                  <MapPin size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.actionTitle}>Live Map</Text>
                <Text style={styles.actionSubtitle}>Track location</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {todayStatus?.arrivalTime && (
          <View style={styles.arrivalInfo}>
            <Text style={styles.sectionTitle}>Status Details</Text>
            <View style={styles.arrivalCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                style={styles.arrivalCardGradient}
              >
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
              </LinearGradient>
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
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  nameText: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statusCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  statusCardGradient: {
    padding: 24,
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
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#6B7280',
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    minWidth: (width - 72) / 3,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  arrivalInfo: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  arrivalCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  arrivalCardGradient: {
    padding: 16,
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
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
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
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusOptions: {
    marginBottom: 32,
    gap: 16,
  },
  statusOption: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusOptionSelected: {
    transform: [{ scale: 1.02 }],
  },
  statusOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
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
  },
  statusOptionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  confirmStatusButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmStatusButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
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