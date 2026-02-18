import { NextRequest, NextResponse } from "next/server";
import { getCampaigns } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/campaigns
 * Fetches campaigns from Firestore on the server (uses Vercel runtime env vars).
 * Query params: trending=true | category=Medical | limitCount=6
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

  try {
    const campaigns = await getCampaigns({
      ...(trending && { trending: true }),
      ...(category && category !== "All" && { category }),
      ...(limitCount && limitCount > 0 && { limitCount }),
    });

    const response = NextResponse.json(campaigns);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("API campaigns:", error);
    return NextResponse.json(
      {
        error: "Failed to load campaigns from Firestore.",
        hint: "On Vercel: add all 6 NEXT_PUBLIC_FIREBASE_* env vars (Settings → Environment Variables), then Redeploy. Check /api/firebase-check to see which vars are missing.",
      },
      { status: 503 }
    );
  }
}
