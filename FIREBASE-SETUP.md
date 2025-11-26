# 🔥 Firebase Setup - Visual Guide

This guide walks you through the Firebase setup with descriptions of what you'll see.

## Part 1: Create Project

### Step 1: Go to Firebase Console
- Visit: https://console.firebase.google.com/
- Sign in with your Google account
- You'll see a page with "Add project" button

### Step 2: Create Project
- Click "Add project"
- Enter project name: "NFL Pickem" (or your choice)
- Click "Continue"
- Disable Google Analytics (optional, not needed)
- Click "Create project"
- Wait ~30 seconds for setup
- Click "Continue"

## Part 2: Add Web App

### Step 3: Register App
- You'll see the Firebase project overview
- Look for icons: iOS, Android, Web
- Click the Web icon `</>`
- App nickname: "NFL Pickem"
- Don't check "Firebase Hosting" (we'll do this later)
- Click "Register app"

### Step 4: Copy Configuration
You'll see a code block that looks like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "nfl-pickem-12345.firebaseapp.com",
  projectId: "nfl-pickem-12345",
  storageBucket: "nfl-pickem-12345.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```
- **Copy this entire object!**
- Click "Continue to console"

## Part 3: Enable Authentication

### Step 5: Set Up Auth
- In the left sidebar, find "Authentication"
- Click "Get started" button
- You'll see various sign-in methods

### Step 6: Enable Email/Password
- Find "Email/Password" in the list
- Click on it
- Toggle the first switch to "Enabled"
- Click "Save"
- Status should show "Enabled"

## Part 4: Set Up Firestore

### Step 7: Create Database
- In left sidebar, click "Firestore Database"
- Click "Create database" button
- Select "Start in production mode"
- Click "Next"
- Choose a location (any is fine, closer is faster)
- Click "Enable"
- Wait 30-60 seconds

### Step 8: Set Security Rules
- Click the "Rules" tab (top of page)
- You'll see a text editor with existing rules
- Delete everything and paste this:

```javascript
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

- Click "Publish" button
- You should see "Rules published successfully"

## Part 5: Configure Your App

### Step 9: Add Config to Code
- Open your project folder
- Navigate to `src/App.jsx`
- Find lines 14-20 (the firebaseConfig object)
- Replace with the config you copied in Step 4
- Save the file

## Part 6: Make Yourself Admin

### Step 10: First Sign Up
- Run `npm run dev` in your terminal
- Open http://localhost:3000
- Sign up with email/password
- You'll see the app but no Admin tab yet

### Step 11: Set Admin in Firestore
- Go back to Firebase Console
- Click "Firestore Database" in sidebar
- You'll see "Start collection" button (ignore it)
- Click on "users" collection (it was created automatically)
- You'll see your user document (named with a long ID)
- Click on your document
- Click "Add field" (+ button)
  - Field name: `isAdmin`
  - Type: `boolean` (use dropdown)
  - Value: check the box (true)
- Click "Add"

### Step 12: Refresh and Test
- Go back to your app (http://localhost:3000)
- Refresh the page (F5)
- You should now see "ADMIN" tab in navigation!
- Click it and update your first game

## 🎉 Done!

Your Firebase setup is complete. Now you can:
- Update game matchups in Admin panel
- Invite friends to sign up
- Make picks and track scores

## Common Issues

**"Missing or insufficient permissions"**
- Check that you published the Firestore rules correctly
- Make sure rules are exactly as shown in Step 8

**"Firebase: Error (auth/configuration-not-found)"**
- Double-check you pasted your config correctly in src/App.jsx
- Make sure you enabled Email/Password auth

**No Admin tab showing**
- Verify you set `isAdmin: true` in Firestore (Step 11)
- Make sure you refreshed the page after adding the field
- Check you're looking at the right user document (matches your email)

**Can't find users collection**
- Create an account first (Step 10)
- The collection is created automatically when you sign up
- Refresh the Firestore page if needed

---

If you're still stuck, check README.md for troubleshooting or reach out for help!
