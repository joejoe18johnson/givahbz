/**
 * Client-side cache for admin Firestore reads to reduce quota usage.
 * TTL 60s; invalidate after mutations (approve donation, approve campaign, user verification).
 */

import {
  getDonations,
  getCampaignsForAdmin,
  getUsersFromFirestore,
  getCampaignsUnderReviewFromFirestore,
  getCampaigns,
} from "./firestore";
import type { AdminDonation } from "@/lib/adminData";
import type { CampaignUnderReviewDoc, AdminUserDoc } from "./firestore";
import type { Campaign } from "@/lib/data";

const CACHE_TTL_MS = 60_000; // 1 minute

type CacheEntry<T> = { data: T; expires: number };

const cache = new Map<string, CacheEntry<unknown>>();

function get<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry || Date.now() > entry.expires) {
    if (entry) cache.delete(key);
    return null;
  }
  return entry.data;
}

function set<T>(key: string, data: T, ttlMs: number = CACHE_TTL_MS): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateDonationsCache(): void {
  cache.delete("donations_all");
}

export function invalidateCampaignsCache(): void {
  cache.delete("campaigns");
  cache.delete("campaignsForAdmin");
}

export function invalidateUsersCache(): void {
  cache.delete("users");
}

export function invalidateUnderReviewCache(): void {
  cache.delete("underReviewList");
}

/** Invalidate all admin caches (e.g. after bulk actions). */
export function invalidateAllAdminCache(): void {
  cache.clear();
}

// --- Cached fetchers (admin only) ---

export async function getDonationsCached(campaignId?: string): Promise<AdminDonation[]> {
  const cacheKey = campaignId ? `donations_${campaignId}` : "donations_all";
  const hit = get<AdminDonation[]>(cacheKey);
  if (hit != null) return hit;
  const data = await getDonations(campaignId);
  set(cacheKey, data);
  return data;
}

export async function getCampaignsForAdminCached(): Promise<(Campaign & { status?: string })[]> {
  const hit = get<(Campaign & { status?: string })[]>("campaignsForAdmin");
  if (hit != null) return hit;
  const data = await getCampaignsForAdmin();
  set("campaignsForAdmin", data);
  return data;
}

export async function getUsersFromFirestoreCached(): Promise<AdminUserDoc[]> {
  const hit = get<AdminUserDoc[]>("users");
  if (hit != null) return hit;
  const data = await getUsersFromFirestore();
  set("users", data);
  return data;
}

export async function getCampaignsUnderReviewFromFirestoreCached(): Promise<CampaignUnderReviewDoc[]> {
  const hit = get<CampaignUnderReviewDoc[]>("underReviewList");
  if (hit != null) return hit;
  const data = await getCampaignsUnderReviewFromFirestore();
  set("underReviewList", data);
  return data;
}

/** Uses cached under-review list when possible to avoid a separate count query. */
export async function getCampaignsUnderReviewCountCached(): Promise<number> {
  const list = get<CampaignUnderReviewDoc[]>("underReviewList");
  if (list != null) return list.length;
  const data = await getCampaignsUnderReviewFromFirestoreCached();
  return data.length;
}

/** Cached for admin layout stats (recent campaigns count). */
export async function getCampaignsCached(): Promise<Campaign[]> {
  const hit = get<Campaign[]>("campaigns");
  if (hit != null) return hit;
  const data = await getCampaigns();
  set("campaigns", data);
  return data;
}
