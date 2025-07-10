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
  
  // Mock user database with admin, driver, and employee accounts
  private users: User[] = [
    // Admin accounts
    {
      id: 'admin001',
      name: 'John Doe',
      uniqueId: 'ADMIN001',
      role: 'admin',
      email: 'john.admin@company.com',
      phone: '+1-555-0101',
      password: 'admin123',
      isActive: true,
      lastSeen: new Date()
    },
    {
      id: 'admin002',
      name: 'Sarah Wilson',
      uniqueId: 'ADMIN002',
      role: 'admin',
      email: 'sarah.admin@company.com',
      phone: '+1-555-0102',
      password: 'admin123',
      isActive: true,
      lastSeen: new Date()
    },
    
    // Driver accounts
    {
      id: 'driver001',
      name: 'Michael Rodriguez',
      uniqueId: 'DRV001',
      role: 'driver',
      email: 'michael.driver@company.com',
      phone: '+1-555-0201',
      password: 'driver123',
      licenseNumber: 'DL123456789',
      isActive: true,
      lastSeen: new Date(),
      currentLocation: {
        latitude: 40.7589,
        longitude: -73.9851,
        timestamp: new Date()
      },
      vehicleInfo: {
        plateNumber: 'ABC-1234',
        model: 'Toyota Hiace',
        capacity: 12
      }
    },
    {
      id: 'driver002',
      name: 'Jennifer Chen',
      uniqueId: 'DRV002',
      role: 'driver',
      email: 'jennifer.driver@company.com',
      phone: '+1-555-0202',
      password: 'driver123',
      licenseNumber: 'DL987654321',
      isActive: true,
      lastSeen: new Date(),
      currentLocation: {
        latitude: 40.7505,
        longitude: -73.9934,
        timestamp: new Date()
      },
      vehicleInfo: {
        plateNumber: 'XYZ-5678',
        model: 'Ford Transit',
        capacity: 15
      }
    },
    {
      id: 'driver003',
      name: 'Robert Kim',
      uniqueId: 'DRV003',
      role: 'driver',
      email: 'robert.driver@company.com',
      phone: '+1-555-0203',
      password: 'driver123',
      licenseNumber: 'DL456789123',
      isActive: true,
      lastSeen: new Date(),
      vehicleInfo: {
        plateNumber: 'DEF-9012',
        model: 'Mercedes Sprinter',
        capacity: 18
      }
    },
    
    // Employee accounts
    {
      id: 'emp001',
      name: 'Alice Johnson',
      uniqueId: 'EMP001',
      role: 'employee',
      email: 'alice@company.com',
      phone: '+1-555-0301',
      password: 'emp123',
      isActive: true,
      lastSeen: new Date(),
      homeLocation: {
        latitude: 40.7614,
        longitude: -73.9776,
        address: '123 Main St, New York, NY'
      },
      currentLocation: {
        latitude: 40.7614,
        longitude: -73.9776,
        timestamp: new Date()
      },
      emergencyContact: {
        name: 'John Johnson',
        phone: '+1-555-0401',
        relationship: 'Spouse'
      }
    },
    {
      id: 'emp002',
      name: 'Bob Smith',
      uniqueId: 'EMP002',
      role: 'employee',
      email: 'bob@company.com',
      phone: '+1-555-0302',
      password: 'emp123',
      isActive: true,
      lastSeen: new Date(),
      homeLocation: {
        latitude: 40.7505,
        longitude: -73.9934,
        address: '456 Oak Ave, New York, NY'
      },
      currentLocation: {
        latitude: 40.7505,
        longitude: -73.9934,
        timestamp: new Date()
      },
      emergencyContact: {
        name: 'Mary Smith',
        phone: '+1-555-0402',
        relationship: 'Spouse'
      }
    },
    {
      id: 'emp003',
      name: 'Carol Davis',
      uniqueId: 'EMP003',
      role: 'employee',
      email: 'carol@company.com',
      phone: '+1-555-0303',
      password: 'emp123',
      isActive: true,
      lastSeen: new Date(),
      homeLocation: {
        latitude: 40.7831,
        longitude: -73.9712,
        address: '789 Pine St, New York, NY'
      },
      emergencyContact: {
        name: 'Robert Davis',
        phone: '+1-555-0403',
        relationship: 'Spouse'
      }
    },
    {
      id: 'emp004',
      name: 'David Brown',
      uniqueId: 'EMP004',
      role: 'employee',
      email: 'david@company.com',
      phone: '+1-555-0304',
      password: 'emp123',
      isActive: true,
      lastSeen: new Date(),
      homeLocation: {
        latitude: 40.7282,
        longitude: -74.0776,
        address: '321 Elm St, New York, NY'
      },
      emergencyContact: {
        name: 'Lisa Brown',
        phone: '+1-555-0404',
        relationship: 'Spouse'
      }
    },
    {
      id: 'emp005',
      name: 'Eva Martinez',
      uniqueId: 'EMP005',
      role: 'employee',
      email: 'eva@company.com',
      phone: '+1-555-0305',
      password: 'emp123',
      isActive: true,
      lastSeen: new Date(),
      homeLocation: {
        latitude: 40.7411,
        longitude: -74.0018,
        address: '654 Cedar Rd, New York, NY'
      },
      emergencyContact: {
        name: 'Carlos Martinez',
        phone: '+1-555-0405',
        relationship: 'Spouse'
      }
    }
  ];

  // Initialize the service
  initialize(): void {
    if (this.isInitialized) return;
    
    try {
      // Try to restore user from storage
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          const userData = JSON.parse(stored);
          // Validate that the user still exists and is active
          const user = this.users.find(u => u.id === userData.id && u.isActive);
          if (user) {
            this.currentUser = user;
          } else {
            // Remove invalid stored user
            localStorage.removeItem('currentUser');
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
      // Clear invalid storage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('currentUser');
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

  async login(uniqueId: string, password?: string): Promise<boolean> {
    try {
    const user = this.users.find(u => u.uniqueId.toLowerCase() === uniqueId.toLowerCase());
    
    if (user && user.isActive) {
      // Check password if provided
      if (password && user.password !== password) {
        return false;
      }
      
      this.currentUser = user;
      user.lastSeen = new Date();
      
      // In a real app, you would store this in secure storage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      return true;
    }
    
    return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  logout(): void {
    try {
    this.currentUser = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('currentUser');
    }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getCurrentUser(): User | null {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    if (this.currentUser) {
      // Validate that the user still exists and is active
      const user = this.users.find(u => u.id === this.currentUser!.id && u.isActive);
      if (!user) {
        this.logout();
        return null;
      }
      return this.currentUser;
    }


    return null;
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

  getAllUsers(): User[] {
    return [...this.users];
  }

  getUsersByRole(role: 'employee' | 'admin' | 'driver'): User[] {
    return this.users.filter(user => user.role === role);
  }

  createUser(userData: Omit<User, 'id' | 'isActive' | 'lastSeen'>): User {
    try {
      // Validate unique ID
      const existingUser = this.users.find(u => u.uniqueId.toLowerCase() === userData.uniqueId.toLowerCase());
      if (existingUser) {
        throw new Error('User ID already exists');
      }
      
    const newUser: User = {
      ...userData,
      id: `${userData.role}_${Date.now()}`,
      isActive: true,
      lastSeen: new Date()
    };
    this.users.push(newUser);
    
    // Notify listeners about the new user
    this.notifyListeners('userCreated', newUser);
    
    return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  updateUser(userId: string, updates: Partial<User>): User | null {
    try {
    const userIndex = this.users.findIndex(u => u.id === userId);
      // If updating uniqueId, check for conflicts
      if (updates.uniqueId) {
        const existingUser = this.users.find(u => 
          u.uniqueId.toLowerCase() === updates.uniqueId!.toLowerCase() && u.id !== userId
        );
        if (existingUser) {
          throw new Error('User ID already exists');
        }
      }
    if (userIndex === -1) return null;

    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    
    // Update current user if it's the same user
    if (this.currentUser?.id === userId) {
      this.currentUser = this.users[userIndex];
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      }
    }
    
    // Notify listeners about the updated user
    this.notifyListeners('userUpdated', this.users[userIndex]);
    
    return this.users[userIndex];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  deleteUser(userId: string): boolean {
    try {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    const deletedUser = this.users[userIndex];
      
      // Don't allow deleting the current user
      if (this.currentUser?.id === userId) {
        throw new Error('Cannot delete the currently logged in user');
      }
      
    this.users.splice(userIndex, 1);
    
    // Notify listeners about the deleted user
    this.notifyListeners('userDeleted', deletedUser);
    
    return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  updateUserLocation(userId: string, location: { latitude: number; longitude: number }): boolean {
    try {
    const user = this.users.find(u => u.id === userId);
    if (!user) return false;

    user.currentLocation = {
      ...location,
      timestamp: new Date()
    };
    user.lastSeen = new Date();
    
    // Notify listeners about the updated user
    this.notifyListeners('userUpdated', user);
    
    return true;
    } catch (error) {
      console.error('Error updating user location:', error);
      return false;
    }
  }

  getActiveUsers(): User[] {
    return this.users.filter(user => user.isActive);
  }

  getUsersWithLocation(): User[] {
    return this.users.filter(user => user.currentLocation);
  }

  getUserById(userId: string): User | null {
    return this.users.find(user => user.id === userId) || null;
  }
}

export const AuthService = new AuthServiceClass();