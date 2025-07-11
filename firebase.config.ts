import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAnalytics } from "firebase/analytics";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 🔥 REPLACE THIS WITH YOUR ACTUAL FIREBASE CONFIG
// Get this from Firebase Console → Project Settings → General → Your apps
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
  measurementId: "G-XXXXXXXXXX"
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