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
  const raw = (typeof process.env.FIREBASE_SERVICE_ACCOUNT_JSON === "string" ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON : "").trim();
  if (raw.length > 0) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const privateKey = typeof parsed.private_key === "string" ? parsed.private_key : "";
      const clientEmail = typeof parsed.client_email === "string" ? parsed.client_email : "";
      if (privateKey && clientEmail) {
        cachedKey = { ...parsed, private_key: privateKey, client_email: clientEmail } as Record<string, string>;
        return cachedKey;
      }
    } catch {
      // fall through
    }
  }
  // On Vercel (and similar serverless) there is no project filesystem; the key file is never deployed. Use FIREBASE_SERVICE_ACCOUNT_JSON only.
  if (process.env.VERCEL) {
    cachedKey = null;
    return null;
  }
  const cwd = process.cwd();
  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const pathCandidates: string[] = [];
  if (pathEnv && typeof pathEnv === "string" && pathEnv.trim() !== "") {
    const trimmed = pathEnv.trim().replace(/^["']|["']$/g, "").replace(/\r/g, "");
    if (trimmed) {
      pathCandidates.push(resolve(cwd, trimmed), trimmed);
    }
  }
  // Fallback: default filename in project root (in case env wasn't loaded)
  pathCandidates.push(resolve(cwd, "firebase-service-account.json"));
  for (const filePath of pathCandidates) {
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
  cachedKey = null;
  return null;
}

/** Returns a short hint when not configured (for API error response). */
export function getConfigDiagnostic(): string | null {
  if (loadServiceAccountKey() != null) return null;
  if (process.env.VERCEL) {
    const hasJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON && typeof process.env.FIREBASE_SERVICE_ACCOUNT_JSON === "string" && process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim() !== "";
    return hasJson
      ? "FIREBASE_SERVICE_ACCOUNT_JSON is set but invalid or incomplete. Paste the full service account JSON (one line) in Vercel → Settings → Environment Variables, then Redeploy."
      : "On Vercel you must set FIREBASE_SERVICE_ACCOUNT_JSON: paste the full service account JSON as one line in Project Settings → Environment Variables, then Redeploy. The key file is not deployed.";
  }
  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const hasPath = pathEnv && typeof pathEnv === "string" && pathEnv.trim() !== "";
  const hasJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON && typeof process.env.FIREBASE_SERVICE_ACCOUNT_JSON === "string" && process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim() !== "";
  const cwd = process.cwd();
  const defaultPath = resolve(cwd, "firebase-service-account.json");
  const defaultExists = existsSync(defaultPath);
  if (hasPath) {
    const trimmed = pathEnv!.trim().replace(/^["']|["']$/g, "").replace(/\r/g, "");
    const resolved = resolve(cwd, trimmed);
    const exists = existsSync(resolved) || existsSync(trimmed);
    if (!exists) return `File not found at ${resolved}. Add the key file or set FIREBASE_SERVICE_ACCOUNT_JSON in .env.`;
    return "Key file found but missing private_key or client_email, or invalid JSON.";
  }
  if (hasJson) return "FIREBASE_SERVICE_ACCOUNT_JSON is set but invalid or incomplete.";
  if (defaultExists) return "Key file exists at project root but was not loaded. Restart the server from the project root (e.g. cd /path/to/CrowdFund && npm run dev).";
  return "Local: add FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json to .env and put the key file in the project root, then restart.";
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

/**
 * Get the Storage bucket name for Admin SDK.
 * Uses NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as-is (e.g. projectId.firebasestorage.app).
 * If that's not set, falls back to projectId.appspot.com.
 */
function getStorageBucketNameForAdmin(app: admin.app.App): string {
  const envBucket = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "").trim();
  const projectId = app.options.projectId || (loadServiceAccountKey()?.project_id as string | undefined);
  if (envBucket) return envBucket;
  if (projectId) return `${projectId}.appspot.com`;
  return "";
}

/** Return the other common bucket name for this project (for 404 fallback). */
function getAlternateBucketName(app: admin.app.App, currentBucket: string): string | null {
  const projectId = app.options.projectId || (loadServiceAccountKey()?.project_id as string | undefined);
  if (!projectId) return null;
  if (currentBucket.endsWith(".firebasestorage.app")) return `${projectId}.appspot.com`;
  if (currentBucket.endsWith(".appspot.com")) return `${projectId}.firebasestorage.app`;
  return null;
}

function isBucketNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("bucket does not exist") || msg.includes("The specified bucket does not exist")) return true;
  const code = err && typeof err === "object" && "code" in err ? (err as { code: number }).code : undefined;
  const nestedCode = err && typeof err === "object" && "error" in err && typeof (err as { error: unknown }).error === "object" && (err as { error: { code?: number } }).error?.code;
  return code === 404 || nestedCode === 404;
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
  const bucketName = getStorageBucketNameForAdmin(app);
  if (!bucketName) {
    throw new Error("Storage bucket not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.");
  }
  const ext = (originalFileName.split(".").pop() || "").toLowerCase() || (mimeType === "application/pdf" ? "pdf" : "jpg");
  const safeName = sanitizeFileName(originalFileName);
  const path = `verification-docs/${userId}/${documentType}/${Date.now()}_${safeName}.${ext}`;
  let lastErr: unknown;
  for (const name of [bucketName, getAlternateBucketName(app, bucketName)].filter(Boolean) as string[]) {
    try {
      const bucket = storage.bucket(name);
      const file = bucket.file(path);
      await file.save(buffer, {
        contentType: mimeType || "application/octet-stream",
        metadata: { cacheControl: "private, max-age=31536000" },
      });
      return await getDownloadURL(file);
    } catch (err) {
      lastErr = err;
      if (!isBucketNotFoundError(err)) throw err;
    }
  }
  throw lastErr;
}

/**
 * Upload a campaign-under-review cover image (server-side). Returns the download URL.
 * Call from API route after verifying the request is from an authenticated user.
 */
export async function adminUploadCampaignUnderReviewImage(
  pendingId: string,
  index: 0 | 1,
  buffer: Buffer,
  originalFileName: string,
  mimeType: string
): Promise<string> {
  const app = getAdminApp();
  if (!app) {
    throw new Error("Server is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON.");
  }
  const storage = getStorage(app);
  const bucketName = getStorageBucketNameForAdmin(app);
  if (!bucketName) {
    throw new Error("Storage bucket not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.");
  }
  const ext = (originalFileName.split(".").pop() || "").toLowerCase() || "jpg";
  const path = `campaigns-under-review/${pendingId}/image${index + 1}.${ext}`;
  let lastErr: unknown;
  for (const name of [bucketName, getAlternateBucketName(app, bucketName)].filter(Boolean) as string[]) {
    try {
      const bucket = storage.bucket(name);
      const file = bucket.file(path);
      await file.save(buffer, {
        contentType: mimeType || "image/jpeg",
        metadata: { cacheControl: "private, max-age=31536000" },
      });
      return await getDownloadURL(file);
    } catch (err) {
      lastErr = err;
      if (!isBucketNotFoundError(err)) throw err;
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// Site content (admin-editable copy)
// ---------------------------------------------------------------------------
const siteConfigCollection = "siteConfig";
const siteContentDocId = "content";

export async function adminGetSiteContent(): Promise<Record<string, string> | null> {
  const app = getAdminApp();
  if (!app) return null;
  const firestore = admin.firestore();
  const ref = firestore.collection(siteConfigCollection).doc(siteContentDocId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown> | undefined;
  if (!data) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

export async function adminSetSiteContent(data: Record<string, string>): Promise<void> {
  const app = getAdminApp();
  if (!app) throw new Error("Server is not configured for admin operations.");
  const firestore = admin.firestore();
  const ref = firestore.collection(siteConfigCollection).doc(siteContentDocId);
  await ref.set(data, { merge: true });
}
