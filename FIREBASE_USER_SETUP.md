# 🔥 Create Firebase Test Users

## Quick Setup - Create Test Admin User

### Step 1: Create Firebase Auth User
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Users**
4. Click **"Add user"**
5. Enter:
   - **Email**: `admin@test.com`
   - **Password**: `admin123`
6. Click **"Add user"**

### Step 2: Create User Document in Firestore
1. Go to **Firestore Database**
2. Click **"Start collection"** (if no collections exist) or find the **"users"** collection
3. **Collection ID**: `users`
4. **Document ID**: Use the **User UID** from the Authentication tab (looks like: `abc123def456...`)
5. Add these fields:

```json
{
  "name": "Test Admin",
  "uniqueId": "ADMIN001", 
  "role": "admin",
  "email": "admin@test.com",
  "phone": "+1-555-0101",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "lastSeen": "2024-01-01T00:00:00Z"
}
```

### Step 3: Test Login
1. Go back to your app
2. Sign out if logged in
3. Sign in with:
   - **ID**: `ADMIN001`
   - **Password**: `admin123`
4. Go to **"Test"** tab - should now work! ✅

## Alternative: Use the Automated Script

Run this command in your terminal:
```bash
npm run setup-firebase-users
```

This creates all demo users automatically:
- **ADMIN001** / admin123
- **DRV001** / driver123  
- **EMP001** / emp123

## Troubleshooting

**If login fails:**
- Make sure the uniqueId in Firestore matches exactly: `ADMIN001`
- Check that the email in Firestore matches the Firebase Auth email
- Verify the user document is in the `users` collection with the correct UID

**If test still shows "Loading...":**
- Make sure you're logged in with a Firebase user (not mock data)
- Check browser console for any errors
- Try refreshing the page after login