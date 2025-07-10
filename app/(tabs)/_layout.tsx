import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Chrome as Home, Users, MessageCircle, Settings } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';

export default function TabLayout() {
  const currentUser = AuthService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    // Check authentication and role
    if (!AuthService.isAuthenticated()) {
      router.replace('/auth');
      return;
    }

    // Redirect drivers to their interface
    if (currentUser?.role === 'driver') {
      router.replace('/(driver-tabs)');
      return;
    }
  }, [currentUser]);

  // Don't render if not authenticated or wrong role
  if (!AuthService.isAuthenticated() || currentUser?.role === 'driver') {
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
        tabBarActiveTintColor: '#2563EB',
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
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
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
        name="admin"
        options={{
          title: isAdmin ? 'Admin' : 'Profile',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}