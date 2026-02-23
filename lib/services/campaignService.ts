import { Campaign } from "@/lib/data";
import { getCampaigns, getCampaign } from "@/lib/firebase/firestore";

/** Build query string for /api/campaigns */
function campaignsApiQuery(filters?: {
  category?: string;
  trending?: boolean;
  limitCount?: number;
  onlyFullyFunded?: boolean;
}): string {
  const params = new URLSearchParams();
  if (filters?.trending) params.set("trending", "true");
  if (filters?.category && filters.category !== "All") params.set("category", filters.category);
  if (filters?.limitCount && filters.limitCount > 0) params.set("limitCount", String(filters.limitCount));
  if (filters?.onlyFullyFunded) params.set("onlyFullyFunded", "true");
  const q = params.toString();
  return q ? `?${q}` : "";
}

/**
 * Fetch campaigns from the server API (Firestore on Vercel uses runtime env vars).
 * Use this for the campaigns list and home so data is never static/cached.
 * By default returns only campaigns still needing support; use onlyFullyFunded: true for Success Stories.
 */
export async function fetchCampaignsFromAPI(filters?: {
  category?: string;
  trending?: boolean;
  limitCount?: number;
  onlyFullyFunded?: boolean;
}): Promise<Campaign[]> {
  const url = `/api/campaigns${campaignsApiQuery(filters)}`;
  const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string; hint?: string; missing?: string[] };
    const msg = err?.error ?? "Failed to load campaigns";
    const hint = err?.hint;
    throw new Error(hint ? `${msg} ${hint}` : msg);
  }
  return res.json();
}

// Always fetch from Firestore - no fallback to mock data
export async function fetchCampaigns(filters?: {
  category?: string;
  search?: string;
  trending?: boolean;
  limitCount?: number;
}): Promise<Campaign[]> {
  try {
    return await getCampaigns(filters);
  } catch (error) {
    console.error("Error fetching campaigns from Firestore:", error);
    throw error; // Re-throw error instead of falling back to mock data
  }
}

export async function fetchCampaign(campaignId: string): Promise<Campaign | null> {
  try {
    return await getCampaign(campaignId);
  } catch (error) {
    console.error("Error fetching campaign from Firestore:", error);
    throw error; // Re-throw error instead of falling back to mock data
  }
}
