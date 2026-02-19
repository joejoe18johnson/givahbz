# Firebase Database Connection Guide

Your app is now configured to connect to Firebase Firestore! Here's what was done and how to test it.

## ✅ What Was Completed

1. **Firebase Configuration** - Added your Firebase config to `.env`
2. **Updated Pages to Use Firestore**:
   - Home page (`app/page.tsx`) - Fetches campaigns from Firestore
   - Campaigns listing (`app/campaigns/page.tsx`) - Fetches all campaigns
   - Campaign detail (`app/campaigns/[id]/page.tsx`) - Fetches individual campaign
3. **Firestore Service Layer** - Created `lib/firebase/firestore.ts` with all database operations
4. **Campaign Service** - Created `lib/services/campaignService.ts` that automatically uses Firestore when configured

## 🔧 Setup Steps

### 1. Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **givah-1655f**
3. Click **Firestore Database** in the left menu
4. Click **Create database**
5. Choose **Start in test mode** (for development)
6. Select a location (choose closest to your users)
7. Click **Enable**

**Important:** Test mode allows read/write access for 30 days. For production, you'll need to set up proper security rules.

### 2. Seed Firestore with Initial Data

Run this command to populate your database with sample campaigns and donations:

```bash
npx ts-node scripts/seedFirestore.ts
```

This will add:
- 8 sample campaigns
- Multiple donations for each campaign

### 3. Restart Your Dev Server

After seeding, restart your development server:

```bash
# Stop the server (Ctrl+C), then:
npm run dev
```

## 🧪 Testing the Connection

### Test 1: View Campaigns in Browser

1. Open http://localhost:3000
2. You should see campaigns loading from Firestore
3. Check the browser console (F12) for any errors

### Test 2: Check Firebase Console

1. Go to Firebase Console > Firestore Database
2. You should see three collections:
   - `campaigns` - Contains all campaign data
   - `donations` - Contains donation records
   - `users` - Contains user profiles (created when users sign up)

### Test 3: Create a Campaign

1. Sign up/login to your app
2. Go to "Start a Campaign"
3. Fill out the form and submit
4. Check Firebase Console > Firestore > `campaigns` collection
5. You should see your new campaign!

## 📊 Current Data Flow

```
Browser → fetchCampaigns() → Firestore → Display campaigns
```

The app automatically:
- Uses Firestore if Firebase is configured (which it is!)
- Falls back to mock data if Firestore fails (for development)

## 🔍 Troubleshooting

### "Permission denied" errors

**Solution:** Check Firestore security rules:
1. Go to Firebase Console > Firestore Database > Rules
2. Make sure rules allow read/write (test mode):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;  // Test mode - allows all
       }
     }
   }
   ```

### Campaigns not showing

1. **Check if data exists:**
   - Go to Firebase Console > Firestore Database
   - Look for `campaigns` collection
   - If empty, run: `npx ts-node scripts/seedFirestore.ts`

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

3. **Verify .env file:**
   - Make sure `.env` has all Firebase config values
   - Restart dev server after changing `.env`

### Campaigns under review not showing (admin)

When a non-admin user creates a campaign, it should appear in **Admin → Under review**. If it doesn’t:

1. **Firestore rules**  
   The `campaignsUnderReview` collection must allow **create** for signed-in users and **read** for signed-in users.  
   - Go to **Firebase Console → Firestore Database → Rules**.  
   - Add (or merge) a block for `campaignsUnderReview` as in **FIREBASE_SETUP.md** (Step 6).  
   - Example: `allow read, create: if request.auth != null;` and `allow update, delete: if request.auth != null;` for `match /campaignsUnderReview/{docId}`.  
   - Publish the rules.

2. **Confirm the submit didn’t fail**  
   If the Firestore write is denied, the create-campaign page now shows an error and does **not** redirect. Try creating again and check for an alert.

3. **Check Firestore data**  
   In Firebase Console → Firestore, look for the **campaignsUnderReview** collection. If it’s missing or empty, the write is being denied (fix rules) or the create flow isn’t running (check console errors on submit).

### "Firebase: Error (auth/invalid-api-key)"

- Check that `.env` file has correct `NEXT_PUBLIC_FIREBASE_API_KEY`
- Restart dev server after changing `.env`

## 📝 Next Steps

1. **Seed your database:**
   ```bash
   npx ts-node scripts/seedFirestore.ts
   ```

2. **Test the app:**
   - View campaigns on home page
   - Browse campaigns page
   - View individual campaign details
   - Create a new campaign (should save to Firestore)

3. **Set up security rules** (for production):
   - See `FIREBASE_SETUP.md` for production security rules
   - Update rules to restrict access appropriately

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Campaigns appear on the home page
- ✅ Campaigns appear in Firebase Console > Firestore
- ✅ Creating a campaign saves to Firestore
- ✅ User signups create user documents in Firestore
- ✅ Profile photos upload to Firebase Storage

## 📚 Related Files

- `lib/firebase/config.ts` - Firebase initialization
- `lib/firebase/firestore.ts` - Firestore operations
- `lib/services/campaignService.ts` - Campaign fetching service
- `scripts/seedFirestore.ts` - Database seeding script
- `.env` - Firebase configuration (DO NOT COMMIT)

Your Firebase database is now connected! 🚀
