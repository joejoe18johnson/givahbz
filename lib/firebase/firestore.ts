import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
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
  
  return {
    ...docSnap.data(),
    id: docSnap.id,
  } as Campaign;
}

export async function getCampaigns(filters?: {
  category?: string;
  search?: string;
  trending?: boolean;
  limitCount?: number;
}): Promise<Campaign[]> {
  let q = query(collection(db, campaignsCollection));
  
  if (filters?.category) {
    q = query(q, where("category", "==", filters.category));
  }
  
  if (filters?.trending) {
    // For trending, you might want to order by a trending score or backers
    q = query(q, orderBy("backers", "desc"));
  } else {
    q = query(q, orderBy("createdAt", "desc"));
  }
  
  if (filters?.limitCount) {
    q = query(q, limit(filters.limitCount));
  }
  
  const querySnapshot = await getDocs(q);
  let campaigns = querySnapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as Campaign[];
  
  // Client-side search filter if needed
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    campaigns = campaigns.filter(
      (campaign) =>
        campaign.title.toLowerCase().includes(searchLower) ||
        campaign.description.toLowerCase().includes(searchLower)
    );
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
  return querySnapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as AdminDonation[];
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
