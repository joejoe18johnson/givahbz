import { NextRequest, NextResponse } from "next/server";
import { adminApproveDonation, isAdminConfigured, getConfigDiagnostic, getAdminAuth, getAdminProjectId } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAdminEmails(): string[] {
  let raw = process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  if (!raw.trim()) {
    try {
      const path = require("path");
      const dotenv = require("dotenv");
      const cwd = process.cwd();
      dotenv.config({ path: path.join(cwd, ".env.local") });
      dotenv.config({ path: path.join(cwd, ".env") });
      raw = process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
    } catch {
      // ignore
    }
  }
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
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";
    const isExpired = code === "auth/id-token-expired";
    const serverProjectId = getAdminProjectId()?.trim() ?? "";
    const clientProjectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "").trim();
    const projectMismatch =
      serverProjectId &&
      clientProjectId &&
      serverProjectId !== clientProjectId;

    const payload: { error: string; hint: string; serverProjectId?: string; clientProjectId?: string } = {
      error: "",
      hint: "",
    };
    if (isExpired) {
      payload.error = "Your session may have expired. Sign out and sign in again, then try approving.";
      payload.hint = "Your token expired. Sign out and sign in again, then try approving.";
    } else if (projectMismatch) {
      payload.error = "Firebase project mismatch: the server and your app are using different projects.";
      payload.hint = `Server is using project "${serverProjectId}" but your app is configured for "${clientProjectId}". Download the service account key for "${clientProjectId}" (Firebase Console → Project settings → Service accounts → Generate new private key) and set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 to that key. Keep NEXT_PUBLIC_FIREBASE_* as they are.`;
    } else {
      payload.error = "Sign-in could not be verified. Sign out and sign in again, then try approving.";
      payload.hint =
        code === "auth/id-token-expired"
          ? "Your token expired. Sign out and sign in again, then try approving."
          : code === "auth/argument-error" || code === "auth/invalid-id-token"
            ? "The sign-in token was invalid. Ensure your app uses the same Firebase project as the server (service account must be from the same project as NEXT_PUBLIC_FIREBASE_PROJECT_ID)."
            : "Sign out and sign in again, then try approving.";
    }
    if (serverProjectId) payload.serverProjectId = serverProjectId;
    if (clientProjectId) payload.clientProjectId = clientProjectId;
    return NextResponse.json(payload, { status: 401 });
  }

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    const isVercel = !!process.env.VERCEL;
    const hint = isVercel
      ? "On Vercel: add ADMIN_EMAILS in Project Settings → Environment Variables (comma-separated admin emails), then redeploy."
      : "Add ADMIN_EMAILS=your@email.com to the .env file in the project root, then restart the dev server (stop and run npm run dev again).";
    return NextResponse.json(
      {
        error: "No admin emails configured.",
        hint,
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
