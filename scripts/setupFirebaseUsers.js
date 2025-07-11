// Updated Firebase User Setup Script with better compatibility
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, doc, setDoc, connectFirestoreEmulator } = require('firebase/firestore');

// Your Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

// Demo users to create
const demoUsers = [
  // Admin accounts
  {
    uniqueId: 'ADMIN001',
    name: 'John Doe',
    email: 'admin001@company.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1-555-0101'
  },
  {
    uniqueId: 'ADMIN002',
    name: 'Sarah Wilson',
    email: 'admin002@company.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1-555-0102'
  },
  
  // Driver accounts
  {
    uniqueId: 'DRV001',
    name: 'Michael Rodriguez',
    email: 'driver001@company.com',
    password: 'driver123',
    role: 'driver',
    phone: '+1-555-0201',
    licenseNumber: 'DL123456789',
    vehicleInfo: {
      plateNumber: 'ABC-1234',
      model: 'Toyota Hiace',
      capacity: 12
    }
  },
  {
    uniqueId: 'DRV002',
    name: 'Jennifer Chen',
    email: 'driver002@company.com',
    password: 'driver123',
    role: 'driver',
    phone: '+1-555-0202',
    licenseNumber: 'DL987654321',
    vehicleInfo: {
      plateNumber: 'XYZ-5678',
      model: 'Ford Transit',
      capacity: 15
    }
  },
  
  // Employee accounts
  {
    uniqueId: 'EMP001',
    name: 'Alice Johnson',
    email: 'employee001@company.com',
    password: 'emp123',
    role: 'employee',
    phone: '+1-555-0301',
    homeLocation: {
      latitude: 40.7614,
      longitude: -73.9776,
      address: '123 Main St, New York, NY'
    },
    emergencyContact: {
      name: 'John Johnson',
      phone: '+1-555-0401',
      relationship: 'Spouse'
    }
  },
  {
    uniqueId: 'EMP002',
    name: 'Bob Smith',
    email: 'employee002@company.com',
    password: 'emp123',
    role: 'employee',
    phone: '+1-555-0302',
    homeLocation: {
      latitude: 40.7505,
      longitude: -73.9934,
      address: '456 Oak Ave, New York, NY'
    },
    emergencyContact: {
      name: 'Mary Smith',
      phone: '+1-555-0402',
      relationship: 'Spouse'
    }
  }
];

async function createFirebaseUser(userData) {
  try {
    console.log(`Creating user: ${userData.name} (${userData.uniqueId})`);
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );

    // Create user document in Firestore
    const { password, ...userDataWithoutPassword } = userData;
    const firestoreUserData = {
      ...userDataWithoutPassword,
      firebaseUid: userCredential.user.uid,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), firestoreUserData);

    console.log(`✅ Successfully created: ${userData.name}`);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  User already exists: ${userData.email}`);
      return null;
    } else {
      console.error(`❌ Error creating ${userData.name}:`, error.message);
      return null;
    }
  }
}

async function setupAllUsers() {
  console.log('🚀 Starting Firebase user setup...\n');
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const userData of demoUsers) {
    try {
      const result = await createFirebaseUser(userData);
      if (result) {
        successCount++;
      } else {
        skipCount++;
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to create ${userData.name}:`, error.message);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Setup Summary:');
  console.log(`✅ Created: ${successCount} users`);
  console.log(`⚠️  Skipped: ${skipCount} users (already exist)`);
  console.log(`❌ Errors: ${errorCount} users`);
  
  if (successCount > 0 || skipCount > 0) {
    console.log('\n🎉 Setup complete! You can now log in with these accounts:');
    console.log('\n📋 Demo Accounts:');
    
    demoUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.uniqueId} / ${user.password}`);
    });
    
    console.log('\n💡 Note: Use the uniqueId (like ADMIN001) as the login ID in the app.');
  }
  
  process.exit(0);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the setup
setupAllUsers().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});