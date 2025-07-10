import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAnalytics } from "firebase/analytics";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC4WwWudOsiyIWd8lr8V2ADJgcd_S12KJ4",
  authDomain: "v-safe-b7023.firebaseapp.com",
  projectId: "v-safe-b7023",
  storageBucket: "v-safe-b7023.firebasestorage.app",
  messagingSenderId: "83541218741",
  appId: "1:83541218741:web:a2117d5fc4ed78fd19f5fc",
  measurementId: "G-3WK7DS0JXM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Auth with persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize Messaging (web only for now)
let messaging = null;
if (Platform.OS === 'web') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

// Connect to Firestore emulator in development (optional)
if (__DEV__ && Platform.OS === 'web') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.log('Firestore emulator already connected or not available');
  }
}

export { auth, db, storage, messaging };
export default app;