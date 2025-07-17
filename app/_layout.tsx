import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthService } from '@/services/AuthService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    // Initialize AuthService
    const initAuth = async () => {
      await AuthService.initialize();
      
      // Check if user is authenticated and redirect appropriately
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        // Redirect based on user role
        if (currentUser.role === 'driver') {
          router.replace('/(driver-tabs)');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/auth');
      }
    };
    
    initAuth().catch(console.error);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Enable rotation support
    const enableRotation = async () => {
      try {
        await ScreenOrientation.unlockAsync();
      } catch (error) {
        console.log('Screen orientation not available on this platform');
      }
    };
    
    enableRotation();
    
  }, []);
  
  // Show loading screen while fonts or auth are loading
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(driver-tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}