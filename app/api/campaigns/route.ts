import { NextRequest, NextResponse } from "next/server";
import { getCampaigns } from "@/lib/firebase/firestore";

/**
 * GET /api/campaigns
 * Fetches campaigns from Firestore on the server (uses Vercel runtime env vars).
 * Query params: trending=true | category=Medical | limitCount=6
 */
export async function GET(request: NextRequest) {
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
      { error: "Failed to load campaigns from Firestore." },
      { status: 503 }
    );
  }
}
