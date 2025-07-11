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
  apiKey: "AIzaSyCDFL1_7bQ0BR-tDI5OPjgX4YIiA1nLCD0",
  authDomain: "v-safe-9b810.firebaseapp.com",
  projectId: "v-safe-9b810",
  storageBucket: "v-safe-9b810.firebasestorage.app",
  messagingSenderId: "896528088121",
  appId: "1:896528088121:web:0e28db22a2a4e18c1721e8",
  measurementId: "G-X183LYSHJ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (optional)
let analytics;
if (Platform.OS === 'web') {
  analytics = getAnalytics(app);
}

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

export { auth, db, storage, messaging, analytics };
export default app;