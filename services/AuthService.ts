import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface User {
  id: string;
  name: string;
  uniqueId: string;
  role: 'employee' | 'admin' | 'driver';
  email?: string;
  phone?: string;
  password?: string;
  licenseNumber?: string; // For drivers
  homeLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  vehicleInfo?: {
    plateNumber: string;
    model: string;
    capacity: number;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  isActive: boolean;
  lastSeen?: Date;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}

// Event system for real-time updates
type AuthEventType = 'userCreated' | 'userUpdated' | 'userDeleted';
type AuthEventListener = (eventType: AuthEventType, user: User) => void;

class AuthServiceClass {
  private currentUser: User | null = null;
  private listeners: AuthEventListener[] = [];
  private isInitialized = false;
  private authUnsubscribe: (() => void) | null = null;

  // Initialize the service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      try {
        // Initialize Firebase auth state listener first
        const { FirebaseAuthService } = await import('./FirebaseAuthService');
        
        // Subscribe to Firebase auth state changes
        this.authUnsubscribe = FirebaseAuthService.onAuthStateChanged((firebaseUser) => {
          if (firebaseUser) {
            // Convert Firebase user to local user format
            this.currentUser = {
              id: firebaseUser.id,
              name: firebaseUser.name,
              uniqueId: firebaseUser.uniqueId,
              role: firebaseUser.role,
              email: firebaseUser.email,
              phone: firebaseUser.phone,
              licenseNumber: firebaseUser.licenseNumber,
              homeLocation: firebaseUser.homeLocation,
              vehicleInfo: firebaseUser.vehicleInfo,
              emergencyContact: firebaseUser.emergencyContact,
              isActive: firebaseUser.isActive,
              lastSeen: firebaseUser.lastSeen,
              currentLocation: firebaseUser.currentLocation
            };
            
            // Store in local storage
            this.setStorageItem('currentUser', JSON.stringify(this.currentUser));
          } else {
            // User signed out
            this.currentUser = null;
            this.removeStorageItem('currentUser');
          }
        });
      } catch (firebaseError) {
        console.warn('Firebase auth not available, using local storage only');
      }
      
      // Try to restore user from storage
      const stored = await this.getStorageItem('currentUser');
      if (stored) {
        try {
          const userData = JSON.parse(stored);
          this.currentUser = userData;
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          this.removeStorageItem('currentUser');
        }
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
      // Clear invalid storage
      this.removeStorageItem('currentUser');
    }
    
    this.isInitialized = true;
  }

  // Clean up auth listener
  destroy(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
    this.isInitialized = false;
  }
  // Event system methods
  addEventListener(listener: AuthEventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: AuthEventListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(eventType: AuthEventType, user: User): void {
    this.listeners.forEach(listener => {
      try {
        listener(eventType, user);
      } catch (error) {
        console.error('Error in auth event listener:', error);
      }
    });
  }

  async login(uniqueId: string, password: string): Promise<boolean> {
    try {
      // Try Firebase authentication first
      const { FirebaseAuthService } = await import('./FirebaseAuthService');
      const firebaseSuccess = await FirebaseAuthService.signInWithUniqueId(uniqueId, password);
      
      if (firebaseSuccess) {
        const firebaseUser = FirebaseAuthService.getCurrentUser();
        if (firebaseUser) {
          // Convert Firebase user to local user format and store
          this.currentUser = {
            id: firebaseUser.id,
            name: firebaseUser.name,
            uniqueId: firebaseUser.uniqueId,
            role: firebaseUser.role,
            email: firebaseUser.email,
            phone: firebaseUser.phone,
            licenseNumber: firebaseUser.licenseNumber,
            homeLocation: firebaseUser.homeLocation,
            vehicleInfo: firebaseUser.vehicleInfo,
            emergencyContact: firebaseUser.emergencyContact,
            isActive: firebaseUser.isActive,
            lastSeen: firebaseUser.lastSeen,
            currentLocation: firebaseUser.currentLocation
          };
          
          // Store in local storage for persistence
          this.setStorageItem('currentUser', JSON.stringify(this.currentUser));
          return true;
        }
      }
      
      // Fallback to mock data for development
      console.warn('Firebase login failed, using mock data');
      return this.loginWithMockData(uniqueId, password);
      
    } catch (error) {
      console.error('Login error:', error);
      // Fallback to mock data
      return this.loginWithMockData(uniqueId, password);
    }
  }

  private async loginWithMockData(uniqueId: string, password: string): Promise<boolean> {
    try {
      // Mock users for development/testing
      const mockUsers = [
        {
          id: 'admin001',
          name: 'Admin User',
          uniqueId: 'ADMIN001',
          role: 'admin' as const,
          email: 'admin@company.com',
          phone: '+1-555-0101',
          isActive: true,
          lastSeen: new Date()
        },
        {
          id: 'driver001',
          name: 'Driver User',
          uniqueId: 'DRV001',
          role: 'driver' as const,
          email: 'driver@company.com',
          phone: '+1-555-0201',
          licenseNumber: 'DL123456789',
          vehicleInfo: {
            plateNumber: 'ABC-1234',
            model: 'Toyota Hiace',
            capacity: 12
          },
          isActive: true,
          lastSeen: new Date()
        },
        {
          id: 'emp001',
          name: 'Employee User',
          uniqueId: 'EMP001',
          role: 'employee' as const,
          email: 'employee@company.com',
          phone: '+1-555-0301',
          homeLocation: {
            latitude: 40.7614,
            longitude: -73.9776,
            address: '123 Main St, New York, NY'
          },
          isActive: true,
          lastSeen: new Date()
        }
      ];

      // Check credentials
      const user = mockUsers.find(u => 
        u.uniqueId.toUpperCase() === uniqueId.toUpperCase() && 
        password === 'demo123' // Simple password for demo
      );

      if (user) {
        this.currentUser = user;
        this.setStorageItem('currentUser', JSON.stringify(this.currentUser));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Mock login error:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      // Sign out from Firebase
      const { FirebaseAuthService } = await import('./FirebaseAuthService');
      await FirebaseAuthService.signOut();
      
      this.currentUser = null;
      this.removeStorageItem('currentUser');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getCurrentUser(): User | null {
    if (!this.isInitialized) {
      // Initialize asynchronously but return current state
      this.initialize().catch(console.error);
    }
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    if (!this.isInitialized) {
      // Initialize asynchronously but return current state
      this.initialize().catch(console.error);
    }
    return this.getCurrentUser() !== null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  isDriver(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'driver';
  }

  isEmployee(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'employee';
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { FirebaseAuthService } = await import('./FirebaseAuthService');
      const firebaseUsers = await FirebaseAuthService.getAllUsers();
      
      return firebaseUsers.map(firebaseUser => ({
        id: firebaseUser.id,
        name: firebaseUser.name,
        uniqueId: firebaseUser.uniqueId,
        role: firebaseUser.role,
        email: firebaseUser.email,
        phone: firebaseUser.phone,
        licenseNumber: firebaseUser.licenseNumber,
        homeLocation: firebaseUser.homeLocation,
        vehicleInfo: firebaseUser.vehicleInfo,
        emergencyContact: firebaseUser.emergencyContact,
        isActive: firebaseUser.isActive,
        lastSeen: firebaseUser.lastSeen,
        currentLocation: firebaseUser.currentLocation
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getUsersByRole(role: 'employee' | 'admin' | 'driver'): Promise<User[]> {
    try {
      const { FirebaseAuthService } = await import('./FirebaseAuthService');
      const firebaseUsers = await FirebaseAuthService.getUsersByRole(role);
      
      return firebaseUsers.map(firebaseUser => ({
        id: firebaseUser.id,
        name: firebaseUser.name,
        uniqueId: firebaseUser.uniqueId,
        role: firebaseUser.role,
        email: firebaseUser.email,
        phone: firebaseUser.phone,
        licenseNumber: firebaseUser.licenseNumber,
        homeLocation: firebaseUser.homeLocation,
        vehicleInfo: firebaseUser.vehicleInfo,
        emergencyContact: firebaseUser.emergencyContact,
        isActive: firebaseUser.isActive,
        lastSeen: firebaseUser.lastSeen,
        currentLocation: firebaseUser.currentLocation
      }));
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
  }

  async createUser(userData: Omit<User, 'id' | 'isActive' | 'lastSeen'> & { password: string }): Promise<User> {
    try {
      const { FirebaseAuthService } = await import('./FirebaseAuthService');
      const firebaseUser = await FirebaseAuthService.createUser(userData);
      
      const newUser: User = {
        id: firebaseUser.id,
        name: firebaseUser.name,
        uniqueId: firebaseUser.uniqueId,
        role: firebaseUser.role,
        email: firebaseUser.email,
        phone: firebaseUser.phone,
        licenseNumber: firebaseUser.licenseNumber,
        homeLocation: firebaseUser.homeLocation,
        vehicleInfo: firebaseUser.vehicleInfo,
        emergencyContact: firebaseUser.emergencyContact,
        isActive: firebaseUser.isActive,
        lastSeen: firebaseUser.lastSeen,
        currentLocation: firebaseUser.currentLocation
      };
      
      // Notify listeners about the new user
      this.notifyListeners('userCreated', newUser);
      
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const { FirebaseAuthService } = await import('./FirebaseAuthService');
      await FirebaseAuthService.updateUser(userId, updates);
      
      // Update current user if it's the same user
      if (this.currentUser?.id === userId) {
        this.currentUser = { ...this.currentUser, ...updates };
        this.setStorageItem('currentUser', JSON.stringify(this.currentUser));
      }
      
      const updatedUser = this.currentUser || { ...updates, id: userId } as User;
      
      // Notify listeners about the updated user
      this.notifyListeners('userUpdated', updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Don't allow deleting the current user
      if (this.currentUser?.id === userId) {
        throw new Error('Cannot delete the currently logged in user');
      }
      
      // In a real implementation, you would delete from Firebase
      // For now, just notify listeners
      const deletedUser = { id: userId } as User;
      this.notifyListeners('userDeleted', deletedUser);
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async updateUserLocation(userId: string, location: { latitude: number; longitude: number }): Promise<boolean> {
    try {
      const { FirebaseAuthService } = await import('./FirebaseAuthService');
      await FirebaseAuthService.updateUserLocation(userId, location);
      
      // Update current user if it's the same user
      if (this.currentUser?.id === userId) {
        this.currentUser.currentLocation = {
          ...location,
          timestamp: new Date()
        };
        this.currentUser.lastSeen = new Date();
        
        this.setStorageItem('currentUser', JSON.stringify(this.currentUser));
        
        // Notify listeners about the updated user
        this.notifyListeners('userUpdated', this.currentUser);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user location:', error);
      return false;
    }
  }

  async getActiveUsers(): Promise<User[]> {
    return this.getAllUsers();
  }

  async getUsersWithLocation(): Promise<User[]> {
    const users = await this.getAllUsers();
    return users.filter(user => user.currentLocation);
  }

  async getUserById(userId: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(user => user.id === userId) || null;
  }

  async syncUserData(): Promise<void> {
    if (this.currentUser) {
      try {
        const { FirebaseAuthService } = await import('./FirebaseAuthService');
        await FirebaseAuthService.updateUserLastSeen(this.currentUser.id);
      } catch (error) {
        console.error('Error syncing user data:', error);
      }
    }
  }

  // Cross-platform storage helper
  private getStorage(): Storage | typeof AsyncStorage | null {
    try {
      // Web environment
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
      
      // React Native environment - use AsyncStorage
      if (Platform.OS !== 'web') {
        return AsyncStorage;
      }
      
      return null;
    } catch (error) {
      console.error('Storage access error:', error);
      return null;
    }
  }

  // Helper method for async storage operations
  private async getStorageItem(key: string): Promise<string | null> {
    const storage = this.getStorage();
    if (!storage) return null;
    
    try {
      if (Platform.OS === 'web' && 'getItem' in storage) {
        return (storage as Storage).getItem(key);
      } else if (Platform.OS !== 'web') {
        return await (storage as typeof AsyncStorage).getItem(key);
      }
    } catch (error) {
      console.error('Error getting storage item:', error);
    }
    return null;
  }

  private async setStorageItem(key: string, value: string): Promise<void> {
    const storage = this.getStorage();
    if (!storage) return;
    
    try {
      if (Platform.OS === 'web' && 'setItem' in storage) {
        (storage as Storage).setItem(key, value);
      } else if (Platform.OS !== 'web') {
        await (storage as typeof AsyncStorage).setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting storage item:', error);
    }
  }

  private async removeStorageItem(key: string): Promise<void> {
    const storage = this.getStorage();
    if (!storage) return;
    
    try {
      if (Platform.OS === 'web' && 'removeItem' in storage) {
        (storage as Storage).removeItem(key);
      } else if (Platform.OS !== 'web') {
        await (storage as typeof AsyncStorage).removeItem(key);
      }
    } catch (error) {
      console.error('Error removing storage item:', error);
    }
  }

}

export const AuthService = new AuthServiceClass();