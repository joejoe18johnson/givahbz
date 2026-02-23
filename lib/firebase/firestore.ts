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
  increment,
} from "firebase/firestore";
import { db } from "./config";
import { Campaign } from "@/lib/data";
import { AdminDonation } from "@/lib/adminData";

// ---------------------------------------------------------------------------
// QUARANTINE: Campaigns under review are never posted publicly.
// - campaignsUnderReview = quarantined submissions (only Admin + creator see them).
// - campaigns = live, public list (home, /campaigns, API). Only written to on admin approval.
// - Create flow writes ONLY to campaignsUnderReview. Public reads ONLY from campaigns.
// ---------------------------------------------------------------------------
export const campaignsCollection = "campaigns";
export const usersCollection = "users";
export const donationsCollection = "donations";
/** Quarantine collection: submissions stay here until approved. Never used for public lists or getCampaign(s). */
export const campaignsUnderReviewCollection = "campaignsUnderReview";

// Campaign operations (all use "campaigns" only—under-review is never read here)
export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const docRef = doc(db, campaignsCollection, campaignId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  const data = docSnap.data() as Record<string, unknown>;
  if (data.status === "on_hold") return null;
  const createdAt = normalizeCreatedAt(data);
  return {
    ...data,
    id: docSnap.id,
    createdAt,
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
 * Public "all campaigns" list. QUARANTINE: Reads ONLY from "campaigns" (live).
 * User-created campaigns go to campaignsUnderReview and are NEVER in this list
 * until an admin approves (approveAndPublishCampaign). Under-review items are
 * never included here.
 */
export async function getCampaigns(filters?: {
  category?: string;
  search?: string;
  trending?: boolean;
  limitCount?: number;
  /** When true, return only fully funded campaigns (for Success Stories). When false/undefined, exclude them (main list shows only campaigns needing support). */
  onlyFullyFunded?: boolean;
  /** When true, return all live campaigns (no funding filter). Used for site-wide stats (total raised, campaign count, supporters). */
  forStats?: boolean;
}): Promise<Campaign[]> {
  const q = query(collection(db, campaignsCollection));
  const querySnapshot = await getDocsFromServer(q);

  let campaigns = querySnapshot.docs
    .filter((docSnap) => {
      const status = (docSnap.data() as Record<string, unknown>).status as string | undefined;
      return status !== "pending" && status !== "on_hold";
    })
    .map((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const createdAt = normalizeCreatedAt(data);
      const creator = (data.creator as string) ?? (data.creatorName as string) ?? "";
      return { ...data, id: docSnap.id, createdAt, creator } as Campaign;
    });
  // ^ Exclude pending (under-review) and on_hold so only live campaigns appear on the public list

  const goal = (c: Campaign) => Number(c.goal) || 1;
  const raised = (c: Campaign) => Number(c.raised) || 0;
  if (!filters?.forStats) {
    // Fully funded: show only in Success Stories; main list shows only campaigns still needing support
    if (filters?.onlyFullyFunded === true) {
      campaigns = campaigns.filter((c) => goal(c) > 0 && raised(c) >= goal(c));
    } else {
      campaigns = campaigns.filter((c) => goal(c) <= 0 || raised(c) < goal(c));
    }
  }

  // Trending = campaigns 60% or more completed (still needing support; fully funded are in Success Stories only)
  if (filters?.trending) {
    campaigns = campaigns.filter((c) => goal(c) > 0 && raised(c) / goal(c) >= 0.6);
  }

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

/**
 * Writes directly to public campaigns. Do NOT use for user submissions.
 * User-created campaigns must go via addCampaignUnderReviewToFirestore only;
 * they appear in "all campaigns" only after admin calls approveAndPublishCampaign.
 */
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

/**
 * Permanently delete a campaign from the live "campaigns" collection.
 * Removes it from the site entirely: home, /campaigns, and detail page (which will 404).
 * Under-review campaigns are in campaignsUnderReview; use deleteCampaignUnderReview for those.
 */
export async function deleteCampaign(campaignId: string): Promise<void> {
  await deleteDoc(doc(db, campaignsCollection, campaignId));
}

/** Put a campaign on hold (hidden from public) or release it. On-hold campaigns are excluded from getCampaigns and getCampaign. */
export async function setCampaignOnHold(campaignId: string, onHold: boolean): Promise<void> {
  await updateDoc(doc(db, campaignsCollection, campaignId), {
    status: onHold ? "on_hold" : "live",
    updatedAt: serverTimestamp(),
  });
}

/** All campaigns for admin (includes on-hold; excludes only pending from wrong collection). Not for public use. */
export async function getCampaignsForAdmin(): Promise<(Campaign & { status?: string })[]> {
  const q = query(collection(db, campaignsCollection));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .filter((docSnap) => (docSnap.data() as Record<string, unknown>).status !== "pending")
    .map((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const createdAt = normalizeCreatedAt(data);
      return { ...data, id: docSnap.id, createdAt } as Campaign & { status?: string };
    });
}

/** Campaigns on hold for a given creator (My Campaigns page). creatorId must match the signed-in user.
 *  Requires Firestore composite index on campaigns: creatorId (Ascending), status (Ascending). */
export async function getCampaignsOnHoldForUser(creatorId: string): Promise<(Campaign & { status?: string })[]> {
  if (!creatorId) return [];
  const q = query(
    collection(db, campaignsCollection),
    where("creatorId", "==", creatorId),
    where("status", "==", "on_hold")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    const createdAt = normalizeCreatedAt(data);
    const creator = (data.creator as string) ?? (data.creatorName as string) ?? "";
    return { ...data, id: docSnap.id, createdAt, creator } as Campaign & { status?: string };
  });
}

// Donations operations
export async function getDonations(campaignId?: string): Promise<AdminDonation[]> {
  let q;
  if (campaignId) {
    // Query by campaignId only (no composite index needed); sort in memory
    q = query(collection(db, donationsCollection), where("campaignId", "==", campaignId));
  } else {
    q = query(collection(db, donationsCollection), orderBy("createdAt", "desc"));
  }

  const querySnapshot = await getDocs(q);
  const donations = querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
    return {
      ...data,
      id: docSnap.id,
      createdAt: createdAt || new Date().toISOString(),
    };
  }) as AdminDonation[];

  if (campaignId) {
    donations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return donations;
}

export async function createDonation(donation: Omit<AdminDonation, "id">): Promise<string> {
  const docRef = doc(collection(db, donationsCollection));
  await setDoc(docRef, {
    ...donation,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Record a donation in Firestore and increment the campaign's raised amount and backers.
 * Call this when a donation is completed (after payment processing).
 * Rejects if the campaign has already reached or exceeded its goal (fully funded).
 */
export async function recordDonationAndUpdateCampaign(
  donation: Omit<AdminDonation, "id">,
  campaignId: string
): Promise<string> {
  const campaignRef = doc(db, campaignsCollection, campaignId);
  const campaignSnap = await getDoc(campaignRef);
  if (!campaignSnap.exists()) {
    throw new Error("Campaign not found");
  }
  const campaignData = campaignSnap.data() as { goal?: number; raised?: number };
  const goal = Number(campaignData?.goal) || 0;
  const raised = Number(campaignData?.raised) || 0;
  if (goal > 0 && raised >= goal) {
    throw new Error("Campaign has been fully funded. No further donations are accepted.");
  }

  const donationId = await createDonation(donation);
  await updateDoc(campaignRef, {
    raised: increment(donation.amount),
    backers: increment(1),
    updatedAt: serverTimestamp(),
  });
  return donationId;
}

/**
 * Approve a pending donation (e.g. bank transfer or DigiWallet). Updates donation status to
 * "completed" and adds the amount to the campaign's raised total and backers count.
 * Rejects if the campaign has already reached or exceeded its goal (fully funded).
 */
export async function approveDonation(donationId: string): Promise<void> {
  const donationRef = doc(db, donationsCollection, donationId);
  const donationSnap = await getDoc(donationRef);
  if (!donationSnap.exists()) {
    throw new Error("Donation not found");
  }
  const data = donationSnap.data();
  const status = data.status as string;
  if (status === "completed") {
    throw new Error("Donation is already completed");
  }
  const campaignId = data.campaignId as string;
  const amount = Number(data.amount);
  if (!campaignId || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid donation data");
  }

  const campaignRef = doc(db, campaignsCollection, campaignId);
  const campaignSnap = await getDoc(campaignRef);
  if (campaignSnap.exists()) {
    const campaignData = campaignSnap.data() as { goal?: number; raised?: number };
    const goal = Number(campaignData?.goal) || 0;
    const raised = Number(campaignData?.raised) || 0;
    if (goal > 0 && raised >= goal) {
      throw new Error("Campaign has been fully funded. No further donations are accepted.");
    }
  }

  await updateDoc(donationRef, {
    status: "completed",
    updatedAt: serverTimestamp(),
  });
  await updateDoc(campaignRef, {
    raised: increment(amount),
    backers: increment(1),
    updatedAt: serverTimestamp(),
  });
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
  /** Cover image URLs (user-uploaded). */
  image?: string;
  image2?: string;
}

/**
 * Submit a campaign for review. QUARANTINE: Stored only in campaignsUnderReview.
 * Not written to "campaigns"—so it never appears on home, /campaigns, or API.
 * Visible only to admins (Under review) and the creator (My Campaigns). Becomes
 * public only after admin approval (approveAndPublishCampaign).
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
    submittedAt: (data.submittedAt as string) || ((data.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString?.() ?? new Date().toISOString()),
    status: (data.status as CampaignUnderReviewDoc["status"]) || "pending",
    image: data.image as string | undefined,
    image2: data.image2 as string | undefined,
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
    image: data.image,
    image2: data.image2,
  } as CampaignUnderReviewDoc;
}

/** Approve a campaign: publish to live campaigns and notify the creator. */
export async function approveAndPublishCampaign(underReviewId: string): Promise<{ campaignId: string }> {
  const underReview = await getCampaignUnderReviewById(underReviewId);
  if (!underReview) throw new Error("Campaign under review not found");
  if (underReview.status !== "pending") throw new Error("Campaign is no longer pending");

  // Check that creator has phone, ID, and address verified
  if (underReview.creatorId) {
    const creatorDoc = await getDoc(doc(db, usersCollection, underReview.creatorId));
    if (creatorDoc.exists()) {
      const creatorData = creatorDoc.data();
      if (!creatorData.phoneVerified) {
        throw new Error("Creator's phone number must be approved before campaign can go live");
      }
      if (!creatorData.idVerified) {
        throw new Error("Creator's ID must be verified before campaign can go live");
      }
      if (!creatorData.addressVerified) {
        throw new Error("Creator's address must be verified before campaign can go live");
      }
    }
  }

  const defaultImage = "https://picsum.photos/seed/campaign/800/600";
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
    image: underReview.image || defaultImage,
    image2: underReview.image2 || underReview.image || defaultImage,
    location: "",
    createdAt: new Date().toISOString().split("T")[0],
    verified: true,
  };
  const docRef = doc(collection(db, campaignsCollection));
  await setDoc(docRef, {
    ...campaignPayload,
    creatorId: underReview.creatorId || null,
    status: "live",
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

  // Remove from under review so it no longer appears on the user's My Campaigns page
  await deleteDoc(doc(db, campaignsUnderReviewCollection, underReviewId));
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
export type UserStatus = "active" | "on_hold" | "deleted";

export interface AdminUserDoc {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  status: UserStatus;
  phoneNumber?: string;
  phoneVerified: boolean;
  phonePending: boolean;
  idDocument?: string;
  idDocumentType?: "social_security" | "passport";
  idVerified: boolean;
  idPending: boolean;
  addressDocument?: string;
  addressPending: boolean;
  verified: boolean;
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
      status: (data.status as UserStatus) ?? "active",
      phoneNumber: data.phoneNumber,
      phoneVerified: data.phoneVerified ?? false,
      verified: data.verified ?? false,
      idDocument: data.idDocument,
      idDocumentType: data.idDocumentType,
      idVerified: data.idVerified ?? false,
      idPending: data.idPending ?? false,
      addressDocument: data.addressDocument,
      addressPending: data.addressPending ?? false,
      addressVerified: data.addressVerified ?? false,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.(),
    } as AdminUserDoc;
  });
}

export async function setUserPhoneVerified(userId: string, verified: boolean): Promise<void> {
  await updateDoc(doc(db, usersCollection, userId), {
    phoneVerified: verified,
    phonePending: false,
    updatedAt: serverTimestamp(),
  });
}

export async function setIdVerified(userId: string, verified: boolean): Promise<void> {
  await updateDoc(doc(db, usersCollection, userId), {
    idVerified: verified,
    idPending: false,
    updatedAt: serverTimestamp(),
  });
}

export async function setAddressVerified(userId: string, verified: boolean): Promise<void> {
  await updateDoc(doc(db, usersCollection, userId), {
    addressVerified: verified,
    addressPending: false,
    updatedAt: serverTimestamp(),
  });
}

export async function setUserStatus(userId: string, status: UserStatus): Promise<void> {
  await updateDoc(doc(db, usersCollection, userId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  await deleteDoc(doc(db, usersCollection, userId));
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
