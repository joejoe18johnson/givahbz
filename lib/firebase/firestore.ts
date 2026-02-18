import {
  collection,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import { Campaign } from "@/lib/data";
import { AdminDonation } from "@/lib/adminData";

// Campaigns collection
export const campaignsCollection = "campaigns";
export const usersCollection = "users";
export const donationsCollection = "donations";

// Campaign operations
export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const docRef = doc(db, campaignsCollection, campaignId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  // Convert Firestore Timestamp to string date if needed
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : data.createdAt;
  
  return {
    ...data,
    id: docSnap.id,
    createdAt: createdAt || new Date().toISOString().split('T')[0],
  } as Campaign;
}

/** Normalize createdAt to YYYY-MM-DD string (handles Firestore Timestamp or string) */
function normalizeCreatedAt(data: Record<string, unknown>): string {
  const raw = data.createdAt;
  if (!raw) return new Date().toISOString().split("T")[0];
  if (typeof raw === "string") return raw.split("T")[0];
  if (raw && typeof raw === "object" && "toDate" in raw && typeof (raw as { toDate: () => Date }).toDate === "function") {
    return (raw as { toDate: () => Date }).toDate().toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

export async function getCampaigns(filters?: {
  category?: string;
  search?: string;
  trending?: boolean;
  limitCount?: number;
}): Promise<Campaign[]> {
  // Fetch all campaigns from server (bypass cache so we always get latest count)
  const q = query(collection(db, campaignsCollection));
  const querySnapshot = await getDocsFromServer(q);

  let campaigns = querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    const createdAt = normalizeCreatedAt(data);
    return {
      ...data,
      id: docSnap.id,
      createdAt,
    } as Campaign;
  });

  // Filter by category in memory (avoids composite index)
  if (filters?.category && filters.category !== "All") {
    campaigns = campaigns.filter((c) => c.category === filters.category);
  }

  // Sort in memory
  if (filters?.trending) {
    campaigns.sort((a, b) => (b.backers ?? 0) - (a.backers ?? 0));
  } else {
    campaigns.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }

  // Client-side search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    campaigns = campaigns.filter(
      (campaign) =>
        campaign.title.toLowerCase().includes(searchLower) ||
        campaign.description.toLowerCase().includes(searchLower)
    );
  }

  // Apply limit in memory if requested
  if (filters?.limitCount && filters.limitCount > 0) {
    campaigns = campaigns.slice(0, filters.limitCount);
  }

  return campaigns;
}

export async function createCampaign(campaign: Omit<Campaign, "id">): Promise<string> {
  const docRef = doc(collection(db, campaignsCollection));
  await setDoc(docRef, {
    ...campaign,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<void> {
  await updateDoc(doc(db, campaignsCollection, campaignId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  await deleteDoc(doc(db, campaignsCollection, campaignId));
}

// Donations operations
export async function getDonations(campaignId?: string): Promise<AdminDonation[]> {
  let q = query(collection(db, donationsCollection), orderBy("createdAt", "desc"));
  
  if (campaignId) {
    q = query(q, where("campaignId", "==", campaignId));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    // Convert Firestore Timestamp to string date if needed
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
    return {
      ...data,
      id: docSnap.id,
      createdAt: createdAt || new Date().toISOString(),
    };
  }) as AdminDonation[];
}

export async function createDonation(donation: Omit<AdminDonation, "id">): Promise<string> {
  const docRef = doc(collection(db, donationsCollection));
  await setDoc(docRef, {
    ...donation,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Hearted campaigns (user-specific)
export async function getHeartedCampaignIds(userId: string): Promise<string[]> {
  const userDoc = await getDoc(doc(db, usersCollection, userId));
  const userData = userDoc.data();
  return userData?.heartedCampaigns || [];
}

export async function toggleHeartCampaign(userId: string, campaignId: string): Promise<boolean> {
  const userDoc = await getDoc(doc(db, usersCollection, userId));
  const userData = userDoc.data();
  const heartedCampaigns: string[] = userData?.heartedCampaigns || [];
  
  const index = heartedCampaigns.indexOf(campaignId);
  let isHearted: boolean;
  
  if (index > -1) {
    heartedCampaigns.splice(index, 1);
    isHearted = false;
  } else {
    heartedCampaigns.push(campaignId);
    isHearted = true;
  }
  
  await updateDoc(doc(db, usersCollection, userId), {
    heartedCampaigns,
    updatedAt: serverTimestamp(),
  });
  
  return isHearted;
}
