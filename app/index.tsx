import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { AuthService } from '@/services/AuthService';

export default function HomeScreen() {
  useEffect(() => {
    // Initialize auth and redirect appropriately
    const initializeApp = async () => {
      await AuthService.initialize();
      
      const currentUser = AuthService.getCurrentUser();
      
      if (!currentUser) {
        router.replace('/auth');
      } else if (currentUser.role === 'driver') {
        router.replace('/(driver-tabs)');
      } else {
        router.replace('/(tabs)');
      }
    };
    
    initializeApp();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Employee Safety Hub...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
});