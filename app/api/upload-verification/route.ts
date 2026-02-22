import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminUploadVerificationDocument, isAdminConfigured, getConfigDiagnostic } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "application/pdf",
];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "gif", "webp", "heic", "pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getAdminAuth(): admin.auth.Auth | null {
  const app = admin.apps[0];
  return app ? admin.auth(app as admin.app.App) : null;
}

function isAllowedFile(file: File): boolean {
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
      { error: "You must be signed in to upload." },
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

  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(token);
    uid = decoded.uid;
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
  const documentType = (formData.get("documentType") as string)?.trim() || "";

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json(
      { error: "No file provided." },
      { status: 400 }
    );
  }
  if (!documentType) {
    return NextResponse.json(
      { error: "documentType is required (e.g. social_security, passport, address)." },
      { status: 400 }
    );
  }
  if (!["social_security", "passport", "address"].includes(documentType)) {
    return NextResponse.json(
      { error: "documentType must be social_security, passport, or address." },
      { status: 400 }
    );
  }
  if (!isAllowedFile(file)) {
    return NextResponse.json(
      { error: "File must be an image (JPG, PNG, HEIC, etc.) or PDF." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File size must be less than 10MB." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await adminUploadVerificationDocument(
      uid,
      buffer,
      documentType,
      file.name,
      file.type || "application/octet-stream"
    );
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
