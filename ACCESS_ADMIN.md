# How to Access the Admin Dashboard

## 1. Create a `.env` file (if you don't have one)

In the project root (`CrowdFund/`), copy the example and add a secret:

```bash
cp .env.example .env
```

Then edit `.env` and set at least:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any-random-string-at-least-32-chars-long
ADMIN_EMAILS=admin@givahbz.com
```

- Use your actual port if different (e.g. `http://localhost:3002`).
- Generate a secret: `openssl rand -base64 32` and paste the result as `NEXTAUTH_SECRET`.
- **ADMIN_EMAILS** must include the email you use to sign in as admin (comma-separated for multiple).

## 2. Restart the dev server

After changing `.env`, restart:

```bash
npm run dev
```

## 3. Sign in with the admin account

1. Open **http://localhost:3000/auth/login** (or your port).
2. Use **Email and password** (not Google unless that email is in ADMIN_EMAILS).
3. Enter:
   - **Email:** `admin@givahbz.com`
   - **Password:** `Admin123!`
4. Click Sign in.

## 4. Open the admin dashboard

- Go to **http://localhost:3000/admin** (or your port).

You should see the dashboard with stats (Campaigns, Total Raised, Users, Donations, Under review) and tables for recent campaigns, users, and donations. Use the left sidebar to open **Campaigns**, **Donations**, **Under review**, or **Users**.

---

## If you still can't access

- **Redirected to login:** Ensure `NEXTAUTH_SECRET` is set in `.env` and you restarted the server. Sign in again with `admin@givahbz.com` / `Admin123!`.
- **Redirected to home (/):** Your session is valid but your email is not in `ADMIN_EMAILS`. Add `admin@givahbz.com` to `ADMIN_EMAILS` in `.env`, restart, then sign out and sign in again with `admin@givahbz.com`.
- **Blank or loading forever:** Check the browser console and terminal for errors. Ensure `.env` is in the project root (same folder as `package.json`).
