import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { isAdminConfigured } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAdminAuth(): admin.auth.Auth | null {
  const app = getAdminApp();
  return app ? admin.auth(app as admin.app.App) : null;
}

function getAdminApp(): admin.app.App | null {
  if (admin.apps.length > 0) {
    return admin.app() as admin.app.App;
  }
  return null;
}

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * GET /api/check-admin
 * Client sends Firebase ID token in Authorization: Bearer <token>.
 * Returns { isAdmin: boolean } using server-side ADMIN_EMAILS so admin status
 * works even when NEXT_PUBLIC_ADMIN_EMAILS is missing from the client bundle.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  let email: string;
  try {
    const decoded = await auth.verifyIdToken(token);
    email = (decoded.email ?? "").toLowerCase();
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.length > 0 && adminEmails.includes(email);
  return NextResponse.json({ isAdmin }, { status: 200 });
}
