# GivahBz - Crowdfunding Platform

A Belizean-based crowdfunding platform for organizations, charities, and individuals in need. Built with Next.js, React, TypeScript, and Tailwind CSS.

**Live site:** [https://givahbz.vercel.app](https://givahbz.vercel.app) · [Campaigns](https://givahbz.vercel.app/campaigns)

## Features

- ✅ **Verification System** - All campaigns require proof of need and are verified before publication
- 🎯 **Campaign Listings** - Browse verified campaigns with filtering by category
- 📊 **Progress Tracking** - Visual progress bars showing funding status
- 💰 **Donation System** - Support campaigns with customizable donation amounts
- 📝 **Campaign Creation** - Easy-to-use form with proof document upload
- 🏥 **Medical Campaigns** - Support for medical expenses and treatments
- 🎓 **Education Support** - Help students and schools in need
- 🌪️ **Disaster Relief** - Emergency funding for communities affected by disasters
- 👥 **Organization Support** - Charities and organizations can create verified campaigns
- 📱 **Responsive Design** - Works beautifully on all devices
- 🇧🇿 **Belizean Focus** - Designed specifically for Belizean communities

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase account (for production/testing)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions):
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Set up Storage
   - Copy your Firebase config to `.env`

3. Configure environment variables:
```bash
cp .env.example .env
```
   Then edit `.env` and add your Firebase configuration values.

4. Seed Firestore with initial data (optional):
```bash
npx ts-node scripts/seedFirestore.ts
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Test accounts (email / password)

Use these to sign in on the login page (no signup required):

| Role   | Email               | Password  |
|--------|---------------------|-----------|
| User   | `user@test.com`     | `Test123!` |
| User   | `maria@test.com`    | `Test123!` |
| Admin  | `admin@givahbz.com` | `Admin123!` |

Add `admin@givahbz.com` to `ADMIN_EMAILS` in your `.env` so the admin account can access the admin dashboard. You can also sign in with any other email/password for ad-hoc testing.

### Authentication

The app supports multiple authentication methods:

- **Email/Password** - Traditional email and password signup/login
- **Google Sign-in** - OAuth authentication with Google

For Google sign-in, add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your `.env` (see [.env.example](.env.example)). Step-by-step setup: **[GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)**.

**Note:** Firebase Authentication is now the primary authentication system. See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for complete Firebase configuration instructions.

### Connect Firebase to Vercel

**Localhost works but Vercel doesn’t?** Vercel doesn’t use your `.env`. Add the **same 6** `NEXT_PUBLIC_FIREBASE_*` variables in **Vercel → Project → Settings → Environment Variables**, then **Redeploy**. See **[VERCEL_FIREBASE.md](VERCEL_FIREBASE.md)** for step-by-step instructions and **[api/firebase-check](https://givahbz.vercel.app/api/firebase-check)** to verify after deploy.

**Campaign list data** is loaded dynamically from the server API (`GET /api/campaigns`), which reads from Firestore. The home page, campaigns page, my-campaigns, liked-campaigns, admin, and hearted-campaigns modal all use this API so Vercel gets live data when env vars are set.

## Project Structure

```
crowdfund/
├── app/                    # Next.js app directory
│   ├── campaigns/         # Campaign pages
│   │   ├── [id]/         # Individual campaign page
│   │   └── create/       # Create campaign page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── CampaignCard.tsx  # Campaign card component
│   ├── DonateButton.tsx  # Donation functionality
│   ├── Footer.tsx        # Site footer
│   └── Header.tsx        # Site header
└── lib/                  # Utilities and data
    └── data.ts           # Mock campaign data
```

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

## Campaign Categories

- **Medical** - Medical treatments, surgeries, healthcare expenses
- **Education** - School supplies, tuition, educational resources
- **Disaster Relief** - Hurricane, flood, and emergency relief
- **Community** - Community projects and initiatives
- **Emergency** - Urgent financial needs
- **Other** - Other verified needs

## Verification Process

All campaigns must provide proof of need, such as:
- Medical reports or doctor's notes
- Financial statements
- Official identification
- Organization registration documents
- Other relevant documentation

Campaigns are reviewed and verified before being published to ensure transparency and trust.

## Firebase Integration

This project uses Firebase for backend services:

- ✅ **Firebase Authentication** - User signup, login, and session management
- ✅ **Firestore Database** - Campaigns, users, and donations storage
- ✅ **Firebase Storage** - Profile photos and campaign images

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed setup instructions.

## Future Enhancements

- Payment integration (local Belizean payment methods)
- Real-time updates and notifications
- Advanced search and filtering
- Email notifications
- Social sharing
- Analytics dashboard
- Admin panel for campaign verification
- Multi-language support (English, Spanish, Creole)

## License

MIT
