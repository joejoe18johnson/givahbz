import { Campaign } from "@/lib/data";
import { getCampaigns, getCampaign } from "@/lib/firebase/firestore";

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
