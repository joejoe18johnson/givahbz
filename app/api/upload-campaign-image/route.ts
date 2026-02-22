import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminUploadCampaignUnderReviewImage, isAdminConfigured, getConfigDiagnostic } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "gif", "webp", "heic"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB per image - keeps server upload to Storage within retry limits

function getAdminAuth(): admin.auth.Auth | null {
  const app = admin.apps[0];
  return app ? admin.auth(app as admin.app.App) : null;
}

function isAllowedImage(file: File): boolean {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return (
    (file.type && ALLOWED_TYPES.includes(file.type)) ||
    ALLOWED_EXT.includes(ext)
  );
}

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    const hint = getConfigDiagnostic();
    return NextResponse.json(
      {
        error: "Server is not configured for uploads.",
        hint: hint ?? "Set FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json in .env (with the key file in project root) or FIREBASE_SERVICE_ACCOUNT_JSON with the full JSON, then restart.",
      },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json(
      { error: "You must be signed in to upload campaign images." },
      { status: 401 }
    );
  }

  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json(
      { error: "Server upload is not available." },
      { status: 503 }
    );
  }

  try {
    await auth.verifyIdToken(token);
  } catch {
    return NextResponse.json(
      { error: "Your session may have expired. Sign out and sign in again." },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const pendingId = (formData.get("pendingId") as string)?.trim() || "";
  const indexRaw = formData.get("index");
  const indexStr = indexRaw != null ? String(indexRaw) : "";

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json(
      { error: "No file provided." },
      { status: 400 }
    );
  }
  if (!pendingId || pendingId.length > 128) {
    return NextResponse.json(
      { error: "Valid pendingId is required." },
      { status: 400 }
    );
  }
  const index = indexStr === "0" ? 0 : indexStr === "1" ? 1 : null;
  if (index !== 0 && index !== 1) {
    return NextResponse.json(
      { error: "index must be 0 or 1." },
      { status: 400 }
    );
  }
  if (!isAllowedImage(file)) {
    return NextResponse.json(
      { error: "File must be an image (JPG, PNG, GIF, WebP, HEIC)." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image must be under 2MB. Use smaller or more compressed images." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await adminUploadCampaignUnderReviewImage(
      pendingId,
      index as 0 | 1,
      buffer,
      file.name,
      file.type || "image/jpeg"
    );
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    const isRetryExceeded = typeof message === "string" && (message.includes("retry-limit-exceeded") || message.includes("Max retry time"));
    const error = isRetryExceeded
      ? "Upload timed out. Try images under 2MB each (crop or compress before uploading)."
      : message;
    return NextResponse.json(
      { error },
      { status: 500 }
    );
  }
}
