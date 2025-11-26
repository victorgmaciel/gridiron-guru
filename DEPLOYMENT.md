# 🌐 Deployment Guide - Put Your Pick'em Online

Once you have the app running locally, follow this guide to deploy it for free so friends can access it from anywhere.

## Option 1: Firebase Hosting (Recommended - Free & Easy)

### Why Firebase Hosting?
- ✅ Free forever (for reasonable traffic)
- ✅ HTTPS included
- ✅ Fast CDN
- ✅ Custom domain support
- ✅ One-command deployment
- ✅ Already using Firebase

### Step-by-Step

#### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### 2. Login to Firebase
```bash
firebase login
```
- This opens a browser
- Sign in with the same Google account you used for Firebase Console
- Approve the permissions

#### 3. Initialize Hosting (First Time Only)
```bash
firebase init hosting
```

Answer the prompts:
- **Project Setup**: Select your existing project (the one you created)
- **Public directory**: Type `dist` and press Enter
- **Single-page app**: Type `y` and press Enter
- **Automatic builds**: Type `n` and press Enter
- **Overwrite index.html**: Type `N` and press Enter

#### 4. Build Your App
```bash
npm run build
```
- This creates the `dist` folder
- Takes 10-30 seconds

#### 5. Deploy!
```bash
firebase deploy --only hosting
```
- Takes 30-60 seconds
- Shows you the live URL when done

#### 6. Test Your Live Site
- Click the Hosting URL (looks like: `https://YOUR-PROJECT-ID.web.app`)
- Test on your phone
- Share with friends!

### Future Updates
When you make changes:
```bash
npm run build
firebase deploy --only hosting
```
That's it! Changes go live in ~1 minute.

---

## Option 2: Vercel (Alternative - Also Free)

### Why Vercel?
- ✅ Also free
- ✅ Automatic deployments from GitHub
- ✅ Very fast
- ✅ Good for React apps

### Step-by-Step

#### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
# Create repo on GitHub, then:
git remote add origin YOUR-GITHUB-URL
git push -u origin main
```

#### 2. Deploy via Vercel
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Import Project"
4. Select your repo
5. Framework: Vite
6. Click "Deploy"

#### 3. Add Environment Variables (if needed)
- Go to Project Settings → Environment Variables
- Add your Firebase config if you want to hide it

---

## Option 3: Netlify (Another Alternative)

### Step-by-Step

#### 1. Build the App
```bash
npm run build
```

#### 2. Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### 3. Deploy
```bash
netlify deploy --prod
```
- Login when prompted
- Choose "Create & configure a new site"
- Publish directory: `dist`

---

## 🎯 Which Should You Choose?

| Feature | Firebase | Vercel | Netlify |
|---------|----------|---------|---------|
| Setup Time | 5 min | 3 min | 3 min |
| Free Tier | Generous | Generous | Generous |
| Custom Domain | Yes | Yes | Yes |
| Auto-Deploy | No* | Yes | Yes |
| Best For | Already using Firebase | GitHub workflow | Simplicity |

*You can set up auto-deploy with GitHub Actions if needed

**Recommendation**: Use **Firebase Hosting** since you're already using Firebase for auth and database.

---

## 📱 Custom Domain (Optional)

### With Firebase Hosting

#### 1. Buy a Domain
- Namecheap, Google Domains, etc.
- Something like: `nflpickem.com` or `yourname-pickem.com`

#### 2. Add to Firebase
```bash
firebase hosting:channel:deploy live
```
Then in Firebase Console:
1. Go to Hosting
2. Click "Add custom domain"
3. Enter your domain
4. Follow DNS instructions

#### 3. Update DNS
- Go to your domain registrar
- Add the A records Firebase gives you
- Wait 5-60 minutes for DNS propagation

#### 4. SSL Certificate
- Firebase automatically provisions HTTPS
- Takes ~15 minutes after DNS is set up

---

## 🔒 Security Checklist Before Going Live

- [ ] Firebase config is in code (it's safe - Firebase rules handle security)
- [ ] Firestore rules are set correctly (from setup guide)
- [ ] You tested signup/login
- [ ] You tested making picks
- [ ] You tested admin panel (only you can see it)
- [ ] You tested on mobile device
- [ ] You have your Firebase project backed up (export Firestore if needed)

---

## 📊 Monitoring Your App

### Check Usage (Firebase Console)
1. Go to your Firebase project
2. Click "Usage and billing"
3. Monitor:
   - Firestore reads/writes
   - Authentication
   - Hosting bandwidth

### Analytics (Optional)
Add Google Analytics:
1. Firebase Console → Analytics
2. Enable Analytics
3. View user activity

---

## 🚀 Performance Tips

### 1. Enable Caching
Already configured in `firebase.json` ✓

### 2. Optimize Images
- If you add team logos, compress them first
- Use WebP format

### 3. Monitor Load Times
- Test on slow 3G (Chrome DevTools)
- Should load in <3 seconds

---

## 🐛 Troubleshooting Deployment

**"Command not found: firebase"**
```bash
npm install -g firebase-tools
```

**"Error: HTTP Error: 403"**
- Make sure you're logged in: `firebase login`
- Check you selected right project

**"Build failed"**
- Check for errors: `npm run build`
- Make sure all dependencies installed: `npm install`

**"Site loads but can't login"**
- Add your live domain to Firebase Auth authorized domains
- Firebase Console → Authentication → Settings → Authorized domains

**"Firestore permissions errors"**
- Your local environment variables might be different
- Check Firebase config in `src/App.jsx`

---

## 💡 Pro Tips

1. **Deploy Early** - Test the live version before sharing widely
2. **Test on Multiple Devices** - iOS, Android, different browsers
3. **Set Up Monitoring** - Know if something breaks
4. **Keep Local Copy** - Don't delete your local files after deploying
5. **Announce Smartly** - Send the link with clear instructions

---

## 🎉 You're Live!

Share your pick'em with friends:

```
🏈 Join my NFL Playoff Pick'em! 🏈

Make your picks: https://your-app-url.web.app

1. Create an account
2. Pick winners for each playoff game
3. Compete for bragging rights!

Scoring: Wild Card (1pt), Divisional (2pt), 
Conference (3pt), Super Bowl (5pt)

Get your picks in before kickoff! 🏆
```

---

Need help? Check README.md or the Firebase documentation.
