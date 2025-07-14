import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';
import { TriangleAlert as AlertTriangle, X, Phone, Shield, Car, Heart } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { EmergencyService } from '@/services/EmergencyService';
import { LocationService } from '@/services/LocationService';

interface EmergencyButtonProps {
  style?: any;
}

export default function EmergencyButton({ style }: EmergencyButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const user = AuthService.getCurrentUser();

  const emergencyTypes = [
    {
      type: 'panic' as const,
      title: 'Personal Emergency',
      description: 'Immediate help needed',
      icon: AlertTriangle,
      color: '#DC2626'
    },
    {
      type: 'medical' as const,
      title: 'Medical Emergency',
      description: 'Medical assistance required',
      icon: Heart,
      color: '#EF4444'
    },
    {
      type: 'security' as const,
      title: 'Security Issue',
      description: 'Safety concern or threat',
      icon: Shield,
      color: '#F59E0B'
    },
    {
      type: 'breakdown' as const,
      title: 'Vehicle Breakdown',
      description: 'Vehicle assistance needed',
      icon: Car,
      color: '#6B7280'
    }
  ];

  const handleEmergencyAlert = async (type: any, message: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const location = await LocationService.getCurrentLocation();
      
      await EmergencyService.createEmergencyAlert(
        user.id,
        user.name,
        user.role as 'employee' | 'driver',
        type,
        message,
        location
      );

      setShowModal(false);
      
      if (Platform.OS === 'web') {
        alert('Emergency alert sent successfully! Help is on the way.');
      } else {
        Alert.alert('Emergency Alert Sent', 'Help is on the way. Stay safe!');
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      if (Platform.OS === 'web') {
        alert('Failed to send emergency alert. Please try again or call emergency services.');
      } else {
        Alert.alert('Error', 'Failed to send emergency alert. Please try again or call emergency services.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickEmergency = () => {
    const confirmAlert = Platform.OS === 'web' 
      ? window.confirm('Send immediate emergency alert?')
      : Alert.alert(
          'Emergency Alert',
          'Send immediate emergency alert?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Send Alert', onPress: () => handleEmergencyAlert('panic', 'Emergency assistance needed'), style: 'destructive' }
          ]
        );

    if (Platform.OS === 'web' && confirmAlert) {
      handleEmergencyAlert('panic', 'Emergency assistance needed');
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.emergencyButton, style]}
        onPress={handleQuickEmergency}
        onLongPress={() => setShowModal(true)}
      >
        <AlertTriangle size={24} color="#FFFFFF" />
        <Text style={styles.emergencyButtonText}>SOS</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Emergency Alert</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.warningSection}>
              <AlertTriangle size={48} color="#DC2626" />
              <Text style={styles.warningTitle}>Emergency Services</Text>
              <Text style={styles.warningText}>
                Select the type of emergency to send an alert to administrators and emergency contacts.
              </Text>
            </View>

            <View style={styles.emergencyTypes}>
              {emergencyTypes.map((emergency) => {
                const IconComponent = emergency.icon;
                return (
                  <TouchableOpacity
                    key={emergency.type}
                    style={[styles.emergencyTypeCard, { borderLeftColor: emergency.color }]}
                    onPress={() => handleEmergencyAlert(emergency.type, emergency.description)}
                    disabled={isLoading}
                  >
                    <View style={[styles.emergencyTypeIcon, { backgroundColor: `${emergency.color}15` }]}>
                      <IconComponent size={24} color={emergency.color} />
                    </View>
                    <View style={styles.emergencyTypeInfo}>
                      <Text style={styles.emergencyTypeTitle}>{emergency.title}</Text>
                      <Text style={styles.emergencyTypeDescription}>{emergency.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.emergencyContact}>
              <Phone size={20} color="#2563EB" />
              <Text style={styles.emergencyContactText}>
                For immediate life-threatening emergencies, call 911
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  emergencyButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emergencyButtonText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 2,
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
  warningSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  warningTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  emergencyTypes: {
    marginBottom: 32,
  },
  emergencyTypeCard: {
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
  emergencyTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  emergencyTypeInfo: {
    flex: 1,
  },
  emergencyTypeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  emergencyTypeDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  emergencyContact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  emergencyContactText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    flex: 1,
  },
});