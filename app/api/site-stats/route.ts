import { NextResponse } from "next/server";
import { getCampaigns } from "@/lib/firebase/firestore";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/site-stats
 * Returns site-wide stats for the homepage: total raised, campaign count, total supporters (backers).
 */
export async function GET() {
  try {
    const campaigns = await getCampaigns({ forStats: true });
    const totalRaised = campaigns.reduce((sum, c) => sum + (Number(c.raised) || 0), 0);
    const campaignCount = campaigns.length;
    const totalSupporters = campaigns.reduce((sum, c) => sum + (Number(c.backers) || 0), 0);

    return NextResponse.json({
      totalRaised,
      totalRaisedFormatted: formatCurrency(totalRaised),
      campaignCount,
      totalSupporters,
    });
  } catch (error) {
    console.error("API site-stats:", error);
    return NextResponse.json(
      { error: "Failed to load site stats." },
      { status: 503 }
    );
  }
}
