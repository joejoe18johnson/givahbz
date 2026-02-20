import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminApproveDonation, isAdminConfigured, getConfigDiagnostic } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAdminAuth(): admin.auth.Auth | null {
  const app = admin.apps[0];
  return app ? admin.auth(app as admin.app.App) : null;
}

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    const hint = getConfigDiagnostic();
    return NextResponse.json(
      {
        error: "Server is not configured to approve donations.",
        hint: hint || "Add FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH to .env. Get the key: Firebase Console → Project settings → Service accounts → Generate new private key.",
      },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json(
      { error: "You must be signed in to approve donations." },
      { status: 401 }
    );
  }

  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json(
      {
        error: "Server is not configured to approve donations.",
        hint: "FIREBASE_SERVICE_ACCOUNT_JSON may be invalid. Check .env and restart the server.",
      },
      { status: 503 }
    );
  }

  let email: string;
  try {
    const decoded = await auth.verifyIdToken(token);
    email = (decoded.email ?? "").toLowerCase();
  } catch {
    return NextResponse.json(
      { error: "Your session may have expired. Sign out and sign in again, then try approving." },
      { status: 401 }
    );
  }

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    return NextResponse.json(
      {
        error: "No admin emails configured.",
        hint: "Set ADMIN_EMAILS (or NEXT_PUBLIC_ADMIN_EMAILS) to a comma-separated list of admin emails. Local: add to .env and restart. Vercel: add in Project Settings → Environment Variables, then redeploy.",
      },
      { status: 503 }
    );
  }
  if (!adminEmails.includes(email)) {
    return NextResponse.json(
      {
        error: "Your account is not listed as an admin.",
        hint: `You're signed in as "${email}". Add this exact email to ADMIN_EMAILS in .env, then restart the server and try again.`,
      },
      { status: 403 }
    );
  }

  let body: { donationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const donationId = typeof body.donationId === "string" ? body.donationId.trim() : "";
  if (!donationId) {
    return NextResponse.json(
      { error: "donationId is required." },
      { status: 400 }
    );
  }

  try {
    await adminApproveDonation(donationId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to approve donation.";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
