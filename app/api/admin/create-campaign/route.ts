import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminCreateCampaign, isAdminConfigured, getConfigDiagnostic, type AdminCreateCampaignPayload } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAdminAuth(): admin.auth.Auth | null {
  const app = admin.apps[0];
  return app ? admin.auth(app as admin.app.App) : null;
}

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
        error: "Server is not configured for admin operations.",
        hint: hint ?? "Configure Firebase service account.",
      },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json(
      { error: "You must be signed in to create a campaign." },
      { status: 401 }
    );
  }

  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json(
      { error: "Server is not configured for admin operations." },
      { status: 503 }
    );
  }

  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return NextResponse.json(
      { error: "Your session may have expired. Sign out and sign in again." },
      { status: 401 }
    );
  }

  const adminEmails = getAdminEmails();
  const email = (decoded.email ?? "").toLowerCase();
  if (adminEmails.length > 0 && !adminEmails.includes(email)) {
    return NextResponse.json(
      { error: "Your account is not listed as an admin." },
      { status: 403 }
    );
  }
  if (adminEmails.length === 0 && email !== "admin@givahbz.com") {
    return NextResponse.json(
      { error: "No admin emails configured. Set ADMIN_EMAILS or sign in as the default admin." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const description = typeof b.description === "string" ? b.description.trim() : "";
  const fullDescription = typeof b.fullDescription === "string" ? b.fullDescription.trim() : undefined;
  const goal = typeof b.goal === "number" ? b.goal : Number(b.goal);
  const category = typeof b.category === "string" ? b.category.trim() : "Other";
  const image = typeof b.image === "string" ? b.image : "";
  const image2 = typeof b.image2 === "string" ? b.image2 : undefined;
  const location = typeof b.location === "string" ? b.location.trim() : undefined;
  const daysLeft = typeof b.daysLeft === "number" ? b.daysLeft : b.daysLeft != null ? Number(b.daysLeft) : undefined;
  const creatorType = b.creatorType === "individual" || b.creatorType === "organization" || b.creatorType === "charity" ? b.creatorType : undefined;
  const creatorName = typeof b.creatorName === "string" ? b.creatorName.trim() : (decoded.name as string) ?? "Admin";
  const creatorId = typeof b.creatorId === "string" ? b.creatorId : decoded.uid ?? null;

  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required." },
      { status: 400 }
    );
  }
  if (!image) {
    return NextResponse.json(
      { error: "At least one image URL is required." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(goal) || goal <= 0) {
    return NextResponse.json(
      { error: "Goal must be a positive number." },
      { status: 400 }
    );
  }

  const payload: AdminCreateCampaignPayload = {
    title,
    description,
    fullDescription,
    goal,
    category,
    location,
    daysLeft,
    creatorType,
    image,
    image2,
    creatorName,
    creatorId,
  };

  try {
    const campaignId = await adminCreateCampaign(payload);
    return NextResponse.json({ success: true, campaignId });
  } catch (err) {
    console.error("Admin create campaign error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create campaign." },
      { status: 500 }
    );
  }
}
