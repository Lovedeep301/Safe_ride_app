import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  Switch,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { Bell, MapPin, Chrome as Home, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Settings, X, Shield, Car, Users, Navigation } from 'lucide-react-native';
import { NotificationService, Notification, NotificationPreferences } from '@/services/NotificationService';
import { GeofencingService } from '@/services/GeofencingService';
import { SafetyReminderService } from '@/services/SafetyReminderService';
import { RouteMonitoringService } from '@/services/RouteMonitoringService';
import { AuthService } from '@/services/AuthService';

export default function SmartNotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeJourneys, setActiveJourneys] = useState<any[]>([]);
  const [routeAlerts, setRouteAlerts] = useState<any[]>([]);
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadPreferences();
      loadActiveJourneys();
      loadRouteAlerts();
      
      // Initialize notification service
      NotificationService.initialize().catch(console.warn);
      
      // Request notification permission
      requestNotificationPermission();
      
      // Start geofencing if user has location
      startGeofencing();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const userNotifications = await NotificationService.getNotifications(user.id);
      setNotifications(userNotifications);
      
      const unread = await NotificationService.getUnreadCount(user.id);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      const userPreferences = await NotificationService.getPreferences(user.id);
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadActiveJourneys = async () => {
    try {
      const journeys = await SafetyReminderService.getActiveJourneys();
      setActiveJourneys(journeys);
    } catch (error) {
      console.error('Error loading active journeys:', error);
    }
  };

  const loadRouteAlerts = async () => {
    try {
      const alerts = await RouteMonitoringService.getActiveAlerts();
      setRouteAlerts(alerts);
    } catch (error) {
      console.error('Error loading route alerts:', error);
    }
  };

  const requestNotificationPermission = async () => {
    const granted = await NotificationService.requestNotificationPermission();
    if (granted && user) {
      await NotificationService.subscribeToPushNotifications(user.id);
    }
  };

  const startGeofencing = async () => {
    if (!user) return;
    
    try {
      // Start geofence monitoring
      await GeofencingService.startGeofenceMonitoring(user.id, user.name);
      
      // Create home geofence if user has home location
      if (user.homeLocation) {
        await GeofencingService.createHomeGeofence(
          user.id,
          user.name,
          user.homeLocation
        );
      }
    } catch (error) {
      console.error('Error starting geofencing:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await NotificationService.markAsRead(notificationId);
    loadNotifications();
  };

  const handleUpdatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user) return;
    
    await NotificationService.updatePreferences(user.id, updates);
    loadPreferences();
  };

  const handleConfirmSafety = async () => {
    if (!user) return;
    
    try {
      await SafetyReminderService.confirmSafetyCheckIn(user.id);
      loadActiveJourneys();
      
      if (Platform.OS === 'web') {
        alert('Safety check-in confirmed!');
      } else {
        Alert.alert('Success', 'Safety check-in confirmed!');
      }
    } catch (error) {
      console.error('Error confirming safety:', error);
    }
  };

  const handleConfirmArrival = async () => {
    if (!user) return;
    
    try {
      await SafetyReminderService.confirmArrival(user.id);
      loadActiveJourneys();
      
      if (Platform.OS === 'web') {
        alert('Arrival confirmed! You are now safe.');
      } else {
        Alert.alert('Success', 'Arrival confirmed! You are now safe.');
      }
    } catch (error) {
      console.error('Error confirming arrival:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'emergency_alert': return AlertTriangle;
      case 'pickup_arrival': return MapPin;
      case 'home_arrival': return Home;
      case 'safety_reminder': return Shield;
      case 'route_delay': return Clock;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'emergency_alert': return '#EF4444';
      case 'pickup_arrival': return '#2563EB';
      case 'home_arrival': return '#10B981';
      case 'safety_reminder': return '#F59E0B';
      case 'route_delay': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const NotificationIcon = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
        onPress={() => handleMarkAsRead(item.id)}
      >
        <View style={styles.notificationLeft}>
          <View style={[
            styles.notificationIcon,
            { backgroundColor: `${getNotificationColor(item.type)}15` }
          ]}>
            <NotificationIcon size={20} color={getNotificationColor(item.type)} />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.notificationRight}>
          <View style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor(item.priority) }
          ]} />
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderActiveJourney = ({ item }: { item: any }) => (
    <View style={styles.journeyCard}>
      <View style={styles.journeyHeader}>
        <Navigation size={20} color="#2563EB" />
        <Text style={styles.journeyTitle}>Active Journey</Text>
        <Text style={styles.journeyTime}>
          {Math.floor((Date.now() - item.startTime.getTime()) / (1000 * 60))}m ago
        </Text>
      </View>
      
      <Text style={styles.journeyUser}>{item.userName}</Text>
      <Text style={styles.journeyStatus}>
        Reminders sent: {item.remindersSent}/{item.maxReminders}
      </Text>
      
      <View style={styles.journeyActions}>
        <TouchableOpacity style={styles.safetyButton} onPress={handleConfirmSafety}>
          <Shield size={16} color="#FFFFFF" />
          <Text style={styles.safetyButtonText}>I'm Safe</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.arrivalButton} onPress={handleConfirmArrival}>
          <Home size={16} color="#FFFFFF" />
          <Text style={styles.arrivalButtonText}>Arrived Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRouteAlert = ({ item }: { item: any }) => (
    <View style={[styles.alertCard, { borderLeftColor: getPriorityColor(item.severity) }]}>
      <View style={styles.alertHeader}>
        <Car size={20} color={getPriorityColor(item.severity)} />
        <Text style={styles.alertType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
        <Text style={[styles.alertSeverity, { color: getPriorityColor(item.severity) }]}>
          {item.severity}
        </Text>
      </View>
      
      <Text style={styles.alertMessage}>{item.message}</Text>
      <Text style={styles.alertTime}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  const renderSettingsModal = () => (
    <Modal
      visible={showSettings}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowSettings(false)}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Notification Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {preferences && (
          <ScrollView style={styles.settingsContent}>
            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Notification Types</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Switch
                  value={preferences.enablePushNotifications}
                  onValueChange={(value) => handleUpdatePreferences({ enablePushNotifications: value })}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Emergency Alerts</Text>
                <Switch
                  value={preferences.emergencyAlerts}
                  onValueChange={(value) => handleUpdatePreferences({ emergencyAlerts: value })}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Safety Reminders</Text>
                <Switch
                  value={preferences.safetyReminders}
                  onValueChange={(value) => handleUpdatePreferences({ safetyReminders: value })}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Route Updates</Text>
                <Switch
                  value={preferences.routeUpdates}
                  onValueChange={(value) => handleUpdatePreferences({ routeUpdates: value })}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Arrival Notifications</Text>
                <Switch
                  value={preferences.arrivalNotifications}
                  onValueChange={(value) => handleUpdatePreferences({ arrivalNotifications: value })}
                />
              </View>
            </View>

            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Quiet Hours</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
                <Switch
                  value={preferences.quietHours.enabled}
                  onValueChange={(value) => handleUpdatePreferences({ 
                    quietHours: { ...preferences.quietHours, enabled: value }
                  })}
                />
              </View>
              
              {preferences.quietHours.enabled && (
                <>
                  <Text style={styles.settingDescription}>
                    Quiet hours: {preferences.quietHours.startTime} - {preferences.quietHours.endTime}
                  </Text>
                  <Text style={styles.settingNote}>
                    Emergency alerts will still be delivered during quiet hours
                  </Text>
                </>
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
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Smart Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount} unread • {notifications.length} total
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Settings size={24} color="#6B7280" />
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active Journeys */}
        {activeJourneys.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛡️ Active Safety Monitoring</Text>
            <FlatList
              data={activeJourneys}
              keyExtractor={(item) => item.userId}
              renderItem={renderActiveJourney}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.journeysList}
            />
          </View>
        )}

        {/* Route Alerts */}
        {routeAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚌 Route Alerts</Text>
            <FlatList
              data={routeAlerts}
              keyExtractor={(item) => item.id}
              renderItem={renderRouteAlert}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Recent Notifications</Text>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyDescription}>
                You'll see safety alerts, route updates, and reminders here
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderNotificationItem}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {renderSettingsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  settingsButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  journeysList: {
    paddingHorizontal: 24,
  },
  journeyCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  journeyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  journeyTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
  },
  journeyUser: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  journeyStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  journeyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  safetyButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  safetyButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  arrivalButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  arrivalButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertType: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  alertSeverity: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  notificationRight: {
    alignItems: 'center',
    gap: 8,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
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
  settingsContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  settingSection: {
    marginBottom: 32,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 8,
  },
  settingNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
});