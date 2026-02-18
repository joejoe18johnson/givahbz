/**
 * Script to create Firebase Auth users and their Firestore profiles
 * Run with: npx tsx scripts/createTestUsers.ts
 * 
 * This creates actual Firebase Auth users that can log in,
 * and their corresponding profile documents in Firestore.
 */

import { config } from "dotenv";
config();

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Default test users
const testUsers = [
  {
    email: "user@test.com",
    password: "Test123!",
    name: "Test User",
    role: "user" as const,
    verified: true,
    idVerified: false,
    addressVerified: false,
  },
  {
    email: "maria@test.com",
    password: "Test123!",
    name: "Maria Gonzalez",
    role: "user" as const,
    verified: true,
    idVerified: true,
    addressVerified: false,
  },
  {
    email: "admin@givahbz.com",
    password: "Admin123!",
    name: "Admin User",
    role: "admin" as const,
    verified: true,
    idVerified: true,
    addressVerified: true,
  },
];

async function createTestUsers() {
  try {
    console.log("Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log("Creating Firebase Auth users and Firestore profiles...\n");
    
    for (const userData of testUsers) {
      try {
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );
        
        const user = userCredential.user;
        
        // Update display name
        await updateProfile(user, { displayName: userData.name });
        
        // Create/update Firestore profile document
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          id: user.uid,
          email: userData.email,
          name: userData.name,
          verified: userData.verified,
          idVerified: userData.idVerified,
          addressVerified: userData.addressVerified,
          role: userData.role,
          heartedCampaigns: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        
        console.log(`✓ Created user: ${userData.name} (${userData.email})`);
        console.log(`  UID: ${user.uid}`);
        console.log(`  Role: ${userData.role}`);
        console.log(`  Verified: ${userData.verified}, ID Verified: ${userData.idVerified}\n`);
        
      } catch (error: any) {
        if (error.code === "auth/email-already-in-use") {
          console.log(`⚠️  User already exists: ${userData.email}`);
          console.log(`   Skipping creation (profile may need manual update)\n`);
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
          console.log();
        }
      }
    }

    console.log("✅ Test users creation completed!");
    console.log("\n📝 Login Credentials:");
    console.log("   user@test.com / Test123!");
    console.log("   maria@test.com / Test123!");
    console.log("   admin@givahbz.com / Admin123!");
    console.log("\n   You can now log in with these credentials in your app!");
    
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createTestUsers();
