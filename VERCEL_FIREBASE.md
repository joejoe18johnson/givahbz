# Connect Firebase to Vercel

Follow these steps so your Vercel deployment (e.g. **https://givahbz.vercel.app**) uses the same Firebase project as local development.

---

## If localhost works but Vercel does not

**Local works** = your `.env` and Firebase project are correct.  
**Vercel** does not read your `.env` file. You must add the **same 6 variables** in the Vercel dashboard and **redeploy**.

1. Copy the 6 values from your **`.env`** (the ones that make localhost work).
2. In Vercel: **Project → Settings → Environment Variables** → add each variable (name + value, no quotes).
3. **Deployments → ⋯ on latest → Redeploy.** Env vars only apply after a new deployment.
4. Check: **https://givahbz.vercel.app/api/firebase-check** — must show `"firebase": "connected"`.

---

## Step 1: Get your Firebase config values

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project (e.g. **givah-1655f**)
3. Click the **gear icon** → **Project settings**
4. Scroll to **Your apps** and select your **Web app** (or add one)
5. Copy the values from the `firebaseConfig` object. You need:

| Variable | Example | Where to find it |
|----------|---------|------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `givah-1655f.firebaseapp.com` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `givah-1655f` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `givah-1655f.appspot.com` or `...firebasestorage.app` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `1098208760453` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:1098208760453:web:...` | `appId` |

You can copy these from your local **`.env`** file (same values you use for `npm run dev`).

---

## Step 2: Add environment variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Open your **GivahBz** project (or the one that deploys givahbz.vercel.app)
3. Open **Settings** → **Environment Variables**
4. Add each variable:

   - **Name:** exactly as in the table (e.g. `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - **Value:** paste the value (no quotes)
   - **Environment:** leave **Production**, **Preview**, and **Development** checked (or at least **Production**)

Add all six:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

5. Click **Save** for each (or use “Add another” and save once).

---

## Step 3: (Optional) Add other env vars your app uses

If your app uses these locally, add them in Vercel too with the **same values** you use in production:

- `NEXTAUTH_URL` → set to **`https://givahbz.vercel.app`** (your live URL)
- `NEXTAUTH_SECRET` → same secret as in `.env`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` → same as `.env` (and add the Vercel domain to Google OAuth if needed)
- `ADMIN_EMAILS` → same as `.env`

---

## Step 4: Redeploy so Vercel uses the new variables

Environment variables are applied only on the **next build**.

1. In your project on Vercel, open the **Deployments** tab
2. Click the **⋯** on the latest deployment → **Redeploy**
3. Confirm **Redeploy** (no need to clear cache unless you want a full rebuild)

Or push a new commit to your connected Git branch; that will trigger a new deployment and pick up the env vars.

---

## Step 5: Confirm Firebase is connected

1. Open **https://givahbz.vercel.app/api/firebase-check** — if `firebase` is `"not_connected"`, the response lists missing vars; add them in Vercel and redeploy.
2. Open **https://givahbz.vercel.app/campaigns** — you should see campaigns loading from Firestore (same data as in Firebase Console).
3. If you see “Unable to load campaigns” or an error:
   - Double-check every `NEXT_PUBLIC_FIREBASE_*` value in Vercel (no typos, no extra spaces).
   - Ensure Firestore (and Auth/Storage if you use them) are enabled for that project in Firebase Console.
   - Redeploy again after changing env vars.

---

## Troubleshooting: "Firebase still not connected"

- **Check endpoint:** Open **https://givahbz.vercel.app/api/firebase-check** — it lists which env vars are missing. Add them in Vercel → Settings → Environment Variables, then **Redeploy**.
- **Redeploy after every change:** Env vars are applied at **build** time. Deployments → ⋯ → Redeploy.
- **Exact variable names** (no typos): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
- **Same values as local:** Copy from your working `.env` or Firebase Console.
- **No quotes** when pasting values in Vercel (e.g. `AIzaSy...`, not `"AIzaSy..."`).
- **Firestore rules:** Firebase Console → Firestore → Rules — ensure read is allowed for your campaigns collection.

---

## Checklist

- [ ] All 6 Firebase env vars added in Vercel
- [ ] `NEXTAUTH_URL` set to `https://givahbz.vercel.app` (if you use NextAuth)
- [ ] Redeploy completed after adding/editing variables
- [ ] Campaigns page loads and shows data from Firestore

Your Vercel app is now using your Firebase database.
