/**
 * Update all campaigns in Firestore so goal is at most BZ$5,000.
 * Uses Firebase Admin SDK (service account) so it has write permission.
 * For any campaign with goal > 5000: set goal = 5000, raised = min(raised, 5000).
 *
 * Run with: npx tsx scripts/updateCampaignGoalsTo5000.ts
 * Requires: FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env
 */

import { config } from "dotenv";
config();

import * as admin from "firebase-admin";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const MAX_GOAL = 5000;
const campaignsCollection = "campaigns";

function loadServiceAccountKey(): Record<string, string> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw && typeof raw === "string" && raw.trim() !== "") {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed.private_key && parsed.client_email) return parsed;
    } catch {
      // fall through
    }
  }
  const cwd = process.cwd();
  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const pathCandidates: string[] = [];
  if (pathEnv && typeof pathEnv === "string" && pathEnv.trim() !== "") {
    const trimmed = pathEnv.trim().replace(/^["']|["']$/g, "").replace(/\r/g, "");
    if (trimmed) pathCandidates.push(resolve(cwd, trimmed), trimmed);
  }
  pathCandidates.push(resolve(cwd, "firebase-service-account.json"));
  for (const filePath of pathCandidates) {
    try {
      if (!existsSync(filePath)) continue;
      const content = readFileSync(filePath, "utf8");
      const parsed = JSON.parse(content) as Record<string, string>;
      if (parsed.private_key && parsed.client_email) return parsed;
    } catch {
      continue;
    }
  }
  return null;
}

async function main() {
  const key = loadServiceAccountKey();
  if (!key?.private_key || !key?.client_email) {
    console.error("❌ Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json in .env and put the key file in project root.");
    process.exit(1);
  }

  if (admin.apps.length === 0) {
    const privateKey = (key.private_key as string).replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: key.project_id,
        clientEmail: key.client_email,
        privateKey,
      }),
      projectId: key.project_id,
    });
  }

  const db = admin.firestore();
  const snapshot = await db.collection(campaignsCollection).get();
  let updated = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const goal = Number(data.goal) ?? 0;
    const raised = Number(data.raised) ?? 0;

    if (goal > MAX_GOAL) {
      const newRaised = Math.min(raised, MAX_GOAL);
      await docSnap.ref.update({
        goal: MAX_GOAL,
        raised: newRaised,
      });
      console.log(`✓ [${docSnap.id}] ${data.title || "(no title)"}: goal ${goal} → ${MAX_GOAL}, raised ${raised} → ${newRaised}`);
      updated++;
    }
  }

  console.log(`\n✅ Done. Updated ${updated} campaign(s) to max goal BZ$${MAX_GOAL}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
