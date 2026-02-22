import { NextResponse } from "next/server";
import { adminGetSiteContent } from "@/lib/firebase/admin";
import { mergeWithDefaults, type SiteContent } from "@/lib/siteContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/site-content
 * Returns editable site copy (for home, footer, about). Uses defaults when nothing stored.
 */
export async function GET() {
  try {
    const raw = await adminGetSiteContent();
    const content = mergeWithDefaults(raw as Partial<SiteContent> | null);
    return NextResponse.json(content);
  } catch {
    return NextResponse.json(mergeWithDefaults(null), { status: 200 });
  }
}
