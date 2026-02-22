import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminUpdateCampaignText, isAdminConfigured } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAdminAuth(): admin.auth.Auth | null {
  const app = admin.apps[0];
  return app ? admin.auth(app as admin.app.App) : null;
}

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/** PATCH - update campaign text (title, description, fullDescription). Admin only. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    return NextResponse.json(
      { error: "Invalid or expired session. Sign in again." },
      { status: 401 }
    );
  }

  const adminEmails = getAdminEmails();
  const email = (decoded.email ?? "").toLowerCase();
  if (!adminEmails.includes(email)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id: campaignId } = await params;
  if (!campaignId || campaignId.length > 128) {
    return NextResponse.json({ error: "Invalid campaign ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const updates: { title?: string; description?: string; fullDescription?: string } = {};
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.title === "string") updates.title = o.title;
    if (typeof o.description === "string") updates.description = o.description;
    if (typeof o.fullDescription === "string") updates.fullDescription = o.fullDescription;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one of: title, description, fullDescription." },
      { status: 400 }
    );
  }

  try {
    await adminUpdateCampaignText(campaignId, updates);
    return NextResponse.json({ ok: true, message: "Campaign text updated." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update.";
    const status = message === "Campaign not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
