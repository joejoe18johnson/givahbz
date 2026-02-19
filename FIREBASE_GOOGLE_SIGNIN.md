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
