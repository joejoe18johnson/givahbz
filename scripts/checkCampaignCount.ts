/**
 * Check how many campaigns are in Firestore (for debugging).
 * Run with: npx tsx scripts/checkCampaignCount.ts
 */

import { config } from "dotenv";
config();

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocsFromServer, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snapshot = await getDocsFromServer(query(collection(db, "campaigns")));
  console.log("Campaigns in Firestore:", snapshot.size);
  snapshot.docs.forEach((d, i) => console.log(`  ${i + 1}. [${d.id}] ${(d.data() as { title?: string }).title ?? "—"}`));
  if (snapshot.size < 28) {
    console.log("\nTo add 20 more campaigns (ids 9–28), run: npx tsx scripts/seedTwentyCampaigns.ts");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
