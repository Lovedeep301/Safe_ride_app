import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Users, UserPlus, Settings, LogOut, Search, TriangleAlert as AlertTriangle, MapPin, Shield, Car, X, CircleCheck as CheckCircle, Clock, User, Bell, Lock, CircleHelp as HelpCircle } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { EmergencyService } from '@/services/EmergencyService';
import RealTimeMap from '@/components/RealTimeMap';

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'employee' | 'driver' | 'admin'>('all');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEmergencyDetails, setShowEmergencyDetails] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = AuthService.getCurrentUser();

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    uniqueId: '',
    email: '',
    phone: '',
    role: 'employee' as 'employee' | 'driver' | 'admin',
    password: ''
  });

  useEffect(() => {
    if (!currentUser) {
      router.replace('/auth');
      return;
    }
    
    if (currentUser.role === 'admin') {
      loadUsers();
      loadEmergencyAlerts();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      const allUsers = await AuthService.getAllUsers();
      setUsers(Array.isArray(allUsers) ? allUsers : []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadEmergencyAlerts = async () => {
    try {
      const alerts = await EmergencyService.getActiveAlerts();
      setEmergencyAlerts(Array.isArray(alerts) ? alerts : []);
    } catch (error) {
      console.error('Error loading emergency alerts:', error);
      setEmergencyAlerts([]);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.uniqueId || !newUser.email || !newUser.password) {
      if (Platform.OS === 'web') {
        alert('Please fill in all required fields');
      } else {
        Alert.alert('Error', 'Please fill in all required fields');
      }
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.createUser({
        ...newUser,
        uniqueId: newUser.uniqueId.toUpperCase()
      });

      setShowCreateUser(false);
      setNewUser({
        name: '',
        uniqueId: '',
        email: '',
        phone: '',
        role: 'employee',
        password: ''
      });
      
      loadUsers();
      
      if (Platform.OS === 'web') {
        alert('User created successfully!');
      } else {
        Alert.alert('Success', 'User created successfully!');
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        alert(error.message || 'Failed to create user');
      } else {
        Alert.alert('Error', error.message || 'Failed to create user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!currentUser) return;
    
    try {
      await EmergencyService.acknowledgeAlert(alertId, currentUser.id);
      loadEmergencyAlerts();
      
      if (Platform.OS === 'web') {
        alert('Alert acknowledged');
      } else {
        Alert.alert('Success', 'Alert acknowledged');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    if (!currentUser) return;
    
    try {
      await EmergencyService.resolveAlert(alertId, currentUser.id);
      loadEmergencyAlerts();
      setShowEmergencyDetails(false);
      
      if (Platform.OS === 'web') {
        alert('Alert resolved');
      } else {
        Alert.alert('Success', 'Alert resolved');
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleLogout = () => {
    const confirmLogout = Platform.OS === 'web' 
      ? window.confirm('Are you sure you want to sign out?')
      : Alert.alert(
          'Sign Out',
          'Are you sure you want to sign out?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', onPress: () => {
              AuthService.logout();
              router.replace('/auth');
            }, style: 'destructive' }
          ]
        );

    if (Platform.OS === 'web' && confirmLogout) {
      AuthService.logout();
      router.replace('/auth');
    }
  };

  // Render settings screen for non-admin users
  const renderSettingsScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.settingsCard}>
            <View style={styles.profileSection}>
              <View style={styles.profileIcon}>
                <User size={32} color="#2563EB" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{currentUser?.name}</Text>
                <Text style={styles.profileRole}>{currentUser?.role}</Text>
                <Text style={styles.profileId}>ID: {currentUser?.uniqueId}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem}>
              <Bell size={20} color="#6B7280" />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingDescription}>Manage alert preferences</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Lock size={20} color="#6B7280" />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Privacy & Security</Text>
                <Text style={styles.settingDescription}>Location and data settings</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <HelpCircle size={20} color="#6B7280" />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Help & Support</Text>
                <Text style={styles.settingDescription}>Get help and contact support</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#FFFFFF" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Show settings screen for non-admin users
  if (currentUser?.role !== 'admin') {
    return renderSettingsScreen();
  }

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.uniqueId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  }) : [];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'driver': return Car;
      default: return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#DC2626';
      case 'driver': return '#059669';
      default: return '#2563EB';
    }
  };

  const getAlertPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#2563EB';
      default: return '#6B7280';
    }
  };

  const renderUserCard = ({ item }: { item: any }) => {
    const RoleIcon = getRoleIcon(item.role);
    
    return (
      <View style={styles.userCard}>
        <View style={styles.userCardHeader}>
          <View style={[styles.userIcon, { backgroundColor: `${getRoleColor(item.role)}15` }]}>
            <RoleIcon size={20} color={getRoleColor(item.role)} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userRole}>{item.role}</Text>
            <Text style={styles.userId}>ID: {item.uniqueId}</Text>
          </View>
          <View style={styles.userStatus}>
            <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10B981' : '#6B7280' }]} />
            <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        
        {item.email && (
          <Text style={styles.userEmail}>{item.email}</Text>
        )}
        
        {item.lastSeen && (
          <Text style={styles.lastSeen}>
            Last seen: {new Date(item.lastSeen).toLocaleString()}
          </Text>
        )}
      </View>
    );
  };

  const renderEmergencyAlert = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.alertCard, { borderLeftColor: getAlertPriorityColor(item.priority) }]}
      onPress={() => {
        setSelectedAlert(item);
        setShowEmergencyDetails(true);
      }}
    >
      <View style={styles.alertHeader}>
        <AlertTriangle size={20} color={getAlertPriorityColor(item.priority)} />
        <Text style={styles.alertType}>{item.type.toUpperCase()}</Text>
        <Text style={[styles.alertPriority, { color: getAlertPriorityColor(item.priority) }]}>
          {item.priority}
        </Text>
      </View>
      
      <Text style={styles.alertUser}>{item.userName} ({item.userRole})</Text>
      <Text style={styles.alertMessage} numberOfLines={2}>{item.message}</Text>
      
      <View style={styles.alertFooter}>
        <View style={styles.alertLocation}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.alertLocationText} numberOfLines={1}>
            {item.location.address || 'Location unavailable'}
          </Text>
        </View>
        <Text style={styles.alertTime}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCreateUserModal = () => (
    <Modal
      visible={showCreateUser}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateUser(false)}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create New User</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Full Name *</Text>
            <TextInput
              style={styles.formInput}
              value={newUser.name}
              onChangeText={(text) => setNewUser({ ...newUser, name: text })}
              placeholder="Enter full name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Unique ID *</Text>
            <TextInput
              style={styles.formInput}
              value={newUser.uniqueId}
              onChangeText={(text) => setNewUser({ ...newUser, uniqueId: text })}
              placeholder="e.g., EMP001, DRV001, ADMIN001"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email *</Text>
            <TextInput
              style={styles.formInput}
              value={newUser.email}
              onChangeText={(text) => setNewUser({ ...newUser, email: text })}
              placeholder="Enter email address"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Phone</Text>
            <TextInput
              style={styles.formInput}
              value={newUser.phone}
              onChangeText={(text) => setNewUser({ ...newUser, phone: text })}
              placeholder="Enter phone number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Role *</Text>
            <View style={styles.roleSelector}>
              {(['employee', 'driver', 'admin'] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    newUser.role === role && styles.roleOptionSelected
                  ]}
                  onPress={() => setNewUser({ ...newUser, role })}
                >
                  <Text style={[
                    styles.roleOptionText,
                    newUser.role === role && styles.roleOptionTextSelected
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Password *</Text>
            <TextInput
              style={styles.formInput}
              value={newUser.password}
              onChangeText={(text) => setNewUser({ ...newUser, password: text })}
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.createButtonDisabled]}
            onPress={handleCreateUser}
            disabled={isLoading}
          >
            <UserPlus size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>
              {isLoading ? 'Creating...' : 'Create User'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderEmergencyDetailsModal = () => (
    <Modal
      visible={showEmergencyDetails}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEmergencyDetails(false)}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Emergency Alert Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {selectedAlert && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.alertDetailsCard}>
              <View style={styles.alertDetailsHeader}>
                <AlertTriangle size={32} color={getAlertPriorityColor(selectedAlert.priority)} />
                <View style={styles.alertDetailsInfo}>
                  <Text style={styles.alertDetailsType}>{selectedAlert.type.toUpperCase()}</Text>
                  <Text style={[styles.alertDetailsPriority, { color: getAlertPriorityColor(selectedAlert.priority) }]}>
                    {selectedAlert.priority.toUpperCase()} PRIORITY
                  </Text>
                </View>
              </View>

              <View style={styles.alertDetailsSection}>
                <Text style={styles.alertDetailsLabel}>User Information</Text>
                <Text style={styles.alertDetailsValue}>{selectedAlert.userName}</Text>
                <Text style={styles.alertDetailsSubvalue}>Role: {selectedAlert.userRole}</Text>
              </View>

              <View style={styles.alertDetailsSection}>
                <Text style={styles.alertDetailsLabel}>Message</Text>
                <Text style={styles.alertDetailsValue}>{selectedAlert.message}</Text>
              </View>

              <View style={styles.alertDetailsSection}>
                <Text style={styles.alertDetailsLabel}>Location</Text>
                <Text style={styles.alertDetailsValue}>
                  {selectedAlert.location.address || 'Address not available'}
                </Text>
                <Text style={styles.alertDetailsSubvalue}>
                  Coordinates: {selectedAlert.location.latitude.toFixed(6)}, {selectedAlert.location.longitude.toFixed(6)}
                </Text>
              </View>

              <View style={styles.alertDetailsSection}>
                <Text style={styles.alertDetailsLabel}>Time</Text>
                <Text style={styles.alertDetailsValue}>
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </Text>
              </View>

              <View style={styles.alertActions}>
                <TouchableOpacity
                  style={styles.acknowledgeButton}
                  onPress={() => handleAcknowledgeAlert(selectedAlert.id)}
                >
                  <CheckCircle size={20} color="#FFFFFF" />
                  <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() => handleResolveAlert(selectedAlert.id)}
                >
                  <CheckCircle size={20} color="#FFFFFF" />
                  <Text style={styles.resolveButtonText}>Resolve</Text>
                </TouchableOpacity>
              </View>
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
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Manage users and monitor system</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency Alerts Section */}
        {emergencyAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color="#DC2626" />
              <Text style={styles.sectionTitle}>Active Emergency Alerts ({emergencyAlerts.length})</Text>
            </View>
            <FlatList
              data={emergencyAlerts}
              keyExtractor={(item) => item.id}
              renderItem={renderEmergencyAlert}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.alertsList}
            />
          </View>
        )}

        {/* Real-time Map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Real-time Location Tracking</Text>
          <RealTimeMap showControls={true} height={300} />
        </View>

        {/* Users Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#2563EB" />
            <Text style={styles.sectionTitle}>User Management</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateUser(true)}
            >
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add User</Text>
            </TouchableOpacity>
          </View>

          {/* Search and Filter */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search users..."
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
              {(['all', 'employee', 'driver', 'admin'] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.filterButton,
                    selectedRole === role && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedRole === role && styles.filterButtonTextActive
                  ]}>
                    {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Users List */}
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderUserCard}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>

      {/* Modals */}
      {renderCreateUserModal()}
      {renderEmergencyDetailsModal()}
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
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  // Settings screen styles
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  profileRole: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  profileId: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingContent: {
    marginLeft: 12,
    flex: 1,
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
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
  },
  signOutButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  alertsList: {
    paddingHorizontal: 24,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  alertPriority: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
  alertUser: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertLocationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  alertTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
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
    marginBottom: 12,
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
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  userId: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  userStatus: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  lastSeen: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
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
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  roleSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    padding: 4,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: '#2563EB',
  },
  roleOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  roleOptionTextSelected: {
    color: '#FFFFFF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
    marginTop: 20,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  alertDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  alertDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  alertDetailsInfo: {
    marginLeft: 12,
  },
  alertDetailsType: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  alertDetailsPriority: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginTop: 2,
  },
  alertDetailsSection: {
    marginBottom: 20,
  },
  alertDetailsLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  alertDetailsValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  alertDetailsSubvalue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  acknowledgeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  acknowledgeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  resolveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  resolveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});