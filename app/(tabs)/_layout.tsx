import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Chrome as Home, Users, MessageCircle, Settings, Database, TestTube, Bell } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';

export default function TabLayout() {
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = AuthService.getCurrentUser();
      
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
    };
    
    // Check immediately
    checkAuth();
    
    // Set up interval to check auth state
    const interval = setInterval(checkAuth, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const currentUser = AuthService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // Don't render if not authenticated or wrong role
  if (!currentUser) {
    return null;
  }

  if (currentUser.role === 'driver') {
    // This will be handled by the useEffect redirect
    return null;
  }

  // Show different tabs based on user role
  const getTabsForRole = () => {
    const baseTabs = [
      {
        name: "index",
        title: 'Home',
        icon: Home
      },
      {
        name: "groups",
        title: 'Groups',
        icon: Users
      },
      {
        name: "messages",
        title: 'Messages',
        icon: MessageCircle
      }
    ];

    if (isAdmin) {
      return [
        ...baseTabs,
        {
          name: "notifications",
          title: 'Alerts',
          icon: Bell
        },
        {
          name: "firebase-setup",
          title: 'Setup',
          icon: Database
        },
        {
          name: "test-firebase",
          title: 'Test',
          icon: TestTube
        },
        {
          name: "admin",
          title: 'Admin',
          icon: Settings
        }
      ];
    } else {
      return [
        ...baseTabs,
        {
          name: "notifications",
          title: 'Alerts',
          icon: Bell
        },
        {
          name: "admin",
          title: 'Settings',
          icon: Settings
        }
      ];
    }
  };

  const tabs = getTabsForRole();

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
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ size, color }) => (
              <tab.icon size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}