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
  ScrollView,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { LogIn, Shield, Eye, EyeOff, UserPlus, Sparkles, ArrowRight } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { FirebaseAuthService } from '@/services/FirebaseAuthService';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

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
  const [error, setError] = useState('');

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
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.logoGradient}
              >
                <Shield size={40} color="#FFFFFF" />
              </LinearGradient>
              <Sparkles size={20} color="#FFD700" style={styles.sparkle1} />
              <Sparkles size={16} color="#FFD700" style={styles.sparkle2} />
            </View>
            
            <Text style={styles.title}>
              {isSignUp ? 'Join SafeHub' : 'Welcome to SafeHub'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp 
                ? 'Create your account and stay connected' 
                : 'Your safety is our priority'
              }
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
              style={styles.cardGradient}
            >
              {isSignUp && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputContainer}>
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
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputContainer}>
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
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Role</Text>
                    <View style={styles.roleContainer}>
                      {(['employee', 'driver', 'admin'] as const).map((roleOption) => (
                        <TouchableOpacity
                          key={roleOption}
                          style={[
                            styles.roleChip,
                            role === roleOption && styles.roleChipSelected
                          ]}
                          onPress={() => setRole(roleOption)}
                        >
                          <Text style={[
                            styles.roleChipText,
                            role === roleOption && styles.roleChipTextSelected
                          ]}>
                            {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {isSignUp ? 'Create Unique ID' : 'Employee/Driver ID'}
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={uniqueId}
                    onChangeText={setUniqueId}
                    placeholder={isSignUp ? "e.g., EMP001" : "Enter your ID"}
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
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
                    onSubmitEditing={isSignUp ? handleSignUp : handleLogin}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
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

              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              {error && error.includes('npm run setup-firebase-users') && (
                <View style={styles.setupHint}>
                  <Text style={styles.setupHintText}>
                    💡 Need demo users? Run this command in terminal:
                  </Text>
                  <Text style={styles.setupCommand}>npm run setup-firebase-users</Text>
                  <Text style={styles.setupHintText}>
                    Then try logging in with: ADMIN001 / admin123
                  </Text>
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
                onPress={isSignUp ? handleSignUp : handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#667eea', '#764ba2']}
                  style={styles.buttonGradient}
                >
                  {isSignUp ? (
                    <UserPlus size={20} color="#FFFFFF" />
                  ) : (
                    <LogIn size={20} color="#FFFFFF" />
                  )}
                  <Text style={styles.actionButtonText}>
                    {isLoading 
                      ? (isSignUp ? 'Creating...' : 'Signing In...') 
                      : (isSignUp ? 'Create Account' : 'Sign In')
                    }
                  </Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Toggle Section */}
          <View style={styles.toggleSection}>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={toggleMode}
            >
              <Text style={styles.toggleText}>
                {isSignUp 
                  ? 'Already have an account? ' 
                  : "Don't have an account? "
                }
              </Text>
              <Text style={styles.toggleLink}>
                {isSignUp ? 'Sign In' : 'Create One'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSignUp 
                ? 'By creating an account, you agree to our terms'
                : 'Secure • Reliable • Always Protected'
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
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
    minHeight: height - 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sparkle1: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 5,
    left: -8,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
    marginBottom: 32,
  },
  cardGradient: {
    padding: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  input: {
    height: 56,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  passwordInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  eyeButton: {
    padding: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleChipSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  roleChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  roleChipTextSelected: {
    color: '#3B82F6',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  setupHint: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  setupHintText: {
    color: '#3B82F6',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  setupCommand: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  toggleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  toggleLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});