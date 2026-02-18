import { Campaign } from "@/lib/data";
import { getCampaigns, getCampaign } from "@/lib/firebase/firestore";
import { campaigns as mockCampaigns } from "@/lib/data";

// Use Firestore if available, otherwise fallback to mock data
let useFirestore = false;

// Check if Firebase is configured
try {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (apiKey && apiKey !== "your-api-key") {
    useFirestore = true;
  }
} catch (e) {
  // Firebase not configured, use mock data
}

export async function fetchCampaigns(filters?: {
  category?: string;
  search?: string;
  trending?: boolean;
  limitCount?: number;
}): Promise<Campaign[]> {
  if (useFirestore) {
    try {
      return await getCampaigns(filters);
    } catch (error) {
      console.error("Error fetching campaigns from Firestore:", error);
      // Fallback to mock data
      return filterMockCampaigns(mockCampaigns, filters);
    }
  }
  return filterMockCampaigns(mockCampaigns, filters);
}

export async function fetchCampaign(campaignId: string): Promise<Campaign | null> {
  if (useFirestore) {
    try {
      return await getCampaign(campaignId);
    } catch (error) {
      console.error("Error fetching campaign from Firestore:", error);
      // Fallback to mock data
      return mockCampaigns.find((c) => c.id === campaignId) || null;
    }
  }
  return mockCampaigns.find((c) => c.id === campaignId) || null;
}

function filterMockCampaigns(
  campaigns: Campaign[],
  filters?: {
    category?: string;
    search?: string;
    trending?: boolean;
    limitCount?: number;
  }
): Campaign[] {
  let filtered = [...campaigns];

  if (filters?.category && filters.category !== "All") {
    filtered = filtered.filter((c) => c.category === filters.category);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.trending) {
    filtered.sort((a, b) => b.backers - a.backers);
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (filters?.limitCount) {
    filtered = filtered.slice(0, filters.limitCount);
  }

  return filtered;
}
