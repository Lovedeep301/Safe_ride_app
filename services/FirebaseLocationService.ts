import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { Location } from './LocationService';

export interface FirebaseLocationUpdate {
  id?: string;
  userId: string;
  userName: string;
  userRole: 'employee' | 'driver' | 'admin';
  location: Location;
  timestamp: any;
  batteryLevel?: number;
  isEmergency?: boolean;
}

class FirebaseLocationServiceClass {
  async updateUserLocation(
    userId: string,
    userName: string,
    userRole: 'employee' | 'driver' | 'admin',
    location: Location,
    batteryLevel?: number,
    isEmergency: boolean = false
  ): Promise<void> {
    try {
      const locationData: Omit<FirebaseLocationUpdate, 'id'> = {
        userId,
        userName,
        userRole,
        location,
        timestamp: serverTimestamp(),
        batteryLevel,
        isEmergency
      };

      // Add to location history
      await addDoc(collection(db, 'locationUpdates'), locationData);

      // Update user's current location in users collection
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

  async getLocationHistory(userId: string, limitCount: number = 50): Promise<FirebaseLocationUpdate[]> {
    try {
      const locationsRef = collection(db, 'locationUpdates');
      const q = query(
        locationsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseLocationUpdate));
    } catch (error) {
      console.error('Error fetching location history:', error);
      return [];
    }
  }

  async getRecentLocations(role?: 'employee' | 'driver' | 'admin'): Promise<FirebaseLocationUpdate[]> {
    try {
      const locationsRef = collection(db, 'locationUpdates');
      let q;
      
      if (role) {
        q = query(
          locationsRef,
          where('userRole', '==', role),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      } else {
        q = query(
          locationsRef,
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseLocationUpdate));
    } catch (error) {
      console.error('Error fetching recent locations:', error);
      return [];
    }
  }

  subscribeToLocationUpdates(
    callback: (locations: FirebaseLocationUpdate[]) => void,
    role?: 'employee' | 'driver' | 'admin'
  ) {
    const locationsRef = collection(db, 'locationUpdates');
    let q;
    
    if (role) {
      q = query(
        locationsRef,
        where('userRole', '==', role),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    } else {
      q = query(
        locationsRef,
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    }

    return onSnapshot(q, (snapshot) => {
      const locations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseLocationUpdate));
      callback(locations);
    });
  }

  subscribeToUserLocation(userId: string, callback: (locations: FirebaseLocationUpdate[]) => void) {
    const locationsRef = collection(db, 'locationUpdates');
    const q = query(
      locationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      const locations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseLocationUpdate));
      callback(locations);
    });
  }

  async getEmergencyLocations(): Promise<FirebaseLocationUpdate[]> {
    try {
      const locationsRef = collection(db, 'locationUpdates');
      const q = query(
        locationsRef,
        where('isEmergency', '==', true),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseLocationUpdate));
    } catch (error) {
      console.error('Error fetching emergency locations:', error);
      return [];
    }
  }

  subscribeToEmergencyLocations(callback: (locations: FirebaseLocationUpdate[]) => void) {
    const locationsRef = collection(db, 'locationUpdates');
    const q = query(
      locationsRef,
      where('isEmergency', '==', true),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const locations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseLocationUpdate));
      callback(locations);
    });
  }
}

export const FirebaseLocationService = new FirebaseLocationServiceClass();