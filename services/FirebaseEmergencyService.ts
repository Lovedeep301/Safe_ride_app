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
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { EmergencyAlert } from './EmergencyService';

export interface FirebaseEmergencyAlert extends Omit<EmergencyAlert, 'timestamp' | 'acknowledgedAt' | 'resolvedAt'> {
  timestamp: any;
  acknowledgedAt?: any;
  resolvedAt?: any;
}

class FirebaseEmergencyServiceClass {
  async createEmergencyAlert(
    userId: string,
    userName: string,
    userRole: 'employee' | 'driver',
    type: EmergencyAlert['type'],
    message: string,
    location: { latitude: number; longitude: number; address?: string }
  ): Promise<FirebaseEmergencyAlert> {
    try {
      const alertData = {
        userId,
        userName,
        userRole,
        type,
        message,
        location,
        timestamp: serverTimestamp(),
        status: 'active' as const,
        priority: this.determinePriority(type)
      };

      const docRef = await addDoc(collection(db, 'emergencyAlerts'), alertData);

      return {
        id: docRef.id,
        ...alertData,
        timestamp: new Date()
      } as FirebaseEmergencyAlert;
    } catch (error) {
      console.error('Error creating emergency alert:', error);
      throw error;
    }
  }

  async getActiveAlerts(): Promise<FirebaseEmergencyAlert[]> {
    try {
      const alertsRef = collection(db, 'emergencyAlerts');
      // Use simple query without orderBy to avoid index requirement
      const q = query(
        alertsRef,
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      const alerts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseEmergencyAlert));
      
      // Sort in memory instead of using Firestore orderBy
      return alerts.sort((a, b) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return bTime - aTime; // desc order
      });
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      return [];
    }
  }

  async getAllAlerts(): Promise<FirebaseEmergencyAlert[]> {
    try {
      const alertsRef = collection(db, 'emergencyAlerts');
      // Get all alerts without orderBy to avoid index requirement
      const querySnapshot = await getDocs(alertsRef);
      const alerts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseEmergencyAlert));
      
      // Sort in memory instead of using Firestore orderBy
      return alerts.sort((a, b) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return bTime - aTime; // desc order
      });
    } catch (error) {
      console.error('Error fetching all alerts:', error);
      return [];
    }
  }

  subscribeToActiveAlerts(callback: (alerts: FirebaseEmergencyAlert[]) => void) {
    const alertsRef = collection(db, 'emergencyAlerts');
    // Use simple query without orderBy to avoid index requirement
    const q = query(
      alertsRef,
      where('status', '==', 'active')
    );

    return onSnapshot(q, (snapshot) => {
      let alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseEmergencyAlert));
      
      // Sort in memory instead of using Firestore orderBy
      alerts = alerts.sort((a, b) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return bTime - aTime; // desc order
      });
      
      callback(alerts);
    });
  }

  subscribeToAllAlerts(callback: (alerts: FirebaseEmergencyAlert[]) => void) {
    const alertsRef = collection(db, 'emergencyAlerts');
    // Get all alerts without orderBy to avoid index requirement
    const querySnapshot = collection(db, 'emergencyAlerts');

    return onSnapshot(querySnapshot, (snapshot) => {
      let alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseEmergencyAlert));
      
      // Sort in memory instead of using Firestore orderBy
      alerts = alerts.sort((a, b) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return bTime - aTime; // desc order
      });
      
      callback(alerts);
    });
  }

  async acknowledgeAlert(alertId: string, adminId: string): Promise<boolean> {
    try {
      const alertRef = doc(db, 'emergencyAlerts', alertId);
      await updateDoc(alertRef, {
        status: 'acknowledged',
        acknowledgedBy: adminId,
        acknowledgedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }

  async resolveAlert(alertId: string, adminId: string, notes?: string): Promise<boolean> {
    try {
      const alertRef = doc(db, 'emergencyAlerts', alertId);
      const updateData: any = {
        status: 'resolved',
        resolvedBy: adminId,
        resolvedAt: serverTimestamp()
      };
      
      if (notes) {
        updateData.notes = notes;
      }

      await updateDoc(alertRef, updateData);
      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  }

  async markFalseAlarm(alertId: string, adminId: string): Promise<boolean> {
    try {
      const alertRef = doc(db, 'emergencyAlerts', alertId);
      await updateDoc(alertRef, {
        status: 'false-alarm',
        resolvedBy: adminId,
        resolvedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error marking false alarm:', error);
      return false;
    }
  }

  async getAlertsByUser(userId: string): Promise<FirebaseEmergencyAlert[]> {
    try {
      const alertsRef = collection(db, 'emergencyAlerts');
      // Use simple query without orderBy to avoid index requirement
      const q = query(
        alertsRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const alerts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseEmergencyAlert));
      
      // Sort in memory instead of using Firestore orderBy
      return alerts.sort((a, b) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return bTime - aTime; // desc order
      });
    } catch (error) {
      console.error('Error fetching user alerts:', error);
      return [];
    }
  }

  private determinePriority(type: EmergencyAlert['type']): EmergencyAlert['priority'] {
    switch (type) {
      case 'panic':
      case 'medical':
        return 'critical';
      case 'accident':
      case 'security':
        return 'high';
      case 'breakdown':
        return 'medium';
      default:
        return 'low';
    }
  }
}

export const FirebaseEmergencyService = new FirebaseEmergencyServiceClass();