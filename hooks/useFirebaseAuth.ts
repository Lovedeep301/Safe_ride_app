import { useState, useEffect } from 'react';
import { FirebaseAuthService, FirebaseUserData } from '@/services/FirebaseAuthService';

export function useFirebaseAuth() {
  const [user, setUser] = useState<FirebaseUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (uniqueId: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const success = await FirebaseAuthService.signInWithUniqueId(uniqueId, password);
      if (!success) {
        setError('Invalid credentials');
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await FirebaseAuthService.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  };

  const updateUserLocation = async (location: { latitude: number; longitude: number }) => {
    if (!user) return false;
    
    try {
      await FirebaseAuthService.updateUserLocation(user.id, location);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Location update failed');
      return false;
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    updateUserLocation,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDriver: user?.role === 'driver',
    isEmployee: user?.role === 'employee'
  };
}