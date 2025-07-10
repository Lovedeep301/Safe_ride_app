import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { MessageCircle, TriangleAlert as AlertTriangle, MapPin, Send, CircleCheck as CheckCircle, Users } from 'lucide-react-native';
import { FirebaseMessageService } from '@/services/FirebaseMessageService';
import { FirebaseEmergencyService } from '@/services/FirebaseEmergencyService';
import { FirebaseLocationService } from '@/services/FirebaseLocationService';
import { AuthService } from '@/services/AuthService';

export default function TestFirebaseFeatures() {
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [testMessage, setTestMessage] = useState('Hello from Firebase!');
  const [messages, setMessages] = useState<any[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
  const [locationUpdates, setLocationUpdates] = useState<any[]>([]);
  const user = AuthService.getCurrentUser();

  const updateTestResult = (testName: string, result: 'success' | 'error') => {
    setTestResults(prev => ({ ...prev, [testName]: result }));
  };

  // Test Real-time Messaging
  const testMessaging = async () => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Create a test conversation
      const conversation = await FirebaseMessageService.createConversation({
        type: 'group',
        name: 'Test Group Chat',
        participants: [user.id, 'test-user-2'],
        unreadCount: 0
      });

      // Send a test message
      await FirebaseMessageService.sendMessage(
        conversation.id,
        testMessage,
        user.id,
        user.name
      );

      // Subscribe to messages
      const unsubscribe = FirebaseMessageService.subscribeToMessages(conversation.id, (newMessages) => {
        setMessages(newMessages);
        updateTestResult('messaging', 'success');
      });

      // Clean up after 5 seconds
      setTimeout(() => {
        unsubscribe();
      }, 5000);

    } catch (error) {
      console.error('Messaging test failed:', error);
      updateTestResult('messaging', 'error');
    }
  };

  // Test Emergency Alerts
  const testEmergencyAlerts = async () => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Create a test emergency alert
      await FirebaseEmergencyService.createEmergencyAlert(
        user.id,
        user.name,
        user.role as 'employee' | 'driver',
        'panic',
        'Test emergency alert - please ignore',
        {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Test Location, New York, NY'
        }
      );

      // Subscribe to emergency alerts
      const unsubscribe = FirebaseEmergencyService.subscribeToActiveAlerts((alerts) => {
        setEmergencyAlerts(alerts);
        updateTestResult('emergency', 'success');
      });

      // Clean up after 5 seconds
      setTimeout(() => {
        unsubscribe();
      }, 5000);

    } catch (error) {
      console.error('Emergency alerts test failed:', error);
      updateTestResult('emergency', 'error');
    }
  };

  // Test Location Tracking
  const testLocationTracking = async () => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Update user location
      await FirebaseLocationService.updateUserLocation(
        user.id,
        user.name,
        user.role as 'employee' | 'driver' | 'admin',
        {
          latitude: 40.7128 + Math.random() * 0.01,
          longitude: -74.0060 + Math.random() * 0.01,
          accuracy: 10,
          timestamp: Date.now(),
          address: 'Test Location Update'
        },
        85 // Battery level
      );

      // Subscribe to location updates
      const unsubscribe = FirebaseLocationService.subscribeToLocationUpdates((locations) => {
        setLocationUpdates(locations);
        updateTestResult('location', 'success');
      });

      // Clean up after 5 seconds
      setTimeout(() => {
        unsubscribe();
      }, 5000);

    } catch (error) {
      console.error('Location tracking test failed:', error);
      updateTestResult('location', 'error');
    }
  };

  const runAllTests = async () => {
    setTestResults({
      messaging: 'pending',
      emergency: 'pending',
      location: 'pending'
    });

    await testMessaging();
    await testEmergencyAlerts();
    await testLocationTracking();
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'success': return <CheckCircle size={20} color="#10B981" />;
      case 'error': return <AlertTriangle size={20} color="#EF4444" />;
      default: return <View style={styles.pendingDot} />;
    }
  };

  const getStatusColor = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Authentication Required</Text>
          <Text style={styles.errorText}>
            Please log in to test Firebase features
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Test Firebase Features</Text>
          <Text style={styles.subtitle}>
            Verify that real-time features are working correctly
          </Text>
        </View>

        <View style={styles.testSection}>
          <TouchableOpacity style={styles.runAllButton} onPress={runAllTests}>
            <Text style={styles.runAllButtonText}>Run All Tests</Text>
          </TouchableOpacity>
        </View>

        {/* Messaging Test */}
        <View style={styles.testCard}>
          <View style={styles.testHeader}>
            <MessageCircle size={24} color="#2563EB" />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>Real-time Messaging</Text>
              <Text style={styles.testDescription}>Test group and direct chat</Text>
            </View>
            {getStatusIcon(testResults.messaging)}
          </View>

          <View style={styles.testContent}>
            <TextInput
              style={styles.testInput}
              value={testMessage}
              onChangeText={setTestMessage}
              placeholder="Enter test message"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.testButton} onPress={testMessaging}>
              <Send size={16} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Test Messaging</Text>
            </TouchableOpacity>

            {messages.length > 0 && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Messages ({messages.length}):</Text>
                {messages.slice(-3).map((msg, index) => (
                  <Text key={index} style={styles.resultText}>
                    {msg.senderName}: {msg.content}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Emergency Alerts Test */}
        <View style={styles.testCard}>
          <View style={styles.testHeader}>
            <AlertTriangle size={24} color="#EF4444" />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>Emergency Alerts</Text>
              <Text style={styles.testDescription}>Test live emergency notifications</Text>
            </View>
            {getStatusIcon(testResults.emergency)}
          </View>

          <View style={styles.testContent}>
            <TouchableOpacity style={[styles.testButton, { backgroundColor: '#EF4444' }]} onPress={testEmergencyAlerts}>
              <AlertTriangle size={16} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Test Emergency Alert</Text>
            </TouchableOpacity>

            {emergencyAlerts.length > 0 && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Active Alerts ({emergencyAlerts.length}):</Text>
                {emergencyAlerts.slice(-3).map((alert, index) => (
                  <Text key={index} style={styles.resultText}>
                    {alert.type}: {alert.message}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Location Tracking Test */}
        <View style={styles.testCard}>
          <View style={styles.testHeader}>
            <MapPin size={24} color="#059669" />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>Location Tracking</Text>
              <Text style={styles.testDescription}>Test real-time GPS updates</Text>
            </View>
            {getStatusIcon(testResults.location)}
          </View>

          <View style={styles.testContent}>
            <TouchableOpacity style={[styles.testButton, { backgroundColor: '#059669' }]} onPress={testLocationTracking}>
              <MapPin size={16} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Test Location Update</Text>
            </TouchableOpacity>

            {locationUpdates.length > 0 && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Location Updates ({locationUpdates.length}):</Text>
                {locationUpdates.slice(-3).map((update, index) => (
                  <Text key={index} style={styles.resultText}>
                    {update.userName}: {update.location.address}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All tests should show green checkmarks when Firebase is properly configured.
          </Text>
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
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  testSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  runAllButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  runAllButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  testInfo: {
    flex: 1,
    marginLeft: 12,
  },
  testTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  testDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  testContent: {
    gap: 12,
  },
  testInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  testButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  resultContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  resultTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  pendingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
  },
});