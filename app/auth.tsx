import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { LogIn, Shield, Eye, EyeOff, User, Car, Settings, Lock } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';

export default function AuthScreen() {
  const [uniqueId, setUniqueId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const demoCredentials = [
    // Admin accounts
    { id: 'ADMIN001', name: 'John Doe', role: 'Admin', password: 'admin123', icon: Settings, color: '#DC2626' },
    { id: 'ADMIN002', name: 'Sarah Wilson', role: 'Admin', password: 'admin123', icon: Settings, color: '#DC2626' },
    
    // Driver accounts
    { id: 'DRV001', name: 'Michael Rodriguez', role: 'Driver', password: 'driver123', icon: Car, color: '#059669' },
    { id: 'DRV002', name: 'Jennifer Chen', role: 'Driver', password: 'driver123', icon: Car, color: '#059669' },
    { id: 'DRV003', name: 'Robert Kim', role: 'Driver', password: 'driver123', icon: Car, color: '#059669' },
    
    // Employee accounts
    { id: 'EMP001', name: 'Alice Johnson', role: 'Employee', password: 'emp123', icon: User, color: '#2563EB' },
    { id: 'EMP002', name: 'Bob Smith', role: 'Employee', password: 'emp123', icon: User, color: '#2563EB' },
    { id: 'EMP003', name: 'Carol Davis', role: 'Employee', password: 'emp123', icon: User, color: '#2563EB' },
    { id: 'EMP004', name: 'David Brown', role: 'Employee', password: 'emp123', icon: User, color: '#2563EB' },
    { id: 'EMP005', name: 'Eva Martinez', role: 'Employee', password: 'emp123', icon: User, color: '#2563EB' },
  ];

  const handleLogin = async () => {
    if (!uniqueId.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter your unique ID');
      } else {
        Alert.alert('Error', 'Please enter your unique ID');
      }
      return;
    }

    if (!password.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter your password');
      } else {
        Alert.alert('Error', 'Please enter your password');
      }
      return;
    }

    setIsLoading(true);
    
    try {
      // Sync user data before login attempt
      await AuthService.syncUserData();
      
      const success = await AuthService.login(uniqueId.trim(), password.trim());
      if (success) {
        const user = AuthService.getCurrentUser();
        
        // Route based on user role
        if (user?.role === 'driver') {
          router.replace('/(driver-tabs)');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        if (Platform.OS === 'web') {
          alert('Invalid credentials or account not found. Please check your ID and password, or contact your administrator if you believe this is an error.');
        } else {
          Alert.alert('Login Failed', 'Invalid credentials or account not found. Please check your ID and password, or contact your administrator if you believe this is an error.');
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('Login failed. Please check your connection and try again.');
      } else {
        Alert.alert('Connection Error', 'Login failed. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoId: string, demoPassword: string) => {
    setUniqueId(demoId);
    setPassword(demoPassword);
  };

  const getRoleGroups = () => {
    const groups = {
      Admin: demoCredentials.filter(cred => cred.role === 'Admin'),
      Driver: demoCredentials.filter(cred => cred.role === 'Driver'),
      Employee: demoCredentials.filter(cred => cred.role === 'Employee'),
    };
    return groups;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Shield size={50} color="#2563EB" />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to access your portal
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Employee/Driver/Admin ID</Text>
              <TextInput
                style={styles.input}
                value={uniqueId}
                onChangeText={setUniqueId}
                placeholder="Enter your unique ID (e.g., EMP001, DRV001, ADMIN001)"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LogIn size={20} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.demoSection}>
            <TouchableOpacity 
              style={styles.demoToggle}
              onPress={() => setShowDemoCredentials(!showDemoCredentials)}
            >
              {showDemoCredentials ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
              <Text style={styles.demoToggleText}>
                {showDemoCredentials ? 'Hide' : 'Show'} Demo Accounts
              </Text>
            </TouchableOpacity>

            {showDemoCredentials && (
              <View style={styles.demoCredentials}>
                <Text style={styles.demoTitle}>Demo Accounts by Role</Text>
                
                {Object.entries(getRoleGroups()).map(([role, accounts]) => (
                  <View key={role} style={styles.roleGroup}>
                    <Text style={styles.roleTitle}>{role}s</Text>
                    {accounts.map((cred) => {
                      const IconComponent = cred.icon;
                      return (
                        <TouchableOpacity
                          key={cred.id}
                          style={styles.demoItem}
                          onPress={() => handleDemoLogin(cred.id, cred.password)}
                        >
                          <View style={styles.demoItemLeft}>
                            <View style={[styles.roleIcon, { backgroundColor: `${cred.color}15` }]}>
                              <IconComponent size={16} color={cred.color} />
                            </View>
                            <View style={styles.demoInfo}>
                              <Text style={styles.demoName}>{cred.name}</Text>
                              <Text style={[styles.demoRole, { color: cred.color }]}>{cred.role}</Text>
                            </View>
                          </View>
                          <View style={styles.demoCredentialsContainer}>
                            <Text style={[styles.demoId, { backgroundColor: `${cred.color}15`, color: cred.color }]}>
                              {cred.id}
                            </Text>
                            <View style={styles.passwordContainer}>
                              <Lock size={12} color="#6B7280" />
                              <Text style={styles.demoPassword}>{cred.password}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Contact your administrator if you need help with your credentials
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  passwordToggle: {
    padding: 16,
  },
  loginButton: {
    height: 56,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  demoSection: {
    marginBottom: 32,
  },
  demoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  demoToggleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  demoCredentials: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  demoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleGroup: {
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
    paddingLeft: 4,
  },
  demoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 6,
  },
  demoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  demoInfo: {
    flex: 1,
  },
  demoName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  demoRole: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  demoCredentialsContainer: {
    alignItems: 'flex-end',
  },
  demoId: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  demoPassword: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});