/**
 * Seed 50 fictitious campaigns with random goals (from $300), ~10 fully funded, and fictitious donors.
 * Uses Firebase Admin SDK (service account) so it can write despite Firestore rules.
 * Run with: npx tsx scripts/seedFiftyCampaigns.ts
 * Requires: FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env
 */

import { config } from "dotenv";
config();

import * as admin from "firebase-admin";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const APP_PROJECT_ID = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim();

function parseKey(content: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(content) as Record<string, string>;
    if (parsed.private_key && parsed.client_email) return parsed;
  } catch {
    // ignore
  }
  return null;
}

/** Load service account key. Prefers a key whose project_id matches NEXT_PUBLIC_FIREBASE_PROJECT_ID. */
function loadServiceAccountKey(): Record<string, string> | null {
  const cwd = process.cwd();
  const candidates: Array<{ key: Record<string, string>; projectId: string }> = [];

  // 1) Try project-specific file first (e.g. firebase-service-account-givah-mvp.json)
  if (APP_PROJECT_ID) {
    const projectFile = resolve(cwd, `firebase-service-account-${APP_PROJECT_ID}.json`);
    if (existsSync(projectFile)) {
      const key = parseKey(readFileSync(projectFile, "utf8"));
      if (key?.project_id) {
        candidates.push({ key, projectId: key.project_id });
        if (key.project_id === APP_PROJECT_ID) return key;
      }
    }
  }

  // 2) FIREBASE_SERVICE_ACCOUNT_PATH
  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (pathEnv && typeof pathEnv === "string" && pathEnv.trim() !== "") {
    const trimmed = pathEnv.trim().replace(/^["']|["']$/g, "").replace(/\r/g, "");
    for (const p of [resolve(cwd, trimmed), trimmed]) {
      if (existsSync(p)) {
        const key = parseKey(readFileSync(p, "utf8"));
        if (key?.project_id) {
          candidates.push({ key, projectId: key.project_id });
          if (APP_PROJECT_ID && key.project_id === APP_PROJECT_ID) return key;
        }
        break;
      }
    }
  }

  // 3) firebase-service-account.json
  const defaultPath = resolve(cwd, "firebase-service-account.json");
  if (existsSync(defaultPath)) {
    const key = parseKey(readFileSync(defaultPath, "utf8"));
    if (key?.project_id) {
      candidates.push({ key, projectId: key.project_id });
      if (APP_PROJECT_ID && key.project_id === APP_PROJECT_ID) return key;
    }
  }

  // 4) FIREBASE_SERVICE_ACCOUNT_JSON (raw)
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw && typeof raw === "string" && raw.trim() !== "") {
    const key = parseKey(raw);
    if (key?.project_id) {
      candidates.push({ key, projectId: key.project_id });
      if (APP_PROJECT_ID && key.project_id === APP_PROJECT_ID) return key;
    }
  }

  // 5) FIREBASE_SERVICE_ACCOUNT_JSON_BASE64
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  if (base64 && typeof base64 === "string" && base64.trim() !== "") {
    try {
      const content = Buffer.from(base64.trim(), "base64").toString("utf8");
      const key = parseKey(content);
      if (key?.project_id) {
        candidates.push({ key, projectId: key.project_id });
        if (APP_PROJECT_ID && key.project_id === APP_PROJECT_ID) return key;
      }
    } catch {
      // ignore
    }
  }

  // Return first available key if we have any
  if (candidates.length > 0) return candidates[0].key;
  return null;
}

const CATEGORIES = ["Medical expenses", "Educational support", "Disaster recovery", "Other"] as const;
const CREATOR_TYPES = ["individual", "organization", "charity"] as const;
const LOCATIONS = [
  "Belize City, Belize",
  "San Pedro, Ambergris Caye",
  "Dangriga, Stann Creek",
  "Orange Walk Town, Belize",
  "Corozal Town, Belize",
  "Punta Gorda, Toledo",
  "Belmopan, Cayo",
  "Caye Caulker, Belize",
  "Placencia, Stann Creek",
  "Benque Viejo, Cayo",
];

const TITLES: string[] = [
  "Medical treatment for child at KHMH",
  "Surgery and recovery for Maria",
  "Dialysis support for a year",
  "Cancer treatment fund",
  "Emergency surgery for Carlos",
  "School fees and supplies for Toledo kids",
  "Library books for rural schools",
  "University scholarship fund",
  "After-school tutoring program",
  "Disaster recovery for Dangriga families",
  "Flood relief in Cayo villages",
  "Hurricane damage repair",
  "Fire recovery for Belize City family",
  "Roof repair after storm",
  "Community well for San Pedro",
  "Clean water for village school",
  "Funeral support for the Reyes family",
  "Emergency housing for displaced family",
  "Wheelchair and home ramp",
  "Prosthetic limb for Pedro",
  "Youth sports equipment Cayo",
  "Music program for at-risk youth",
  "Elderly food assistance Corozal",
  "Community center renovation",
  "Veterinary care for community animals",
  "School bus repair for village",
  "Teacher training workshop",
  "Disaster preparedness kits",
  "Replacement furniture after flood",
  "Medical equipment for clinic",
  "Baby formula and supplies",
  "Hearing aids for children",
  "Diabetes medication fund",
  "Physical therapy after accident",
  "Mental health support program",
  "Dental care for families",
  "Eye surgery for child",
  "Ambulance fuel for remote area",
  "Rebuild after house fire",
  "Boat repair for fisherman family",
  "Farm seeds after drought",
  "School uniforms and shoes",
  "Laptop for online learning",
  "Solar lights for village",
  "Community garden startup",
  "Youth skills training",
  "Women's small business fund",
  "Veteran support program",
  "Single parent emergency fund",
  "Orphanage supplies and repairs",
];

const DONOR_NAMES = [
  "John Smith", "Patricia Martinez", "Robert Brown", "Sarah Johnson", "Michael Thompson",
  "Emily Chen", "James Rodriguez", "Lisa Williams", "David Garcia", "Anna Davis",
  "Carlos Mendez", "Maria Santos", "Thomas Wilson", "Jennifer Lee", "Christopher Moore",
  "Amanda Taylor", "Daniel Anderson", "Jessica Clark", "Matthew White", "Stephanie Hall",
  "Belize Community Fund", "Rotary Club Belize", "Anonymous", "Anonymous", "Anonymous",
];
const DONOR_EMAILS = [
  "john.s@email.com", "patricia.m@email.com", "robert.b@email.com", "sarah.j@email.com", "michael.t@email.com",
  "emily.c@email.com", "james.r@email.com", "lisa.w@email.com", "david.g@email.com", "anna.d@email.com",
  "carlos.m@email.com", "maria.s@email.com", "thomas.w@email.com", "jennifer.l@email.com", "chris.m@email.com",
  "amanda.t@email.com", "daniel.a@email.com", "jessica.c@email.com", "matt.w@email.com", "steph.h@email.com",
  "donate@community.bz", "rotary@belize.bz", "anon1@donor.bz", "anon2@donor.bz", "anon3@donor.bz",
];
const METHODS: Array<"credit-card" | "bank" | "digiwallet" | "paypal"> = ["credit-card", "bank", "digiwallet", "paypal"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Split totalRaised into n amounts that sum to totalRaised (each at least 1). */
function splitAmounts(totalRaised: number, n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [totalRaised];
  const minEach = 1;
  const maxFirst = totalRaised - (n - 1) * minEach;
  if (maxFirst < minEach) return [totalRaised];
  const amounts: number[] = [];
  let left = totalRaised;
  for (let i = 0; i < n - 1; i++) {
    const max = Math.min(left - (n - 1 - i) * minEach, left - minEach);
    const a = randomInt(minEach, Math.max(minEach, max));
    amounts.push(a);
    left -= a;
  }
  amounts.push(left);
  return amounts.sort(() => Math.random() - 0.5);
}

async function seedFiftyCampaigns() {
  try {
    const key = loadServiceAccountKey();
    if (!key?.private_key || !key?.client_email) {
      console.error("❌ No service account key found. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env.");
      process.exit(1);
    }
    if (APP_PROJECT_ID && key.project_id !== APP_PROJECT_ID) {
      console.error(`❌ Service account is for project "${key.project_id}" but your app uses "${APP_PROJECT_ID}".`);
      console.error(`   To seed ${APP_PROJECT_ID}: Firebase Console → ${APP_PROJECT_ID} → Project settings → Service accounts → Generate new private key.`);
      console.error(`   Save the file as firebase-service-account-${APP_PROJECT_ID}.json in the project root (or set FIREBASE_SERVICE_ACCOUNT_PATH to it).`);
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
    console.log("Using Firebase Admin (project:", key.project_id, ")");

    const usedTitles = new Set<string>();
    const campaigns: Array<{
      title: string;
      description: string;
      fullDescription: string;
      creator: string;
      creatorType: (typeof CREATOR_TYPES)[number];
      goal: number;
      raised: number;
      backers: number;
      daysLeft: number;
      category: string;
      image: string;
      location: string;
      createdAt: string;
      verified: boolean;
    }> = [];

    // Goals between 300 and 8000; we want ~10 fully funded, 40 random
    const NUM_FULLY_FUNDED = 10;
    const fullyFundedIndices = new Set(pickN([...Array(50).keys()], NUM_FULLY_FUNDED));

    for (let i = 0; i < 50; i++) {
      let title = pick(TITLES);
      while (usedTitles.has(title)) {
        title = pick(TITLES);
      }
      usedTitles.add(title);
      const goal = randomInt(30, 160) * 10; // 300 to 16000, step 10
      const goalClamped = Math.max(300, Math.min(goal, 12000));
      const isFullyFunded = fullyFundedIndices.has(i);
      const raised = isFullyFunded
        ? goalClamped + randomInt(0, 500)
        : Math.floor(goalClamped * (0.1 + Math.random() * 0.85));
      const raisedClamped = Math.min(raised, goalClamped + 1000);
      const backers = Math.min(randomInt(3, 80), Math.max(1, Math.floor(raisedClamped / 2)));

      campaigns.push({
        title,
        description: `Support this cause. ${title}. Every contribution helps our community.`,
        fullDescription: `We are raising funds for: ${title}. Your donation will go directly to those in need. Thank you for your generosity and for supporting Belizean communities.`,
        creator: `${title.split(" ")[0]} ${pick(["Gonzalez", "Martinez", "Santos", "Chen", "Williams", "Belize Relief", "Community Fund"])}`,
        creatorType: pick(CREATOR_TYPES),
        goal: goalClamped,
        raised: raisedClamped,
        backers,
        daysLeft: randomInt(1, 45),
        category: pick([...CATEGORIES]),
        image: `https://picsum.photos/seed/${Date.now()}-${i}/800/600`,
        location: pick(LOCATIONS),
        createdAt: new Date(Date.now() - randomInt(1, 60) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        verified: true,
      });
    }

    console.log("Adding 50 campaigns and donors...\n");
    const baseDate = new Date("2026-01-15T12:00:00Z").getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let cIdx = 0; cIdx < campaigns.length; cIdx++) {
      const c = campaigns[cIdx];
      const campaignRef = db.collection("campaigns").doc();
      const campaignId = campaignRef.id;
      await campaignRef.set({
        ...c,
        status: "live",
        creatorId: null,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(c.createdAt)),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✓ [${cIdx + 1}/50] ${c.title} (goal BZ$${c.goal}, raised BZ$${c.raised}, ${c.backers} backers)`);

      const amounts = splitAmounts(c.raised, c.backers);
      for (let d = 0; d < c.backers; d++) {
        const isAnonymous = randomInt(0, 4) === 0;
        const donorIdx = d % DONOR_NAMES.length;
        const donationRef = db.collection("donations").doc();
        const createdAt = new Date(baseDate + (cIdx * 20 + d) * dayMs * 0.3);
        await donationRef.set({
          campaignId,
          campaignTitle: c.title,
          amount: amounts[d] ?? 10,
          donorEmail: isAnonymous ? `anon-${campaignId}-${d}@donor.bz` : DONOR_EMAILS[donorIdx],
          donorName: isAnonymous ? "Anonymous" : DONOR_NAMES[donorIdx],
          anonymous: isAnonymous,
          method: METHODS[d % METHODS.length],
          status: "completed",
          createdAt: admin.firestore.Timestamp.fromDate(createdAt),
        });
      }
    }

    console.log("\n✅ Done! 50 campaigns with fictitious donors added to Firestore.");
    process.exit(0);
  } catch (error: unknown) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedFiftyCampaigns();
