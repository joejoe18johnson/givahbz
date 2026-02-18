/**
 * Script to seed Firestore users collection with default test users
 * Run with: npx tsx scripts/seedUsers.ts
 * 
 * Note: These are user profile documents. Users still need to be created
 * through Firebase Auth (signup/login) for authentication to work.
 * This script creates the user profile documents in Firestore.
 */

import { config } from "dotenv";
config();

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Default test users matching the test accounts
const testUsers = [
  {
    id: "user@test.com", // Using email as ID for consistency
    email: "user@test.com",
    name: "Test User",
    verified: true,
    idVerified: false,
    addressVerified: false,
    role: "user" as const,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "maria@test.com",
    email: "maria@test.com",
    name: "Maria Gonzalez",
    verified: true,
    idVerified: true,
    addressVerified: false,
    role: "user" as const,
    createdAt: new Date("2025-01-15"),
  },
  {
    id: "admin@givahbz.com",
    email: "admin@givahbz.com",
    name: "Admin User",
    verified: true,
    idVerified: true,
    addressVerified: true,
    role: "admin" as const,
    createdAt: new Date("2025-01-01"),
  },
];

async function seedUsers() {
  try {
    console.log("Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("Seeding users collection...\n");
    
    for (const user of testUsers) {
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        heartedCampaigns: [], // Initialize empty array for hearted campaigns
      }, { merge: true }); // Use merge to avoid overwriting existing data
      
      console.log(`✓ Seeded user: ${user.name} (${user.email})`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Verified: ${user.verified}, ID Verified: ${user.idVerified}`);
    }

    console.log("\n✅ Users seeding completed successfully!");
    console.log(`   - ${testUsers.length} users seeded`);
    console.log("\n⚠️  Important Notes:");
    console.log("   - These are user profile documents in Firestore");
    console.log("   - Users still need to sign up/login through Firebase Auth");
    console.log("   - After signup, Firebase Auth will create the auth user");
    console.log("   - The profile document will be linked to the auth user by UID");
    console.log("\n   To use these test accounts:");
    console.log("   1. Sign up with: user@test.com / Test123!");
    console.log("   2. Sign up with: maria@test.com / Test123!");
    console.log("   3. Sign up with: admin@givahbz.com / Admin123!");
    console.log("   (The profile documents will be created/updated automatically)");
    
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error seeding users:", error);
    if (error.code === "permission-denied") {
      console.error("\n⚠️  Permission denied. Make sure:");
      console.error("   1. Firestore is enabled in Firebase Console");
      console.error("   2. Firestore security rules allow read/write (test mode)");
    }
    process.exit(1);
  }
}

seedUsers();
