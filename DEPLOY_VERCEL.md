# Get GivahBz showing on Vercel (https://givahbz.vercel.app)

You're deploying **from GitHub**: when you push to your connected repo, Vercel automatically builds and deploys. Your local `.env` is not in GitHub (it's gitignored), so you must add the same Firebase variables in Vercel.

Follow these steps **in order**. After each deploy, wait for the build to finish.

---

## 1. Push your latest code to GitHub

From your project folder:

```bash
git add .
git commit -m "Use server API for campaigns; force dynamic API routes"
git push origin main
```

(Use your real branch name if it’s not `main`.)

Vercel will detect the push and start a new deployment. In the Vercel dashboard, wait until it finishes (green check).

---

## 2. Add Firebase env vars in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → your **GivahBz** project.
2. **Settings** → **Environment Variables**.
3. Add these **6** variables (copy values from your local `.env`):

   | Name | Value (from your .env) |
   |------|------------------------|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Your API key |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `givah-1655f.firebaseapp.com` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | e.g. `givah-1655f` |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | e.g. `givah-1655f.appspot.com` |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Numeric ID |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | e.g. `1:...:web:...` |

4. For each variable, enable **Production** (and Preview if you want).
5. Save.

---

## 3. Redeploy so env vars are used

Env vars only apply on the **next** build.

1. In your project, open the **Deployments** tab.
2. Click the **⋯** on the **latest** deployment.
3. Click **Redeploy** → confirm.

Wait for the new deployment to finish.

---

## 4. Check that it’s working

Open these URLs (use your real domain if different):

1. **Firebase env check**  
   https://givahbz.vercel.app/api/firebase-check  
   - You should see: `"firebase": "connected"` and no `missing` list.  
   - If you see `"not_connected"`, the `missing` array lists vars to add or fix in Vercel. Add them and **Redeploy** again.

2. **Campaigns API**  
   https://givahbz.vercel.app/api/campaigns  
   - You should see a JSON array of campaigns (from Firestore).  
   - If you see `{"error":"Failed to load campaigns from Firestore."}`, Firebase env or Firestore rules are wrong; fix env and/or rules, then redeploy.

3. **Homepage**  
   https://givahbz.vercel.app  
   - Trending campaigns should load.  
   - If you see “Campaigns could not be loaded. Check Firebase is connected.”, step 1 or 2 failed; fix that and redeploy.

4. **Campaigns page**  
   https://givahbz.vercel.app/campaigns  
   - Should show the same campaigns as the API.

---

## If it’s still not showing

- **Hard refresh:** Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac) to avoid browser cache.
- **Confirm deployment:** Deployments tab → latest deployment should be “Ready” and include your latest commit.
- **Confirm env:** Settings → Environment Variables → all 6 `NEXT_PUBLIC_FIREBASE_*` exist and have the same values as in your working `.env`.
- **Redeploy again** after any env change.

Your Vercel domain will show live Firestore data once the env vars are set and a deployment has completed after adding them.
