# 🏈 NFL Playoff Pick'em

A mobile-first web app for running NFL playoff pick'em competitions with your friends. Built with React and Firebase.

## ✨ Features

- **Mobile-First Design** - Optimized for phones with touch-friendly interface
- **User Authentication** - Email/password signup and login
- **Real-Time Updates** - Live leaderboard and scoring
- **Admin Panel** - Update game results and manage matchups
- **Point System** - Wild Card (1pt), Divisional (2pts), Conference (3pts), Super Bowl (5pts)
- **Live Leaderboard** - See rankings update in real-time

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- A Firebase account (free tier works great)

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and create a new project
3. Once created, click the Web icon (</>) to add a web app
4. Register your app (nickname: "NFL Pickem")
5. Copy the Firebase config object (you'll need this in step 3)

### 3. Enable Firebase Services

In your Firebase project:

**Authentication:**
1. Go to "Authentication" → "Sign-in method"
2. Enable "Email/Password"

**Firestore Database:**
1. Go to "Firestore Database" → "Create database"
2. Start in "production mode" (we'll set rules next)
3. Choose your preferred region

**Firestore Security Rules:**
Go to "Firestore Database" → "Rules" and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Picks collection
    match /picks/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Config collection (for games)
    match /config/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

### 4. Install and Configure

```bash
# Install dependencies
npm install

# Open src/App.jsx and replace the Firebase config (lines 14-20) with your config:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 5. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000` and create your first account!

### 6. Make Yourself Admin

After creating your account:

1. Go to Firebase Console → Firestore Database
2. Find the `users` collection
3. Find your user document (by your email)
4. Click "Edit" and add a field:
   - Field: `isAdmin`
   - Type: `boolean`
   - Value: `true`
5. Refresh the app - you'll now see the "ADMIN" tab

## 📱 How to Use

### For Players:

1. **Sign Up** - Create an account with email/password
2. **Make Picks** - Tap teams to select winners before games start
3. **Track Score** - Your points appear in the header
4. **View Standings** - Check the leaderboard to see rankings

### For Admins:

1. **Update Matchups** - Go to Admin tab and enter team names
2. **Enter Results** - After each game, select the winner
3. **Scoring is Automatic** - Leaderboard updates instantly

## 🏆 Scoring System

- **Wild Card Round**: 1 point per correct pick
- **Divisional Round**: 2 points per correct pick
- **Conference Championships**: 3 points per correct pick
- **Super Bowl**: 5 points

## 🚀 Deploy to Firebase Hosting (Free)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting

# When prompted:
# - Select your Firebase project
# - Public directory: dist
# - Single-page app: Yes
# - Overwrite index.html: No

# Build the app
npm run build

# Deploy
firebase deploy
```

Your app will be live at: `https://YOUR_PROJECT_ID.web.app`

## 🎨 Customization

### Update Team Names
In the Admin panel, update the matchups as teams are determined throughout the playoffs.

### Modify Point Values
Edit `INITIAL_GAMES` array in `src/App.jsx` to change point values per round.

### Change Colors
Edit CSS variables in `src/App.css` (lines 3-10) to customize the theme:

```css
:root {
  --field-green: #1a472a;
  --neon-green: #39ff14;
  --gold: #ffb81c;
  /* ... */
}
```

## 🐛 Troubleshooting

**"Firebase: Error (auth/...)"**
- Check that Email/Password auth is enabled in Firebase Console

**"Missing or insufficient permissions"**
- Verify Firestore rules are set correctly (see step 3)

**Admin panel not showing**
- Make sure `isAdmin: true` is set in your user document in Firestore

**Picks not saving**
- Check browser console for errors
- Verify Firebase config is correct

## 📝 License

Free to use and modify for your pick'em pools!

## 🎯 Tips for Running a Pool

1. **Share the Link** - Send your deployed URL to friends
2. **Set a Deadline** - Remind everyone to pick before Wild Card weekend
3. **Prize Ideas** - Winner picks the restaurant, losers chip in for wings, bragging rights trophy
4. **Regular Updates** - Update game results promptly after each game
5. **Trash Talk** - Use the leaderboard for maximum competitive fun

## 💡 Future Enhancements Ideas

- Push notifications when games start
- Confidence points system
- Tiebreaker (Super Bowl score prediction)
- Group chat integration
- Historical stats tracking
- Email reminders for unpicked games

---

Built with ⚡ React, 🔥 Firebase, and 🏈 playoff excitement!
