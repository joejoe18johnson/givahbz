/**
 * Test script to verify Firestore connection
 * Run with: npx ts-node --esm scripts/testFirestoreConnection.ts
 * OR: node --loader ts-node/esm scripts/testFirestoreConnection.ts
 */

import { config } from "dotenv";
config();

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function testConnection() {
  try {
    console.log("🔌 Testing Firestore connection...\n");
    
    // Check if config is set
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your-api-key") {
      console.error("❌ Firebase config not set in .env file!");
      console.log("Please add your Firebase configuration to .env");
      process.exit(1);
    }

    console.log("✓ Firebase config loaded");
    console.log(`  Project ID: ${firebaseConfig.projectId}\n`);

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log("✓ Firebase initialized\n");

    // Test reading from campaigns collection
    console.log("📖 Testing Firestore read operations...\n");
    
    try {
      const campaignsRef = collection(db, "campaigns");
      const campaignsSnapshot = await getDocs(campaignsRef);
      
      if (campaignsSnapshot.empty) {
        console.log("⚠️  Campaigns collection is empty");
        console.log("   Run: npx ts-node scripts/seedFirestore.ts to seed data\n");
      } else {
        console.log(`✓ Found ${campaignsSnapshot.size} campaigns in Firestore:`);
        campaignsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          console.log(`   - ${data.title} (ID: ${doc.id})`);
        });
        console.log();
      }
    } catch (error: any) {
      console.error("❌ Error reading campaigns:", error.message);
      if (error.code === "permission-denied") {
        console.log("   → Check Firestore security rules (should be in test mode for development)");
      }
      throw error;
    }

    // Test reading from donations collection
    try {
      const donationsRef = collection(db, "donations");
      const donationsSnapshot = await getDocs(donationsRef);
      
      if (donationsSnapshot.empty) {
        console.log("⚠️  Donations collection is empty\n");
      } else {
        console.log(`✓ Found ${donationsSnapshot.size} donations in Firestore\n`);
      }
    } catch (error: any) {
      console.error("❌ Error reading donations:", error.message);
    }

    // Test reading from users collection
    try {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      if (usersSnapshot.empty) {
        console.log("⚠️  Users collection is empty (this is normal if no users have signed up yet)\n");
      } else {
        console.log(`✓ Found ${usersSnapshot.size} users in Firestore\n`);
      }
    } catch (error: any) {
      console.error("❌ Error reading users:", error.message);
    }

    console.log("✅ Firestore connection test completed successfully!");
    console.log("\nNext steps:");
    console.log("1. If collections are empty, run: npx ts-node scripts/seedFirestore.ts");
    console.log("2. Update your pages to use Firestore (see lib/services/campaignService.ts)");
    console.log("3. Restart your dev server: npm run dev");

  } catch (error: any) {
    console.error("\n❌ Firestore connection test failed!");
    console.error("Error:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Check that .env file has correct Firebase config");
    console.error("2. Verify Firestore is enabled in Firebase Console");
    console.error("3. Check Firestore security rules (should allow read/write in test mode)");
    console.error("4. Verify your Firebase project is active");
    process.exit(1);
  }
}

testConnection();
