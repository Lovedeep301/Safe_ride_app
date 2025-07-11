# 🔥 Complete Firebase Setup Guide

## 📋 Overview
This guide will help you set up Firebase for your Employee Safety Hub app with real-time messaging, emergency alerts, and location tracking.

## 🚀 Step 1: Create Firebase Project

### 1.1 Go to Firebase Console
- Open your browser and go to: https://console.firebase.google.com
- Sign in with your Google account

### 1.2 Create New Project
1. Click **"Create a project"**
2. **Project name**: `employee-safety-hub` (or any name you prefer)
3. Click **"Continue"**
4. **Google Analytics**: You can disable this for now (uncheck the box)
5. Click **"Create project"**
6. Wait for project creation (takes 1-2 minutes)
7. Click **"Continue"** when done

## 🌐 Step 2: Add Web App

### 2.1 Register Web App
1. In your Firebase project dashboard, click the **Web icon** `</>`
2. **App nickname**: `Employee Safety Hub`
3. **Don't check** "Also set up Firebase Hosting"
4. Click **"Register app"**

### 2.2 Copy Firebase Config
1. You'll see a code block with your Firebase configuration
2. **IMPORTANT**: Copy this entire config object - you'll need it later!
3. It looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```
4. Click **"Continue to console"**

## 🔐 Step 3: Enable Authentication

### 3.1 Set Up Authentication
1. In the left sidebar, click **"Authentication"**
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. **Enable** the first option (Email/Password)
6. **Don't enable** "Email link (passwordless sign-in)" for now
7. Click **"Save"**

### 3.2 Create Test Users (Optional)
1. Go to the **"Users"** tab in Authentication
2. Click **"Add user"**
3. Create a test admin user:
   - **Email**: `admin@test.com`
   - **Password**: `admin123`
4. Click **"Add user"**

## 🗄️ Step 4: Create Firestore Database

### 4.1 Set Up Firestore
1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. **Security rules**: Choose **"Start in production mode"**
4. **Location**: Choose your nearest location (e.g., `us-central1`)
5. Click **"Done"**
6. Wait for database creation (takes 1-2 minutes)

### 4.2 Configure Security Rules
1. In Firestore Database, click the **"Rules"** tab
2. **Replace** the existing rules with this code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Messages - participants can read/write
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Conversations - participants can read/write
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null;
    }
    
    // Emergency alerts - authenticated users can create, admins can manage
    match /emergencyAlerts/{alertId} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Location updates - users can create their own, admins can read all
    match /locationUpdates/{updateId} {
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

3. Click **"Publish"**

## ⚙️ Step 5: Update Your App Configuration

### 5.1 Update firebase.config.ts
1. Open your project in the code editor
2. Find the file `firebase.config.ts`
3. **Replace** the existing `firebaseConfig` object with YOUR config from Step 2.2
4. It should look like this (with YOUR actual values):

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};
```

5. **Save** the file

## 🧪 Step 6: Test Your Setup

### 6.1 Create a Firebase User Account
1. Run your app: `npm run dev`
2. Go to the **Authentication** screen
3. Try to log in with one of the demo accounts (this will fail - that's expected)
4. You need to create a Firebase user account

### 6.2 Create Firebase Users
You have two options:

**Option A: Use Firebase Console**
1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Create users with these emails and passwords:
   - `admin@test.com` / `admin123`
   - `driver@test.com` / `driver123`
   - `employee@test.com` / `emp123`

**Option B: Use the App (Recommended)**
1. Modify the auth screen temporarily to allow sign-up
2. Or use Firebase Auth REST API

### 6.3 Test Real-time Features
1. Log in with a Firebase user account
2. Go to the **"Test"** tab
3. Click **"Run All Tests"**
4. You should see green checkmarks ✅

## 🎯 Step 7: Create User Documents

### 7.1 Add User Data to Firestore
After creating Firebase users, you need to add user documents:

1. Go to Firebase Console → Firestore Database
2. Click **"Start collection"**
3. **Collection ID**: `users`
4. **Document ID**: Use the Firebase user UID
5. Add these fields:
```
name: "Admin User"
uniqueId: "ADMIN001"
role: "admin"
email: "admin@test.com"
isActive: true
createdAt: (current timestamp)
```

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Web app registered
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Security rules updated
- [ ] firebase.config.ts updated with real credentials
- [ ] Firebase users created
- [ ] User documents added to Firestore
- [ ] Tests pass with green checkmarks

## 🚨 Common Issues & Solutions

### Issue: "Missing or insufficient permissions"
**Solution**: Make sure you're logged in with a Firebase user and have proper security rules

### Issue: "Firebase config not found"
**Solution**: Double-check your firebase.config.ts has real values, not placeholders

### Issue: "Tests stuck on loading"
**Solution**: Make sure you're logged in with a Firebase user account

### Issue: "User not found"
**Solution**: Create user documents in Firestore with proper role and uniqueId fields

## 🎉 Success!

Once all tests pass, you'll have:
- ✅ Real-time messaging
- ✅ Live emergency alerts
- ✅ GPS location tracking
- ✅ Automatic data synchronization

Your Employee Safety Hub is now powered by Firebase! 🔥