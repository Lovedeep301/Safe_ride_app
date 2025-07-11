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

  // Initialize the service
  initialize(): void {
    if (this.isInitialized) return;
    
    try {
      // Try to restore user from storage
      const storage = this.getStorage();
      if (storage) {
        const stored = storage.getItem('currentUser');
        if (stored) {
          const userData = JSON.parse(stored);
          this.currentUser = userData;
        }
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
      // Clear invalid storage
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem('currentUser');
      }
    }
    
    this.isInitialized = true;
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
      // Use Firebase authentication only
      const { FirebaseAuthService } = await import('./FirebaseAuthService');
      const firebaseSuccess = await FirebaseAuthService.signInWithUniqueId(uniqueId, password);
      
      if (firebaseSuccess) {
        const firebaseUser = FirebaseAuthService.getCurrentUser();
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
          const storage = this.getStorage();
          if (storage) {
            storage.setItem('currentUser', JSON.stringify(this.currentUser));
          }
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      // Sign out from Firebase
      const { FirebaseAuthService } = await import('./FirebaseAuthService');
      await FirebaseAuthService.signOut();
      
      this.currentUser = null;
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem('currentUser');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getCurrentUser(): User | null {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    if (!this.isInitialized) {
      this.initialize();
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
        const storage = this.getStorage();
        if (storage) {
          storage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
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
        
        const storage = this.getStorage();
        if (storage) {
          storage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
        
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

  // Cross-platform storage helper
  private getStorage(): Storage | null {
    try {
      // Web environment
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
      
      // React Native environment - use AsyncStorage equivalent
      // For now, return null as we don't have AsyncStorage imported
      // In a real app, you would import and use AsyncStorage here
      return null;
    } catch (error) {
      console.error('Storage access error:', error);
      return null;
    }
  }

  // Sync user data across devices/sessions
  async syncUserData(): Promise<void> {
    try {
      // In Firebase mode, the auth state is managed by Firebase
      // Just refresh the current user data if needed
      if (this.currentUser) {
        const storage = this.getStorage();
        if (storage) {
          storage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  }
}

export const AuthService = new AuthServiceClass();