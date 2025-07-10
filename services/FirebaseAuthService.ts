import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import { User } from './AuthService';

export interface FirebaseUserData extends Omit<User, 'password'> {
  firebaseUid: string;
  createdAt: any;
  updatedAt: any;
}

class FirebaseAuthServiceClass {
  private currentUser: FirebaseUserData | null = null;
  private authStateListeners: ((user: FirebaseUserData | null) => void)[] = [];
  private unsubscribeAuth: (() => void) | null = null;

  constructor() {
    this.initializeAuthListener();
  }

  private initializeAuthListener() {
    this.unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await this.getUserData(firebaseUser.uid);
          this.currentUser = userData;
          this.notifyAuthStateListeners(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          this.currentUser = null;
          this.notifyAuthStateListeners(null);
        }
      } else {
        this.currentUser = null;
        this.notifyAuthStateListeners(null);
      }
    });
  }

  private notifyAuthStateListeners(user: FirebaseUserData | null) {
    this.authStateListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  onAuthStateChanged(callback: (user: FirebaseUserData | null) => void) {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== callback);
    };
  }

  async signInWithUniqueId(uniqueId: string, password: string): Promise<boolean> {
    try {
      // First, find the user by uniqueId
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uniqueId', '==', uniqueId.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as FirebaseUserData;

      if (!userData.email) {
        throw new Error('User email not found');
      }

      // Sign in with email and password
      await signInWithEmailAndPassword(auth, userData.email, password);
      
      // Update last seen
      await this.updateUserLastSeen(userDoc.id);
      
      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'isActive' | 'lastSeen'> & { password: string }): Promise<FirebaseUserData> {
    try {
      if (!userData.email) {
        throw new Error('Email is required');
      }

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: userData.name
      });

      // Create user document in Firestore
      const firebaseUserData: FirebaseUserData = {
        ...userData,
        id: userCredential.user.uid,
        firebaseUid: userCredential.user.uid,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSeen: new Date()
      };

      // Remove password from stored data
      const { password, ...userDataWithoutPassword } = firebaseUserData;

      await setDoc(doc(db, 'users', userCredential.user.uid), userDataWithoutPassword);

      return userDataWithoutPassword as FirebaseUserData;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<FirebaseUserData>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserLocation(userId: string, location: { latitude: number; longitude: number }): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        currentLocation: {
          ...location,
          timestamp: new Date()
        },
        lastSeen: new Date(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user location:', error);
      throw error;
    }
  }

  private async getUserData(uid: string): Promise<FirebaseUserData> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }
    return userDoc.data() as FirebaseUserData;
  }

  private async updateUserLastSeen(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastSeen: new Date(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  getCurrentUser(): FirebaseUserData | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  async getAllUsers(): Promise<FirebaseUserData[]> {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebaseUserData));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getUsersByRole(role: 'employee' | 'admin' | 'driver'): Promise<FirebaseUserData[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', role));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebaseUserData));
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
  }

  // Real-time listeners
  subscribeToUsers(callback: (users: FirebaseUserData[]) => void) {
    const usersRef = collection(db, 'users');
    return onSnapshot(usersRef, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebaseUserData));
      callback(users);
    });
  }

  subscribeToUsersByRole(role: string, callback: (users: FirebaseUserData[]) => void) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebaseUserData));
      callback(users);
    });
  }

  destroy() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
    this.authStateListeners = [];
  }
}

export const FirebaseAuthService = new FirebaseAuthServiceClass();