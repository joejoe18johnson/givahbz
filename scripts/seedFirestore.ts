/**
 * Script to seed Firestore with initial campaign and donation data
 * Run with: npx tsx scripts/seedFirestore.ts
 * 
 * Make sure to set up Firebase config in .env first
 */

import { config } from "dotenv";
config();

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { campaigns } from "../lib/data";
import { adminDonations } from "../lib/adminData";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function seedFirestore() {
  try {
    console.log("Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("Seeding campaigns...");
    for (const campaign of campaigns) {
      const campaignRef = doc(db, "campaigns", campaign.id);
      await setDoc(campaignRef, {
        ...campaign,
        createdAt: campaign.createdAt ? Timestamp.fromDate(new Date(campaign.createdAt)) : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`✓ Seeded campaign: ${campaign.title}`);
    }

    console.log("\nSeeding donations...");
    for (const donation of adminDonations) {
      const donationRef = doc(collection(db, "donations"));
      await setDoc(donationRef, {
        ...donation,
        createdAt: donation.createdAt ? Timestamp.fromDate(new Date(donation.createdAt)) : serverTimestamp(),
      });
      console.log(`✓ Seeded donation: ${donation.donorName} - ${donation.amount}`);
    }

    console.log("\n✅ Firestore seeding completed successfully!");
    console.log(`   - ${campaigns.length} campaigns seeded`);
    console.log(`   - ${adminDonations.length} donations seeded`);
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error seeding Firestore:", error);
    if (error.code === "permission-denied") {
      console.error("\n⚠️  Permission denied. Make sure:");
      console.error("   1. Firestore is enabled in Firebase Console");
      console.error("   2. Firestore security rules allow read/write (test mode)");
      console.error("   3. Your Firebase project is active");
    } else if (error.code === "failed-precondition") {
      console.error("\n⚠️  Firestore not enabled. Please:");
      console.error("   1. Go to Firebase Console > Firestore Database");
      console.error("   2. Click 'Create database'");
      console.error("   3. Choose 'Start in test mode'");
    }
    process.exit(1);
  }
}

seedFirestore();
