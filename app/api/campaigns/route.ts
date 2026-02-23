import { NextRequest, NextResponse } from "next/server";
import { getCampaigns } from "@/lib/firebase/firestore";
import { adminListCampaigns, isAdminConfigured } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CAMPAIGNS_TIMEOUT_MS = 15000;

/**
 * GET /api/campaigns
 * QUARANTINE: Returns only live campaigns from the "campaigns" collection.
 * Uses Admin SDK when configured (reliable on server); otherwise falls back to client SDK.
 * Query params: trending=true | category=... | limitCount=6 | onlyFullyFunded=true
 */
const REQUIRED_FIREBASE_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

function getMissingFirebaseVars(): string[] {
  return REQUIRED_FIREBASE_VARS.filter((key) => {
    const v = process.env[key];
    return v == null || String(v).trim() === "" || v === "your-api-key" || v === "your-project-id";
  });
}

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

export async function GET(request: NextRequest) {
  const missing = getMissingFirebaseVars();
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Firebase is not connected on Vercel.",
        message: "Add the 6 Firebase env vars in Vercel (Settings → Environment Variables), then Redeploy.",
        missing,
        fix: "https://vercel.com/docs/projects/environment-variables",
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const trending = searchParams.get("trending") === "true";
  const category = searchParams.get("category") ?? undefined;
  const limitParam = searchParams.get("limitCount");
  const limitCount = limitParam ? Math.min(100, parseInt(limitParam, 10) || 0) : undefined;
  const onlyFullyFunded = searchParams.get("onlyFullyFunded") === "true";

  const filters = {
    ...(trending && { trending: true }),
    ...(category && category !== "All" && { category }),
    ...(limitCount && limitCount > 0 && { limitCount }),
    ...(onlyFullyFunded && { onlyFullyFunded: true }),
  };

  try {
    const campaignsPromise = isAdminConfigured()
      ? adminListCampaigns(filters)
      : getCampaigns(filters);
    const campaigns = await withTimeout(
      campaignsPromise,
      CAMPAIGNS_TIMEOUT_MS,
      "Campaigns request timed out. Check Firebase project (e.g. givah-mvp) and that the service account key matches this project."
    );
    const response = NextResponse.json(campaigns);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("API campaigns:", error);
    const msg = error instanceof Error ? error.message : "Failed to load campaigns from Firestore.";
    return NextResponse.json(
      {
        error: msg,
        hint: "Ensure FIREBASE_SERVICE_ACCOUNT (for givah-mvp) is set so the API can read campaigns. Or add all 6 NEXT_PUBLIC_FIREBASE_* env vars.",
      },
      { status: 503 }
    );
  }
}
