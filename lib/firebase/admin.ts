/**
 * Firebase Admin SDK for server-only operations (bypasses Firestore security rules).
 * Used for admin actions like approving donations when client rules block update.
 *
 * Set FIREBASE_SERVICE_ACCOUNT_JSON in env to the full JSON key (from Firebase Console
 * > Project Settings > Service accounts > Generate new private key). In .env the
 * private_key newlines are often stored as \n - we replace \\n with real newlines.
 */

import * as admin from "firebase-admin";

const donationsCollection = "donations";
const campaignsCollection = "campaigns";

function getAdminApp(): admin.app.App | null {
  if (admin.apps.length > 0) {
    return admin.app() as admin.app.App;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw || typeof raw !== "string" || raw.trim() === "") {
    return null;
  }
  try {
    const key = JSON.parse(raw) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    if (!key.private_key || !key.client_email) return null;
    const privateKey = key.private_key.replace(/\\n/g, "\n");
    const credential = admin.credential.cert({
      projectId: key.project_id,
      clientEmail: key.client_email,
      privateKey,
    });
    return admin.initializeApp({
      credential,
      projectId: key.project_id,
    });
  } catch {
    return null;
  }
}

/**
 * Approve a pending donation (server-side, bypasses rules). Call from API route only
 * after verifying the request is from an admin.
 */
export async function adminApproveDonation(donationId: string): Promise<void> {
  const app = getAdminApp();
  if (!app) {
    throw new Error("Server is not configured for admin operations. Set FIREBASE_SERVICE_ACCOUNT_JSON.");
  }
  const firestore = admin.firestore();
  const donationRef = firestore.collection(donationsCollection).doc(donationId);
  const donationSnap = await donationRef.get();
  if (!donationSnap.exists) {
    throw new Error("Donation not found");
  }
  const data = donationSnap.data()!;
  const status = data.status as string;
  if (status === "completed") {
    throw new Error("Donation is already completed");
  }
  const campaignId = data.campaignId as string;
  const amount = Number(data.amount);
  if (!campaignId || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid donation data");
  }
  await donationRef.update({
    status: "completed",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const campaignRef = firestore.collection(campaignsCollection).doc(campaignId);
  await campaignRef.update({
    raised: admin.firestore.FieldValue.increment(amount),
    backers: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export function isAdminConfigured(): boolean {
  return getAdminApp() != null;
}
