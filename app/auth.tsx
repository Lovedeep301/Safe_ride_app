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
import { LogIn, Shield, Eye, EyeOff, UserPlus } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { FirebaseAuthService } from '@/services/FirebaseAuthService';

export default function AuthScreen() {
  const [uniqueId, setUniqueId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'employee' | 'driver' | 'admin'>('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

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
          alert('Invalid credentials. Please check your ID and password.');
        } else {
          Alert.alert('Login Failed', 'Invalid credentials. Please check your ID and password.');
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

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !uniqueId.trim() || !password.trim()) {
      if (Platform.OS === 'web') {
        alert('Please fill in all required fields');
      } else {
        Alert.alert('Error', 'Please fill in all required fields');
      }
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = {
        name: name.trim(),
        uniqueId: uniqueId.trim().toUpperCase(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        password: password.trim()
      };

      await AuthService.createUser(userData);
      
      if (Platform.OS === 'web') {
        alert('Account created successfully! You can now log in.');
      } else {
        Alert.alert('Success', 'Account created successfully! You can now log in.');
      }
      
      // Switch to login mode
      setIsSignUp(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      
    } catch (error: any) {
      if (Platform.OS === 'web') {
        alert(error.message || 'Failed to create account. Please try again.');
      } else {
        Alert.alert('Error', error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setName('');
    setEmail('');
    setPhone('');
    setUniqueId('');
    setPassword('');
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
            <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Create a new account to get started' : 'Sign in to access your portal'}
            </Text>
          </View>

          <View style={styles.form}>
            {isSignUp && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email address"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Role</Text>
                  <View style={styles.roleSelector}>
                    {(['employee', 'driver', 'admin'] as const).map((roleOption) => (
                      <TouchableOpacity
                        key={roleOption}
                        style={[
                          styles.roleOption,
                          role === roleOption && styles.roleOptionSelected
                        ]}
                        onPress={() => setRole(roleOption)}
                      >
                        <Text style={[
                          styles.roleOptionText,
                          role === roleOption && styles.roleOptionTextSelected
                        ]}>
                          {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{isSignUp ? 'Unique ID' : 'Employee/Driver/Admin ID'}</Text>
              <TextInput
                style={styles.input}
                value={uniqueId}
                onChangeText={setUniqueId}
                placeholder={isSignUp ? "Create a unique ID (e.g., EMP001)" : "Enter your unique ID"}
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
              style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
              onPress={isSignUp ? handleSignUp : handleLogin}
              disabled={isLoading}
            >
              {isSignUp ? (
                <UserPlus size={20} color="#FFFFFF" />
              ) : (
                <LogIn size={20} color="#FFFFFF" />
              )}
              <Text style={styles.actionButtonText}>
                {isLoading 
                  ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                  : (isSignUp ? 'Create Account' : 'Sign In')
                }
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toggleSection}>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={toggleMode}
            >
              <Text style={styles.toggleText}>
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Create One"
                }
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSignUp 
                ? 'By creating an account, you agree to our terms of service'
                : 'Contact your administrator if you need help with your credentials'
              }
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
  actionButton: {
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
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  toggleSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  toggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    textAlign: 'center',
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