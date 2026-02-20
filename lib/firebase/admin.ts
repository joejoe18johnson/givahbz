/**
 * Firebase Admin SDK for server-only operations (bypasses Firestore security rules).
 * Used for admin actions like approving donations and uploading verification docs.
 *
 * Configure using ONE of:
 * 1. FIREBASE_SERVICE_ACCOUNT_JSON = full JSON key as a string (in .env, one line).
 * 2. FIREBASE_SERVICE_ACCOUNT_PATH = path to the JSON file (e.g. ./firebase-service-account.json).
 * Get the key: Firebase Console → Project settings → Service accounts → Generate new private key.
 */

import * as admin from "firebase-admin";
import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const donationsCollection = "donations";
const campaignsCollection = "campaigns";

let cachedKey: Record<string, string> | null | undefined = undefined;

function loadServiceAccountKey(): Record<string, string> | null {
  if (cachedKey !== undefined) return cachedKey;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw && typeof raw === "string" && raw.trim() !== "") {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed.private_key && parsed.client_email) {
        cachedKey = parsed;
        return cachedKey;
      }
    } catch {
      // fall through
    }
  }
  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (pathEnv && typeof pathEnv === "string" && pathEnv.trim() !== "") {
    const trimmed = pathEnv.trim().replace(/^["']|["']$/g, "");
    const cwd = process.cwd();
    const pathsToTry = [
      resolve(cwd, trimmed),
      trimmed,
    ];
    for (const filePath of pathsToTry) {
      try {
        if (!existsSync(filePath)) continue;
        const content = readFileSync(filePath, "utf8");
        const parsed = JSON.parse(content) as Record<string, string>;
        if (parsed.private_key && parsed.client_email) {
          cachedKey = parsed;
          return cachedKey;
        }
      } catch {
        continue;
      }
    }
  }
  cachedKey = null;
  return null;
}

/** Returns a short hint when not configured (for API error response). */
export function getConfigDiagnostic(): string | null {
  if (loadServiceAccountKey() != null) return null;
  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const hasPath = pathEnv && typeof pathEnv === "string" && pathEnv.trim() !== "";
  const hasJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON && typeof process.env.FIREBASE_SERVICE_ACCOUNT_JSON === "string" && process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim() !== "";
  if (hasPath) {
    const trimmed = pathEnv!.trim().replace(/^["']|["']$/g, "");
    const resolved = resolve(process.cwd(), trimmed);
    const exists = existsSync(resolved) || existsSync(trimmed);
    if (!exists) return `File not found at ${resolved}. Check FIREBASE_SERVICE_ACCOUNT_PATH and restart.`;
    return "Key file found but missing private_key or client_email, or invalid JSON.";
  }
  if (hasJson) return "FIREBASE_SERVICE_ACCOUNT_JSON is set but invalid or incomplete.";
  return "Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env and restart the server.";
}

function getAdminApp(): admin.app.App | null {
  if (admin.apps.length > 0) {
    return admin.app() as admin.app.App;
  }
  const key = loadServiceAccountKey();
  if (!key || !key.private_key || !key.client_email) {
    return null;
  }
  try {
    const privateKey = (key.private_key as string).replace(/\\n/g, "\n");
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

/** Sanitize for Storage path (no path separators or problematic chars). */
function sanitizeFileName(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "").trim() || "document";
  return base.replace(/[/\\?#*[\]^\s]+/g, "_").slice(0, 180) || "document";
}

/**
 * Upload a verification document to Storage (server-side). Returns the download URL.
 * Call from API route only after verifying the request is from the same user (uid).
 */
export async function adminUploadVerificationDocument(
  userId: string,
  buffer: Buffer,
  documentType: string,
  originalFileName: string,
  mimeType: string
): Promise<string> {
  const app = getAdminApp();
  if (!app) {
    throw new Error("Server is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON.");
  }
  const storage = getStorage(app);
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined;
  const bucket = storage.bucket(bucketName);
  const ext = (originalFileName.split(".").pop() || "").toLowerCase() || (mimeType === "application/pdf" ? "pdf" : "jpg");
  const safeName = sanitizeFileName(originalFileName);
  const path = `verification-docs/${userId}/${documentType}/${Date.now()}_${safeName}.${ext}`;
  const file = bucket.file(path);
  await file.save(buffer, {
    contentType: mimeType || "application/octet-stream",
    metadata: { cacheControl: "private, max-age=31536000" },
  });
  const url = await getDownloadURL(file);
  return url;
}
