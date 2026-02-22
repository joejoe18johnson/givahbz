import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminSetSiteContent, isAdminConfigured } from "@/lib/firebase/admin";
import { type SiteContent } from "@/lib/siteContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_CONTENT_KEYS: (keyof SiteContent)[] = [
  "siteName",
  "heroTitle",
  "heroSubtitle",
  "communityHeadingPart1",
  "communityHeadingPart2",
  "footerTagline",
  "footerCopyright",
  "aboutTitle",
  "aboutSubtitle",
  "aboutMission",
];

function getAdminAuth(): admin.auth.Auth | null {
  const app = admin.apps[0];
  return app ? admin.auth(app as admin.app.App) : null;
}

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/** POST - update site content (admin only) */
export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Server is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json({ error: "Auth not available." }, { status: 503 });
  }

  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid or expired session. Sign in again." }, { status: 401 });
  }

  const adminEmails = getAdminEmails();
  const email = (decoded.email || "").toLowerCase();
  if (!adminEmails.includes(email)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (body && typeof body === "object") {
    for (const key of SITE_CONTENT_KEYS) {
      const v = (body as Record<string, unknown>)[key];
      if (typeof v === "string") data[key] = v;
    }
  }

  try {
    await adminSetSiteContent(data);
    return NextResponse.json({ ok: true, message: "Site content saved." });
  } catch (err) {
    console.error("Error saving site content:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save." },
      { status: 500 }
    );
  }
}
