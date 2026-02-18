# GivahBz - Crowdfunding Platform

A Belizean-based crowdfunding platform for organizations, charities, and individuals in need. Built with Next.js, React, TypeScript, and Tailwind CSS.

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

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Test accounts (email / password)

Use these to sign in on the login page (no signup required):

| Role   | Email               | Password  |
|--------|---------------------|-----------|
| User   | `user@test.com`     | `Test123!` |
| User   | `maria@test.com`    | `Test123!` |
| Admin  | `admin@givahbz.com` | `Admin123!` |

Add `admin@givahbz.com` to `ADMIN_EMAILS` in your `.env` so the admin account can access the admin dashboard. You can also sign in with any other email/password for ad-hoc testing.

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

## Future Enhancements

- User authentication and profiles
- Payment integration (local Belizean payment methods)
- Real-time updates and notifications
- Image upload functionality
- Advanced search and filtering
- Email notifications
- Social sharing
- Analytics dashboard
- Admin panel for campaign verification
- Multi-language support (English, Spanish, Creole)

## License

MIT
