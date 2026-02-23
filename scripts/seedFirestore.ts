/**
 * Script to seed Firestore with initial campaign and donation data
 * Run with: npx tsx scripts/seedFirestore.ts
 * 
 * Make sure to set up Firebase config in .env first
 */

import { config } from "dotenv";
config();

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, query, serverTimestamp, Timestamp } from "firebase/firestore";
import { campaigns } from "../lib/data";

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

    console.log("\nFetching campaigns from Firestore to create matching donations...");
    const campaignsSnapshot = await getDocs(query(collection(db, "campaigns")));
    const firestoreCampaigns = campaignsSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      title: docSnap.data().title || "",
    }));

    console.log(`Found ${firestoreCampaigns.length} campaigns in Firestore`);

    // Generate sample donations for each campaign
    const METHODS: Array<"bank" | "digiwallet" | "ekyash"> = ["bank", "digiwallet", "ekyash"];
    const NAMED_DONORS: Array<{ name: string; email: string }> = [
      { name: "John Smith", email: "john.donor@email.com" },
      { name: "Patricia Martinez", email: "patricia.m@email.com" },
      { name: "Robert Brown", email: "robert.b@email.com" },
      { name: "Michael Thompson", email: "michael.t@email.com" },
      { name: "Sarah Johnson", email: "sarah.j@email.com" },
      { name: "Emily Chen", email: "emily.c@email.com" },
      { name: "James Rodriguez", email: "james.r@email.com" },
      { name: "Belize Corp", email: "donor@company.bz" },
    ];
    const SAMPLE_NOTES: string[] = [
      "Wishing you all the best. Stay hopeful!",
      "Every bit helps. God bless.",
      "Sending love and prayers.",
      "Hope this helps. You're not alone.",
      "From one parent to another—thinking of you.",
      "Proud to support our community.",
      "Rebuild stronger. We're with you.",
      "Education changes lives. Happy to help.",
    ];
    const amounts = [15, 20, 25, 30, 40, 50, 60, 75, 100, 150];

    console.log("\nSeeding donations...");
    let donationCount = 0;
    const baseDate = new Date("2026-02-01T12:00:00Z").getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let cIdx = 0; cIdx < firestoreCampaigns.length; cIdx++) {
      const campaign = firestoreCampaigns[cIdx];
      // Create 10 donations per campaign
      for (let i = 0; i < 10; i++) {
        const isAnonymous = [1, 4, 7].includes(i);
        const donor = isAnonymous 
          ? { name: "Anonymous", email: `anon${cIdx}-${i}@donor.bz` }
          : NAMED_DONORS[(cIdx * 7 + i) % NAMED_DONORS.length];
        
        const createdAt = new Date(baseDate + (cIdx * 10 + i) * dayMs * 0.7);
        const method = METHODS[(cIdx + i) % METHODS.length];
        const note = i % 2 === 0 ? SAMPLE_NOTES[(cIdx * 10 + i) % SAMPLE_NOTES.length] : undefined;

        const donationRef = doc(collection(db, "donations"));
        await setDoc(donationRef, {
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          amount: amounts[i],
          donorEmail: donor.email,
          donorName: donor.name,
          anonymous: isAnonymous,
          method,
          status: "completed",
          createdAt: Timestamp.fromDate(createdAt),
          ...(note && { note }),
        });
        donationCount++;
      }
      console.log(`✓ Created 10 donations for campaign: ${campaign.title}`);
    }

    console.log("\n✅ Firestore seeding completed successfully!");
    console.log(`   - ${campaigns.length} campaigns seeded`);
    console.log(`   - ${donationCount} donations seeded`);
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
