# Firebase Setup Guide

This guide will help you set up Firebase for the GivahBz crowdfunding application.

## Prerequisites

- A Google account
- Node.js and npm installed
- Firebase CLI (optional, for advanced features)

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Enter a project name (e.g., "givahbz-crowdfund")
4. Follow the setup wizard:
   - Enable/disable Google Analytics (optional)
   - Accept terms and create project

## Step 2: Enable Firebase Services

### Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Enable **Email/Password** authentication:
   - Click "Email/Password"
   - Toggle "Enable"
   - Click "Save"
3. Enable **Google** authentication:
   - Click "Google"
   - Toggle "Enable"
   - Enter your project support email
   - Click "Save"

### Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Choose **Start in test mode** (for development)
3. Select a location (choose closest to your users)
4. Click "Enable"

**Important:** For production, you'll need to set up proper security rules. For now, test mode allows read/write access.

### Storage

1. Go to **Storage** > **Get started**
2. Start in **test mode** (for development)
3. Use the default storage location
4. Click "Done"

**Important:** For production, configure security rules to restrict access.

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname (e.g., "GivahBz Web")
5. Copy the Firebase configuration object

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

3. Replace the placeholder values with your actual Firebase config values.

## Step 5: Seed Firestore with Initial Data

To populate Firestore with sample campaigns and donations:

1. Install ts-node (if not already installed):
   ```bash
   npm install --save-dev ts-node typescript @types/node
   ```

2. Run the seed script:
   ```bash
   npx ts-node scripts/seedFirestore.ts
   ```

This will populate Firestore with:
- All campaigns from `lib/data.ts`
- All donations from `lib/adminData.ts`

## Step 6: Set Up Firestore Security Rules (Production)

For production, update Firestore security rules:

1. Go to **Firestore Database** > **Rules**
2. Replace with appropriate rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: read own doc; admin can read all (for Users list) and update any user's phoneVerified
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Campaigns: anyone can read; create by authenticated; update/delete by creator (creatorId) or admin
    match /campaigns/{campaignId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.creatorId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Campaigns under review: any signed-in user can submit; any can read (admin); only creator can delete (withdraw)
    match /campaignsUnderReview/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.creatorId == request.auth.uid;
    }
    
    // Notifications: users can only read/update their own; any authenticated user can create (e.g. admin when approving campaign)
    match /notifications/{notificationId} {
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
    
    // Donations: anyone can read; create by anyone (donors); update only by admin (approve pending donations)
    match /donations/{donationId} {
      allow read: if true;
      allow create: if true;
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Step 6b: Approve donations (optional server-side)

If you see **"Missing or insufficient permissions"** when approving donations in the admin panel, you can either:

**Option A – Firestore rules (client-side)**  
Ensure your Firestore rules include an **update** rule for `donations` so admins can update (see `firestore.rules` in the project and the donations block with `allow update` for admin). Publish the rules in Firebase Console.

**Option B – Server-side approve (recommended)**  
Use the Firebase Admin SDK so the server performs the update (no client rules needed):

1. In Firebase Console go to **Project settings** (gear) > **Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Add to your `.env` (or Vercel env vars) a **single** variable with the **entire** JSON as one line (escape quotes if needed), for example:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** paste the full JSON (e.g. `{"type":"service_account","project_id":"your-project",...}`).
4. Ensure `ADMIN_EMAILS` (or `NEXT_PUBLIC_ADMIN_EMAILS`) is set and includes the email you use to sign in as admin.
5. Restart the dev server (or redeploy). The admin **Approve** button will then call the server API, which uses the Admin SDK and bypasses Firestore security rules.

## Step 7: Set Up Storage Security Rules (Production)

1. Go to **Storage** > **Rules**
2. Replace with appropriate rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile photos: users can upload/delete their own
    match /profile-photos/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Campaign images: authenticated users can upload
    match /campaigns/{campaignId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Verification documents: users can upload their own
    match /verification-docs/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 8: Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test authentication:
   - Sign up with email/password
   - Sign in with Google
   - Check Firebase Console > Authentication to see users

3. Test data:
   - View campaigns (should load from Firestore)
   - Create a campaign (should save to Firestore)
   - Upload a profile photo (should save to Storage)

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Check that all environment variables are set correctly
- Restart the dev server after changing `.env`

### "Permission denied" errors
- Check Firestore security rules (may be in test mode)
- Check Storage security rules
- Verify user is authenticated

### Sign in with Google not working

Google sign-in uses **Firebase Authentication** (not NextAuth). If it fails:

1. **Enable Google in Firebase**
   - Firebase Console → **Authentication** → **Sign-in method**
   - Click **Google** → turn **Enable** on → set support email → **Save**

2. **Add your app domain to Authorized domains**
   - In the same **Authentication** section, open the **Settings** tab (or scroll to **Authorized domains**).
   - Click **Add domain** and add:
     - `localhost` (for local development)
     - Your production domain exactly as used in the browser (e.g. `givahbz.vercel.app` for Vercel, no `https://`).
   - If the domain is missing, you’ll see errors like **auth/unauthorized-domain** or "This domain is not authorized".

3. **Check environment variables**
   - Ensure `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` matches your project (e.g. `your-project-id.firebaseapp.com`).
   - All other `NEXT_PUBLIC_FIREBASE_*` vars must be set and correct for the same project.

4. **Popup vs redirect**
   - If the popup is blocked, the app falls back to a full-page redirect to Google. After signing in there, you’re sent back to the app; that’s expected.

### Verification document upload (ID / Address) not working
1. **Enable Storage**: In Firebase Console go to **Build > Storage** and click **Get started** if you haven’t already.
2. **Set storage bucket**: In `.env`, set `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com` (same as in your Firebase project settings). If missing, the app will try the default bucket from your project ID.
3. **Storage rules**: In Firebase Console go to **Storage > Rules**. Ensure you have a rule that allows authenticated users to write to their own folder:
   ```javascript
   match /verification-docs/{userId}/{allPaths=**} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```
   You can copy the full rules from **Step 7** in this guide. Then click **Publish**.
4. **Sign in**: Uploads only work when the user is signed in. If the error says "You must be signed in", sign out and sign back in, then try again.
5. **File type**: Use a JPG, PNG, or PDF under 10MB.

### Data not appearing
- Check Firebase Console to see if data exists
- Run the seed script again if needed
- Check browser console for errors

## Next Steps

- Set up proper security rules for production
- Configure Firebase Hosting (optional)
- Set up Firebase Cloud Functions (optional)
- Configure email templates for authentication
- Set up Firebase Analytics (optional)

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
