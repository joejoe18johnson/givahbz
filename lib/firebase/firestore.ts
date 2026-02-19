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

/**
 * Public campaigns list. Only reads from the "campaigns" collection.
 * Campaigns under review are stored in campaignsUnderReview and are never included here—
 * they only appear on the site after admin approval (approveAndPublishCampaign).
 */
export async function getCampaigns(filters?: {
  category?: string;
  search?: string;
  trending?: boolean;
  limitCount?: number;
}): Promise<Campaign[]> {
  const q = query(collection(db, campaignsCollection));
  const querySnapshot = await getDocsFromServer(q);

  let campaigns = querySnapshot.docs
    .filter((docSnap) => (docSnap.data() as Record<string, unknown>).status !== "pending")
    .map((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const createdAt = normalizeCreatedAt(data);
      return { ...data, id: docSnap.id, createdAt } as Campaign;
    });
  // ^ Exclude any doc with status "pending" so under-review items never appear on the public list

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

/** Permanently delete a campaign. Removes it from the campaigns collection so it no longer appears on the main site (home, campaigns list, or campaign detail page). */
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

/**
 * Submit a campaign for review. Stored only in campaignsUnderReview—not in the public
 * campaigns collection. The campaign will not appear on the site until an admin
 * approves it (approveAndPublishCampaign) or it is rejected/withdrawn.
 */
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
  return snapshot.docs.map((d) => mapDocToCampaignUnderReview(d));
}

/** Pending campaigns under review for a specific creator (for My Campaigns page). */
export async function getCampaignsUnderReviewForUser(creatorId: string): Promise<CampaignUnderReviewDoc[]> {
  if (!creatorId) return [];
  const q = query(
    collection(db, campaignsUnderReviewCollection),
    where("creatorId", "==", creatorId),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDocToCampaignUnderReview(d));
}

function mapDocToCampaignUnderReview(d: { id: string; data: () => Record<string, unknown> }): CampaignUnderReviewDoc {
  const data = d.data();
  return {
    id: d.id,
    title: data.title as string,
    description: data.description as string,
    fullDescription: data.fullDescription as string | undefined,
    goal: data.goal as number,
    category: data.category as string,
    creatorName: data.creatorName as string,
    creatorId: data.creatorId as string,
    submittedAt: (data.submittedAt as string) || (data.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    status: (data.status as CampaignUnderReviewDoc["status"]) || "pending",
  };
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
  const docRef = doc(collection(db, campaignsCollection));
  await setDoc(docRef, {
    ...campaignPayload,
    creatorId: underReview.creatorId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const campaignId = docRef.id;

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

// Admin: list all users (for Admin Users page; requires Firestore rules to allow admin read on users)
export interface AdminUserDoc {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  phoneNumber?: string;
  phoneVerified: boolean;
  verified: boolean;
  idVerified: boolean;
  addressVerified: boolean;
  createdAt?: string;
}

export async function getUsersFromFirestore(): Promise<AdminUserDoc[]> {
  const snapshot = await getDocs(collection(db, usersCollection));
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      email: data.email ?? "",
      name: data.name ?? "",
      role: data.role ?? "user",
      phoneNumber: data.phoneNumber,
      phoneVerified: data.phoneVerified ?? false,
      verified: data.verified ?? false,
      idVerified: data.idVerified ?? false,
      addressVerified: data.addressVerified ?? false,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.(),
    } as AdminUserDoc;
  });
}

export async function setUserPhoneVerified(userId: string, verified: boolean): Promise<void> {
  await updateDoc(doc(db, usersCollection, userId), {
    phoneVerified: verified,
    updatedAt: serverTimestamp(),
  });
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
