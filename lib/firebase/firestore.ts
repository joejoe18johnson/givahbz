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
export const campaignsUnderReviewCollection = "campaignsUnderReview";

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

// Campaigns under review (admin workflow)
export interface CampaignUnderReviewDoc {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  goal: number;
  category: string;
  creatorName: string;
  creatorId: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export async function addCampaignUnderReviewToFirestore(data: Omit<CampaignUnderReviewDoc, "id" | "submittedAt" | "status">): Promise<string> {
  const docRef = doc(collection(db, campaignsUnderReviewCollection));
  await setDoc(docRef, {
    ...data,
    submittedAt: new Date().toISOString(),
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getCampaignsUnderReviewFromFirestore(): Promise<CampaignUnderReviewDoc[]> {
  const q = query(
    collection(db, campaignsUnderReviewCollection),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title,
      description: data.description,
      fullDescription: data.fullDescription,
      goal: data.goal,
      category: data.category,
      creatorName: data.creatorName,
      creatorId: data.creatorId,
      submittedAt: data.submittedAt || (data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString()),
      status: data.status || "pending",
    } as CampaignUnderReviewDoc;
  });
}

export async function getCampaignsUnderReviewCount(): Promise<number> {
  const q = query(
    collection(db, campaignsUnderReviewCollection),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export async function getCampaignUnderReviewById(id: string): Promise<CampaignUnderReviewDoc | null> {
  const docRef = doc(db, campaignsUnderReviewCollection, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    title: data.title,
    description: data.description,
    fullDescription: data.fullDescription,
    goal: data.goal,
    category: data.category,
    creatorName: data.creatorName,
    creatorId: data.creatorId,
    submittedAt: data.submittedAt || (data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString()),
    status: data.status || "pending",
  } as CampaignUnderReviewDoc;
}

/** Approve a campaign: publish to live campaigns and notify the creator. */
export async function approveAndPublishCampaign(underReviewId: string): Promise<{ campaignId: string }> {
  const underReview = await getCampaignUnderReviewById(underReviewId);
  if (!underReview) throw new Error("Campaign under review not found");
  if (underReview.status !== "pending") throw new Error("Campaign is no longer pending");

  const campaignPayload: Omit<Campaign, "id"> = {
    title: underReview.title,
    description: underReview.description,
    fullDescription: underReview.fullDescription || underReview.description,
    creator: underReview.creatorName,
    creatorType: "individual",
    goal: underReview.goal,
    raised: 0,
    backers: 0,
    daysLeft: 30,
    category: underReview.category,
    image: "https://picsum.photos/seed/campaign/800/600",
    location: "",
    createdAt: new Date().toISOString().split("T")[0],
    verified: true,
  };
  const campaignId = await createCampaign(campaignPayload);

  if (underReview.creatorId) {
    await addNotification(underReview.creatorId, {
      type: "campaign_approved",
      title: "Campaign approved",
      body: `Your campaign "${underReview.title}" has been approved and is now live.`,
      campaignId,
      read: false,
    });
  }

  await updateDoc(doc(db, campaignsUnderReviewCollection, underReviewId), {
    status: "approved",
    publishedCampaignId: campaignId,
    updatedAt: serverTimestamp(),
  });
  return { campaignId };
}

export async function updateCampaignUnderReviewStatus(id: string, status: "approved" | "rejected"): Promise<void> {
  await updateDoc(doc(db, campaignsUnderReviewCollection, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCampaignUnderReview(id: string): Promise<void> {
  await deleteDoc(doc(db, campaignsUnderReviewCollection, id));
}

// User notifications
const notificationsCollection = "notifications";

export interface UserNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  campaignId?: string;
  read: boolean;
  createdAt: string;
}

export async function addNotification(
  userId: string,
  data: { type: string; title: string; body: string; campaignId?: string; read: boolean }
): Promise<string> {
  const docRef = doc(collection(db, notificationsCollection));
  await setDoc(docRef, {
    userId,
    type: data.type,
    title: data.title,
    body: data.body,
    campaignId: data.campaignId ?? null,
    read: data.read,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
  const q = query(
    collection(db, notificationsCollection),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      campaignId: data.campaignId,
      read: data.read ?? false,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    } as UserNotification;
  });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const q = query(
    collection(db, notificationsCollection),
    where("userId", "==", userId),
    where("read", "==", false)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, notificationsCollection, notificationId), { read: true });
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
