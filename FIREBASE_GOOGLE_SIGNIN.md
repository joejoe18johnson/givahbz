# Sign in with Google (Firebase)

The app uses **Firebase Authentication** for Google sign-in (no NextAuth for Google). Follow these steps.

---

## 1. Enable Google in Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. Go to **Authentication** → **Sign-in method**.
3. Click **Google** → turn **Enable** on.
4. Set a **Project support email** (e.g. your email).
5. (Optional) Copy **Web SDK configuration** if you need client ID — Firebase uses its own OAuth client for Google sign-in; you don’t need a separate Google Cloud OAuth client for Firebase Google.
6. Click **Save**.

---

## 1b. Add your domain (fixes auth/unauthorized-domain)

If you see **"Firebase: Error (auth/unauthorized-domain)"**, the domain you're on is not allowed. Add it in Firebase:

1. In [Firebase Console](https://console.firebase.google.com/) → your project → **Authentication**.
2. Open the **Settings** tab (or **Authorized domains** in the top nav).
3. Under **Authorized domains**, click **Add domain**.
4. Add:
   - **`localhost`** — for local development.
   - **`givahbz.vercel.app`** — for your Vercel deployment (use your real Vercel domain if different).
   - Any other domain where the app runs (e.g. a custom domain).
5. Save. Try sign in with Google again.

---

## 2. Environment variables

- **Firebase**  
  All 6 `NEXT_PUBLIC_FIREBASE_*` variables must be set (see [VERCEL_FIREBASE.md](VERCEL_FIREBASE.md) or [.env.example](.env.example)). Firebase Google sign-in uses the same Firebase project config.

- **Admin role for Google users**  
  Set `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated emails) so those users get the admin role when they sign in with Google. Example:

  ```env
  NEXT_PUBLIC_ADMIN_EMAILS=admin@givahbz.com,you@example.com
  ```

  If you don’t set it, Google sign-in still works; those users will have the default **user** role.

---

## 3. Where it’s used

- **Login page** (`/auth/login`) — “Sign in with Google” uses Firebase `signInWithPopup`.
- **Signup page** (`/auth/signup`) — “Continue with Google” uses the same Firebase Google sign-in and then redirects to `/my-campaigns`.

No separate Google OAuth Client ID/Secret is required for Firebase Google sign-in; Firebase provides its own. (You may still have `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` if you use NextAuth for something else.)

---

## 4. Vercel

Add the same Firebase and admin env vars in **Vercel → Project → Settings → Environment Variables**, including `NEXT_PUBLIC_ADMIN_EMAILS` if you use it. Redeploy after changing env vars.
