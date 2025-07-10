import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';

export default function IndexScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const rootNavigationState = useRootNavigationState();

  // Wait for navigation state to be fully initialized
  if (!rootNavigationState?.key) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.iconContainer}>
              <Shield size={60} color="#2563EB" />
            </View>
            <Text style={styles.title}>Employee Safety Hub</Text>
            <Text style={styles.subtitle}>
              Secure communication and safety confirmation
            </Text>
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Initializing...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    checkAuthStatus();
  }, [rootNavigationState?.key]);

  const checkAuthStatus = async () => {
    try {
      // Small delay to show the splash screen
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const isAuthenticated = AuthService.isAuthenticated();
      const user = AuthService.getCurrentUser();
      
      if (isAuthenticated) {
        // Route based on user role
        if (user?.role === 'driver') {
          setTimeout(() => router.replace('/(driver-tabs)'), 0);
        } else {
          setTimeout(() => router.replace('/(tabs)'), 0);
        }
      } else {
        setTimeout(() => router.replace('/auth'), 0);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setTimeout(() => router.replace('/auth'), 0);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoading) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.iconContainer}>
            <Shield size={60} color="#2563EB" />
          </View>
          <Text style={styles.title}>Employee Safety Hub</Text>
          <Text style={styles.subtitle}>
            Secure communication and safety confirmation
          </Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 16,
  },
});