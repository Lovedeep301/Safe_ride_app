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
import { Users, Car, Plus, Search, Phone, Mail, MapPin, Settings, LogOut, Eye, EyeOff, UserPlus, Shield, TriangleAlert as AlertTriangle, MessageCircle, X, CreditCard as Edit, Trash2, Chrome as Home, User as UserIcon } from 'lucide-react-native';
import { AuthService, User } from '@/services/AuthService';
import { EmergencyService } from '@/services/EmergencyService';
import { GroupService, Group } from '@/services/GroupService';
import RealTimeMap from '@/components/RealTimeMap';

type Screen = 'dashboard' | 'users' | 'drivers' | 'groups' | 'emergencies' | 'map' | 'profile';
type UserFormData = {
  name: string;
  uniqueId: string;
  email: string;
  phone: string;
  password: string;
  role: 'employee' | 'driver';
  licenseNumber?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleCapacity?: string;
  homeAddress?: string;
  pickupLocation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
};

export default function AdminPanel() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showPasswordInForm, setShowPasswordInForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: '',
    uniqueId: '',
    email: '',
    phone: '',
    password: '',
    role: 'employee'
  });
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    pickupLocation: '',
    pickupTime: '',
    route: '',
    members: [] as string[]
  });

  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    // Check authentication and admin role
    if (!AuthService.isAuthenticated()) {
      router.replace('/auth');
      return;
    }

    // For non-admin users, only show profile
    if (currentUser?.role !== 'admin') {
      setCurrentScreen('profile');
    }

    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      const allUsers = AuthService.getAllUsers();
      setUsers(allUsers);
      
      const allGroups = await GroupService.getAllGroups();
      setGroups(allGroups);
      
      const alerts = await EmergencyService.getActiveAlerts();
      setEmergencyAlerts(alerts);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!userFormData.name || !userFormData.uniqueId || !userFormData.password) {
        if (Platform.OS === 'web') {
          alert('Please fill in all required fields');
        } else {
          Alert.alert('Error', 'Please fill in all required fields');
        }
        return;
      }

      // Check if unique ID already exists
      const existingUser = AuthService.getAllUsers().find(u => 
        u.uniqueId.toLowerCase() === userFormData.uniqueId.toLowerCase()
      );
      
      if (existingUser) {
        if (Platform.OS === 'web') {
          alert('User ID already exists. Please choose a different ID.');
        } else {
          Alert.alert('Error', 'User ID already exists. Please choose a different ID.');
        }
        return;
      }

      const newUser: Omit<User, 'id' | 'isActive' | 'lastSeen'> = {
        name: userFormData.name,
        uniqueId: userFormData.uniqueId.toUpperCase(),
        email: userFormData.email,
        phone: userFormData.phone,
        password: userFormData.password,
        role: userFormData.role,
        ...(userFormData.homeAddress && {
          homeLocation: {
            latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
            longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
            address: userFormData.homeAddress
          }
        }),
        ...(userFormData.emergencyContactName && {
          emergencyContact: {
            name: userFormData.emergencyContactName,
            phone: userFormData.emergencyContactPhone || '',
            relationship: userFormData.emergencyContactRelation || 'Contact'
          }
        }),
        ...(userFormData.role === 'driver' && {
          licenseNumber: userFormData.licenseNumber,
          vehicleInfo: {
            model: userFormData.vehicleModel || '',
            plateNumber: userFormData.vehiclePlate || '',
            capacity: parseInt(userFormData.vehicleCapacity || '0')
          }
        })
      };

      AuthService.createUser(newUser);
      setShowCreateUserModal(false);
      resetUserForm();
      loadData();

      if (Platform.OS === 'web') {
        alert('User created successfully!');
      } else {
        Alert.alert('Success', 'User created successfully!');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      if (Platform.OS === 'web') {
        alert('Failed to create user');
      } else {
        Alert.alert('Error', 'Failed to create user');
      }
    }
  };

  const handleEditUser = async () => {
    try {
      if (!editingUser || !userFormData.name || !userFormData.uniqueId) {
        if (Platform.OS === 'web') {
          alert('Please fill in all required fields');
        } else {
          Alert.alert('Error', 'Please fill in all required fields');
        }
        return;
      }

      // Check if unique ID already exists (excluding current user)
      const existingUser = AuthService.getAllUsers().find(u => 
        u.uniqueId.toLowerCase() === userFormData.uniqueId.toLowerCase() && u.id !== editingUser.id
      );
      
      if (existingUser) {
        if (Platform.OS === 'web') {
          alert('User ID already exists. Please choose a different ID.');
        } else {
          Alert.alert('Error', 'User ID already exists. Please choose a different ID.');
        }
        return;
      }

      const updatedUser: Partial<User> = {
        name: userFormData.name,
        uniqueId: userFormData.uniqueId.toUpperCase(),
        email: userFormData.email,
        phone: userFormData.phone,
        role: userFormData.role,
        ...(userFormData.password && { password: userFormData.password }),
        ...(userFormData.homeAddress && {
          homeLocation: {
            latitude: editingUser.homeLocation?.latitude || 40.7128 + (Math.random() - 0.5) * 0.1,
            longitude: editingUser.homeLocation?.longitude || -74.0060 + (Math.random() - 0.5) * 0.1,
            address: userFormData.homeAddress
          }
        }),
        ...(userFormData.emergencyContactName && {
          emergencyContact: {
            name: userFormData.emergencyContactName,
            phone: userFormData.emergencyContactPhone || '',
            relationship: userFormData.emergencyContactRelation || 'Contact'
          }
        }),
        ...(userFormData.role === 'driver' && {
          licenseNumber: userFormData.licenseNumber,
          vehicleInfo: {
            model: userFormData.vehicleModel || '',
            plateNumber: userFormData.vehiclePlate || '',
            capacity: parseInt(userFormData.vehicleCapacity || '0')
          }
        })
      };

      AuthService.updateUser(editingUser.id, updatedUser);
      setShowEditUserModal(false);
      setEditingUser(null);
      resetUserForm();
      loadData();

      if (Platform.OS === 'web') {
        alert('User updated successfully!');
      } else {
        Alert.alert('Success', 'User updated successfully!');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      if (Platform.OS === 'web') {
        alert('Failed to update user');
      } else {
        Alert.alert('Error', 'Failed to update user');
      }
    }
  };

  const handleDeleteUser = async (user: User) => {
    const confirmDelete = Platform.OS === 'web' 
      ? window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)
      : Alert.alert(
          'Delete User',
          `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', onPress: () => performDelete(user.id), style: 'destructive' }
          ]
        );

    if (Platform.OS === 'web' && confirmDelete) {
      performDelete(user.id);
    }
  };

  const performDelete = (userId: string) => {
    try {
      const success = AuthService.deleteUser(userId);
      if (success) {
        loadData();
        if (Platform.OS === 'web') {
          alert('User deleted successfully!');
        } else {
          Alert.alert('Success', 'User deleted successfully!');
        }
      } else {
        if (Platform.OS === 'web') {
          alert('Failed to delete user');
        } else {
          Alert.alert('Error', 'Failed to delete user');
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      if (Platform.OS === 'web') {
        alert('Failed to delete user');
      } else {
        Alert.alert('Error', 'Failed to delete user');
      }
    }
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      uniqueId: user.uniqueId,
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role,
      licenseNumber: user.licenseNumber || '',
      vehicleModel: user.vehicleInfo?.model || '',
      vehiclePlate: user.vehicleInfo?.plateNumber || '',
      vehicleCapacity: user.vehicleInfo?.capacity?.toString() || '',
      homeAddress: user.homeLocation?.address || '',
      pickupLocation: '',
      emergencyContactName: user.emergencyContact?.name || '',
      emergencyContactPhone: user.emergencyContact?.phone || '',
      emergencyContactRelation: user.emergencyContact?.relationship || ''
    });
    setShowEditUserModal(true);
  };

  const handleCreateGroup = async () => {
    try {
      if (!groupFormData.name || !groupFormData.pickupLocation) {
        if (Platform.OS === 'web') {
          alert('Please fill in all required fields');
        } else {
          Alert.alert('Error', 'Please fill in all required fields');
        }
        return;
      }

      await GroupService.createGroup({
        ...groupFormData,
        createdBy: currentUser?.id || 'admin'
      });

      setShowCreateGroupModal(false);
      resetGroupForm();
      loadData();

      if (Platform.OS === 'web') {
        alert('Group created successfully!');
      } else {
        Alert.alert('Success', 'Group created successfully!');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      if (Platform.OS === 'web') {
        alert('Failed to create group');
      } else {
        Alert.alert('Error', 'Failed to create group');
      }
    }
  };

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      uniqueId: '',
      email: '',
      phone: '',
      password: '',
      role: 'employee'
    });
  };

  const resetGroupForm = () => {
    setGroupFormData({
      name: '',
      description: '',
      pickupLocation: '',
      pickupTime: '',
      route: '',
      members: []
    });
  };

  const handleCallUser = (phone: string) => {
    if (Platform.OS === 'web') {
      window.open(`tel:${phone}`);
    } else {
      Alert.alert('Call', `Calling ${phone}`);
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

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.uniqueId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDashboard = () => (
    <ScrollView style={styles.content}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Users size={24} color="#2563EB" />
          <Text style={styles.statNumber}>{users.filter(u => u.role === 'employee').length}</Text>
          <Text style={styles.statLabel}>Employees</Text>
        </View>
        <View style={styles.statCard}>
          <Car size={24} color="#059669" />
          <Text style={styles.statNumber}>{users.filter(u => u.role === 'driver').length}</Text>
          <Text style={styles.statLabel}>Drivers</Text>
        </View>
        <View style={styles.statCard}>
          <Users size={24} color="#D97706" />
          <Text style={styles.statNumber}>{groups.length}</Text>
          <Text style={styles.statLabel}>Groups</Text>
        </View>
        <View style={styles.statCard}>
          <AlertTriangle size={24} color="#DC2626" />
          <Text style={styles.statNumber}>{emergencyAlerts.length}</Text>
          <Text style={styles.statLabel}>Active Alerts</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Real-time Monitoring</Text>
        <RealTimeMap showControls={true} height={300} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Emergency Alerts</Text>
        {emergencyAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertTriangle size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Active Alerts</Text>
            <Text style={styles.emptyDescription}>All emergency alerts have been resolved</Text>
          </View>
        ) : (
          emergencyAlerts.slice(0, 3).map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <AlertTriangle size={20} color="#DC2626" />
                <Text style={styles.alertTitle}>{alert.type} Alert</Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.alertUser}>{alert.userName}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderUsers = () => (
    <View style={styles.content}>
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
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateUserModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userCardLeft}>
              <View style={[styles.userIcon, { backgroundColor: item.role === 'driver' ? '#ECFDF5' : '#EBF4FF' }]}>
                {item.role === 'driver' ? (
                  <Car size={20} color="#059669" />
                ) : (
                  <Users size={20} color="#2563EB" />
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userRole}>{item.role} • {item.uniqueId}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                {item.homeLocation && (
                  <View style={styles.locationRow}>
                    <Home size={12} color="#6B7280" />
                    <Text style={styles.locationText}>{item.homeLocation.address}</Text>
                  </View>
                )}
                {item.vehicleInfo && (
                  <Text style={styles.vehicleInfo}>
                    {item.vehicleInfo.model} • {item.vehicleInfo.plateNumber}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.userActions}>
              {item.phone && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleCallUser(item.phone!)}
                >
                  <Phone size={16} color="#2563EB" />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => openEditUser(item)}
              >
                <Edit size={16} color="#059669" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteUser(item)}
              >
                <Trash2 size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Users size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? 'No users match your search criteria' : 'Start by creating your first user'}
            </Text>
          </View>
        )}
      />
    </View>
  );

  const renderGroups = () => (
    <View style={styles.content}>
      <View style={styles.searchContainer}>
        <Text style={styles.sectionTitle}>Cab Groups</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateGroupModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.groupMemberCount}>{item.members.length} members</Text>
            </View>
            <Text style={styles.groupDescription}>{item.description}</Text>
            <View style={styles.groupDetails}>
              <View style={styles.groupDetail}>
                <MapPin size={14} color="#6B7280" />
                <Text style={styles.groupDetailText}>{item.pickupLocation}</Text>
              </View>
              <View style={styles.groupDetail}>
                <Text style={styles.groupDetailText}>{item.pickupTime}</Text>
              </View>
            </View>
            <Text style={styles.groupRoute}>{item.route}</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Users size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Groups Created</Text>
            <Text style={styles.emptyDescription}>Create your first cab group to get started</Text>
          </View>
        )}
      />
    </View>
  );

  const renderMap = () => (
    <View style={styles.content}>
      <RealTimeMap showControls={true} />
    </View>
  );

  const renderProfile = () => (
    <ScrollView style={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.profileIcon}>
            <UserIcon size={32} color="#2563EB" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentUser?.name}</Text>
            <Text style={styles.profileId}>ID: {currentUser?.uniqueId}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {currentUser?.role === 'admin' ? 'Administrator' : 'User'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Mail size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{currentUser?.email || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Phone size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{currentUser?.phone || 'Not provided'}</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.signOutButton}
        onPress={handleLogout}
      >
        <LogOut size={20} color="#FFFFFF" />
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderUserFormModal = (isEdit: boolean = false) => (
    <Modal
      visible={isEdit ? showEditUserModal : showCreateUserModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => {
            if (isEdit) {
              setShowEditUserModal(false);
              setEditingUser(null);
            } else {
              setShowCreateUserModal(false);
            }
            resetUserForm();
          }}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{isEdit ? 'Edit User' : 'Create New User'}</Text>
          <TouchableOpacity onPress={isEdit ? handleEditUser : handleCreateUser}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={userFormData.name}
                onChangeText={(text) => setUserFormData({...userFormData, name: text})}
                placeholder="Enter full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Employee/Driver ID *</Text>
              <TextInput
                style={styles.textInput}
                value={userFormData.uniqueId}
                onChangeText={(text) => setUserFormData({...userFormData, uniqueId: text.toUpperCase()})}
                placeholder="EMP001 or DRV001"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Role *</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[styles.roleOption, userFormData.role === 'employee' && styles.roleOptionSelected]}
                  onPress={() => setUserFormData({...userFormData, role: 'employee'})}
                >
                  <Users size={20} color={userFormData.role === 'employee' ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[styles.roleOptionText, userFormData.role === 'employee' && styles.roleOptionTextSelected]}>
                    Employee
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleOption, userFormData.role === 'driver' && styles.roleOptionSelected]}
                  onPress={() => setUserFormData({...userFormData, role: 'driver'})}
                >
                  <Car size={20} color={userFormData.role === 'driver' ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[styles.roleOptionText, userFormData.role === 'driver' && styles.roleOptionTextSelected]}>
                    Driver
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={userFormData.email}
                onChangeText={(text) => setUserFormData({...userFormData, email: text})}
                placeholder="user@company.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.textInput}
                value={userFormData.phone}
                onChangeText={(text) => setUserFormData({...userFormData, phone: text})}
                placeholder="+1-555-0123"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={userFormData.password}
                  onChangeText={(text) => setUserFormData({...userFormData, password: text})}
                  placeholder={isEdit ? "Enter new password" : "Enter password"}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPasswordInForm}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPasswordInForm(!showPasswordInForm)}
                >
                  {showPasswordInForm ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Location Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Home Address</Text>
              <TextInput
                style={styles.textInput}
                value={userFormData.homeAddress}
                onChangeText={(text) => setUserFormData({...userFormData, homeAddress: text})}
                placeholder="123 Main St, City, State"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pickup Location</Text>
              <TextInput
                style={styles.textInput}
                value={userFormData.pickupLocation}
                onChangeText={(text) => setUserFormData({...userFormData, pickupLocation: text})}
                placeholder="Preferred pickup point"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Emergency Contact</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Name</Text>
              <TextInput
                style={styles.textInput}
                value={userFormData.emergencyContactName}
                onChangeText={(text) => setUserFormData({...userFormData, emergencyContactName: text})}
                placeholder="Emergency contact name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.textInput}
                value={userFormData.emergencyContactPhone}
                onChangeText={(text) => setUserFormData({...userFormData, emergencyContactPhone: text})}
                placeholder="+1-555-0123"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Relationship</Text>
              <TextInput
                style={styles.textInput}
                value={userFormData.emergencyContactRelation}
                onChangeText={(text) => setUserFormData({...userFormData, emergencyContactRelation: text})}
                placeholder="Spouse, Parent, Sibling, etc."
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {userFormData.role === 'driver' && (
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Driver Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>License Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={userFormData.licenseNumber}
                  onChangeText={(text) => setUserFormData({...userFormData, licenseNumber: text})}
                  placeholder="DL123456789"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vehicle Model</Text>
                <TextInput
                  style={styles.textInput}
                  value={userFormData.vehicleModel}
                  onChangeText={(text) => setUserFormData({...userFormData, vehicleModel: text})}
                  placeholder="Toyota Hiace"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vehicle Plate Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={userFormData.vehiclePlate}
                  onChangeText={(text) => setUserFormData({...userFormData, vehiclePlate: text})}
                  placeholder="ABC-1234"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vehicle Capacity</Text>
                <TextInput
                  style={styles.textInput}
                  value={userFormData.vehicleCapacity}
                  onChangeText={(text) => setUserFormData({...userFormData, vehicleCapacity: text})}
                  placeholder="12"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderCreateGroupModal = () => (
    <Modal
      visible={showCreateGroupModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => {
            setShowCreateGroupModal(false);
            resetGroupForm();
          }}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create New Group</Text>
          <TouchableOpacity onPress={handleCreateGroup}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Group Name *</Text>
              <TextInput
                style={styles.textInput}
                value={groupFormData.name}
                onChangeText={(text) => setGroupFormData({...groupFormData, name: text})}
                placeholder="Downtown Cab Group"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={groupFormData.description}
                onChangeText={(text) => setGroupFormData({...groupFormData, description: text})}
                placeholder="Daily commute from downtown area"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pickup Location *</Text>
              <TextInput
                style={styles.textInput}
                value={groupFormData.pickupLocation}
                onChangeText={(text) => setGroupFormData({...groupFormData, pickupLocation: text})}
                placeholder="Downtown Transit Hub"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pickup Time</Text>
              <TextInput
                style={styles.textInput}
                value={groupFormData.pickupTime}
                onChangeText={(text) => setGroupFormData({...groupFormData, pickupTime: text})}
                placeholder="8:30 AM"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Route</Text>
              <TextInput
                style={styles.textInput}
                value={groupFormData.route}
                onChangeText={(text) => setGroupFormData({...groupFormData, route: text})}
                placeholder="Downtown → Office Complex"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderNavigation = () => (
    <View style={styles.navigation}>
      {currentUser?.role === 'admin' && (
        <>
          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'dashboard' && styles.navItemActive]}
            onPress={() => setCurrentScreen('dashboard')}
          >
            <Shield size={20} color={currentScreen === 'dashboard' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.navText, currentScreen === 'dashboard' && styles.navTextActive]}>
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'users' && styles.navItemActive]}
            onPress={() => setCurrentScreen('users')}
          >
            <Users size={20} color={currentScreen === 'users' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.navText, currentScreen === 'users' && styles.navTextActive]}>
              Users
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'groups' && styles.navItemActive]}
            onPress={() => setCurrentScreen('groups')}
          >
            <MessageCircle size={20} color={currentScreen === 'groups' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.navText, currentScreen === 'groups' && styles.navTextActive]}>
              Groups
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'map' && styles.navItemActive]}
            onPress={() => setCurrentScreen('map')}
          >
            <MapPin size={20} color={currentScreen === 'map' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.navText, currentScreen === 'map' && styles.navTextActive]}>
              Live Map
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={[styles.navItem, currentScreen === 'profile' && styles.navItemActive]}
        onPress={() => setCurrentScreen('profile')}
      >
        <UserIcon size={20} color={currentScreen === 'profile' ? '#2563EB' : '#6B7280'} />
        <Text style={[styles.navText, currentScreen === 'profile' && styles.navTextActive]}>
          Profile
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={handleLogout}
      >
        <LogOut size={20} color="#DC2626" />
        <Text style={[styles.navText, { color: '#DC2626' }]}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentScreen = () => {
    if (currentUser?.role !== 'admin' && currentScreen !== 'profile') {
      return renderProfile();
    }

    switch (currentScreen) {
      case 'dashboard': return renderDashboard();
      case 'users': return renderUsers();
      case 'groups': return renderGroups();
      case 'map': return renderMap();
      case 'profile': return renderProfile();
      default: return currentUser?.role === 'admin' ? renderDashboard() : renderProfile();
    }
  };

  // Don't render anything if not authenticated
  if (!AuthService.isAuthenticated()) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {currentUser?.role === 'admin' ? 'Admin Panel' : 'Profile'}
        </Text>
        <Text style={styles.headerSubtitle}>
          Welcome back, {currentUser?.name}
        </Text>
      </View>

      {renderNavigation()}
      {renderCurrentScreen()}
      {currentUser?.role === 'admin' && (
        <>
          {renderUserFormModal(false)}
          {renderUserFormModal(true)}
          {renderCreateGroupModal()}
        </>
      )}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  navigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#EBF4FF',
  },
  navText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 4,
  },
  navTextActive: {
    color: '#2563EB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
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
  alertTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
  alertTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  alertUser: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  vehicleInfo: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#059669',
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  groupCard: {
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
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  groupMemberCount: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  groupDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  groupDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  groupDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupDetailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  groupRoute: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
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
  profileId: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
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
    marginBottom: 32,
  },
  signOutButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
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
  saveButton: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  passwordToggle: {
    padding: 12,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  roleOptionSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  roleOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  roleOptionTextSelected: {
    color: '#FFFFFF',
  },
});