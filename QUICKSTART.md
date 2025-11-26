# 🚀 Quick Start Guide

## Step 1: Get the Code

Download and extract this folder, then open a terminal in the project directory.

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Firebase (5 minutes)

### Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "NFL Pickem" (or anything you want)
4. Click through the setup (disable Google Analytics if you want)

### Get Your Config
1. In your new project, click the **</>** icon (Add app)
2. Register app as "NFL Pickem"
3. Copy the `firebaseConfig` object

### Enable Authentication
1. Click "Authentication" in the left menu
2. Click "Get Started"
3. Click "Email/Password" and toggle it ON
4. Click "Save"

### Enable Firestore
1. Click "Firestore Database" in the left menu
2. Click "Create database"
3. Choose "Start in production mode"
4. Pick your region (anywhere is fine)
5. Click "Rules" tab and paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /picks/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /config/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

6. Click "Publish"

## Step 4: Add Your Firebase Config

Open `src/App.jsx` and find lines 14-20. Replace with your config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 5: Run It!

```bash
npm run dev
```

Open http://localhost:3000 in your browser (or phone)!

## Step 6: Make Yourself Admin

1. Sign up for an account in the app
2. Go back to Firebase Console → Firestore Database
3. Click on the `users` collection
4. Find your user (look for your email)
5. Click the document, then click "Add field"
   - Field: `isAdmin`
   - Type: boolean
   - Value: true
6. Refresh the app - you'll see the ADMIN tab!

## Step 7: Deploy (Optional)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

Your app will be live at `https://YOUR_PROJECT_ID.web.app`

## 🎉 You're Done!

Share your link with friends and start picking!

---

## Need Help?

**Can't see admin tab?**
- Make sure you set `isAdmin: true` in Firestore for your user

**Firebase errors?**
- Double-check your config in `src/App.jsx`
- Make sure Authentication and Firestore are enabled

**App won't load?**
- Check browser console for errors (F12)
- Make sure you ran `npm install`

**Questions?**
- Check the full README.md for detailed docs
