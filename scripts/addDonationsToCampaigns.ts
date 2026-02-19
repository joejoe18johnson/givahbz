/**
 * Script to add sample donations to all existing campaigns in Firestore
 * Run with: npx tsx scripts/addDonationsToCampaigns.ts
 * 
 * This ensures all campaigns have sample donor data for testing
 */

import { config } from "dotenv";
config();

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, query, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const METHODS: Array<"credit-card" | "bank" | "digiwallet" | "paypal"> = ["credit-card", "bank", "digiwallet", "paypal"];
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

async function addDonationsToCampaigns() {
  try {
    console.log("Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("Fetching campaigns from Firestore...");
    const campaignsSnapshot = await getDocs(query(collection(db, "campaigns")));
    const firestoreCampaigns = campaignsSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      title: docSnap.data().title || "",
    }));

    if (firestoreCampaigns.length === 0) {
      console.log("⚠️  No campaigns found in Firestore. Please seed campaigns first.");
      process.exit(0);
    }

    console.log(`Found ${firestoreCampaigns.length} campaigns`);

    // Check existing donations to avoid duplicates
    console.log("Checking existing donations...");
    const donationsSnapshot = await getDocs(query(collection(db, "donations")));
    const existingDonations = new Set(
      donationsSnapshot.docs.map((d) => d.data().campaignId)
    );

    console.log("\nAdding donations to campaigns...");
    let donationCount = 0;
    const baseDate = new Date("2026-02-01T12:00:00Z").getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let cIdx = 0; cIdx < firestoreCampaigns.length; cIdx++) {
      const campaign = firestoreCampaigns[cIdx];
      
      // Skip if this campaign already has donations
      if (existingDonations.has(campaign.id)) {
        console.log(`⏭️  Skipping ${campaign.title} (already has donations)`);
        continue;
      }

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
      console.log(`✓ Added 10 donations for campaign: ${campaign.title}`);
    }

    console.log("\n✅ Donations added successfully!");
    console.log(`   - ${donationCount} donations added`);
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error adding donations:", error);
    process.exit(1);
  }
}

addDonationsToCampaigns();
