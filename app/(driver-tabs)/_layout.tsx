import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Car, Users, MessageCircle, MapPin, Settings } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';

export default function DriverTabLayout() {
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = AuthService.getCurrentUser();
      
      // Check authentication and role
      if (!AuthService.isAuthenticated()) {
        router.replace('/auth');
        return;
      }

      // Redirect non-drivers to employee interface
      if (currentUser?.role !== 'driver') {
        router.replace('/(tabs)');
        return;
      }
    };
    
    // Check immediately
    checkAuth();
    
    // Set up interval to check auth state
    const interval = setInterval(checkAuth, 1000);
    
    return () => clearInterval(interval);
  }
  )

  // Don't render if not authenticated or wrong role
  if (!currentUser || currentUser.role !== 'driver') {
    return null;
  }

  // Show loading while checking auth
  if (!AuthService.isAuthenticated()) {
    return null;
  }

  if (currentUser.role !== 'driver') {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Car size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Routes',
          tabBarIcon: ({ size, color }) => (
            <MapPin size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="passengers"
        options={{
          title: 'Passengers',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}