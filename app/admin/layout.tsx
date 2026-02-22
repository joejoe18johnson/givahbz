"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { LayoutDashboard, Megaphone, Users, Heart, ArrowLeft, Clock, Bell, LogOut, Trophy, FileText } from "lucide-react";
import Image from "next/image";
import {
  getCampaignsUnderReviewCount,
  getCampaignsUnderReviewFromFirestore,
  getCampaigns,
  getUsersFromFirestore,
  getDonations,
  type CampaignUnderReviewDoc,
} from "@/lib/firebase/firestore";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const NOTIFICATIONS_SEEN_KEY = "crowdfund_admin_notifications_seen";

  const [notifications, setNotifications] = useState<CampaignUnderReviewDoc[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [sectionCounts, setSectionCounts] = useState({
    campaigns: 0,
    users: 0,
    donations: 0,
    underReview: 0,
    phonePending: 0,
    pendingDonations: 0,
    addressPending: 0,
  });
  const [lastSeen, setLastSeen] = useState({
    underReview: 0,
    phonePending: 0,
    pendingDonations: 0,
    addressPending: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load last-seen from localStorage on mount so "new" = only items since last open
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem(NOTIFICATIONS_SEEN_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          underReview?: number;
          phonePending?: number;
          pendingDonations?: number;
          addressPending?: number;
        };
        setLastSeen({
          underReview: typeof parsed.underReview === "number" ? parsed.underReview : 0,
          phonePending: typeof parsed.phonePending === "number" ? parsed.phonePending : 0,
          pendingDonations: typeof parsed.pendingDonations === "number" ? parsed.pendingDonations : 0,
          addressPending: typeof parsed.addressPending === "number" ? parsed.addressPending : 0,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // When dropdown is opened, mark current counts as seen so red bubbles disappear
  useEffect(() => {
    if (!showNotificationDropdown) return;
    const seen = {
      underReview: sectionCounts.underReview,
      phonePending: sectionCounts.phonePending,
      pendingDonations: sectionCounts.pendingDonations,
      addressPending: sectionCounts.addressPending,
    };
    setLastSeen(seen);
    try {
      localStorage.setItem(NOTIFICATIONS_SEEN_KEY, JSON.stringify(seen));
    } catch {
      // ignore
    }
  }, [
    showNotificationDropdown,
    sectionCounts.underReview,
    sectionCounts.phonePending,
    sectionCounts.pendingDonations,
    sectionCounts.addressPending,
  ]);

  const newUnderReview = Math.max(0, sectionCounts.underReview - lastSeen.underReview);
  const newPhonePending = Math.max(0, sectionCounts.phonePending - lastSeen.phonePending);
  const newPendingDonations = Math.max(0, sectionCounts.pendingDonations - lastSeen.pendingDonations);
  const newAddressPending = Math.max(0, sectionCounts.addressPending - lastSeen.addressPending);
  const newNotificationTotal =
    newUnderReview + newPhonePending + newPendingDonations + newAddressPending;

  const sevenDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.getTime();
  };

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      try {
        const [underReviewCount, list, campaigns, users, donations] = await Promise.all([
          getCampaignsUnderReviewCount(),
          getCampaignsUnderReviewFromFirestore(),
          getCampaigns(),
          getUsersFromFirestore(),
          getDonations(),
        ]);
        const underReviewNewestFirst = [...list].sort(
          (a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime()
        );
        setNotifications(underReviewNewestFirst.slice(0, 10));
        const since = sevenDaysAgo();
        const phonePending = users.filter((u) => u.phoneNumber && !u.phoneVerified).length;
        const addressPending = users.filter((u) => u.addressDocument && !u.addressVerified).length;
        const pendingDonations = donations.filter((d) => d.status === "pending").length;
        setSectionCounts({
          underReview: underReviewCount,
          campaigns: campaigns.filter((c) => new Date(c.createdAt).getTime() >= since).length,
          users: users.filter((u) => u.createdAt && new Date(u.createdAt).getTime() >= since).length,
          donations: donations.filter((d) => new Date(d.createdAt).getTime() >= since).length,
          phonePending,
          pendingDonations,
          addressPending,
        });
        // First visit or cleared storage: treat current counts as already seen so no bubble until new items arrive
        try {
          if (typeof window !== "undefined" && !localStorage.getItem(NOTIFICATIONS_SEEN_KEY)) {
            const seen = {
              underReview: underReviewCount,
              phonePending,
              pendingDonations,
              addressPending,
            };
            localStorage.setItem(NOTIFICATIONS_SEEN_KEY, JSON.stringify(seen));
            setLastSeen(seen);
          }
        } catch {
          // ignore
        }
      } catch {
        setNotifications([]);
        setSectionCounts({
          campaigns: 0,
          users: 0,
          donations: 0,
          underReview: 0,
          phonePending: 0,
          pendingDonations: 0,
          addressPending: 0,
        });
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotificationDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }
    if (!isAdmin) {
      router.replace("/");
      return;
    }
  }, [user, isAdmin, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // middleware or auth will redirect to login
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access denied</h1>
          <p className="text-gray-600 mb-4">
            Your account does not have admin access. Add your email to <code className="text-sm bg-gray-100 px-1 rounded">NEXT_PUBLIC_ADMIN_EMAILS</code> (or <code className="text-sm bg-gray-100 px-1 rounded">ADMIN_EMAILS</code>) in your .env and on Vercel, then sign out and sign in again.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Signed in as <strong>{user.email}</strong>. Use this exact email in the admin list (comma-separated, no spaces).
          </p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-gray-200 shadow-sm z-40 overflow-y-auto flex flex-col">
        <nav className="p-4 space-y-1 flex-1 pb-24">
          <div className="flex flex-col items-center gap-3 py-4 border-b border-gray-100">
            <Image src="/givah-logo.png" alt="GivahBz" width={120} height={36} className="h-8 w-auto" priority />
            <Link
              href="/"
              className="w-full text-center inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Back to site
            </Link>
          </div>
          <div className="pt-4">
            {/* Notification bell - next to sidebar sections */}
            <div className="relative mb-2" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowNotificationDropdown((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                  newNotificationTotal > 0
                    ? "bg-red-50 border border-red-200 text-red-800 hover:bg-red-100"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                aria-label="Notifications"
              >
                <Bell className={`w-4 h-4 shrink-0 ${newNotificationTotal > 0 ? "text-red-600" : ""}`} />
                <span className="flex-1 font-medium">Notifications</span>
                {newNotificationTotal > 0 && (
                  <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium animate-pulse">
                    {newNotificationTotal > 99 ? "99+" : newNotificationTotal}
                  </span>
                )}
              </button>
              {showNotificationDropdown && (
                <div className="absolute left-0 top-full mt-1 w-72 max-h-[20rem] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-medium text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500">Items that need your attention</p>
                  </div>
                  <div className="py-2 px-2 space-y-1">
                    <Link
                      href="/admin/under-review"
                      onClick={() => setShowNotificationDropdown(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        newUnderReview > 0 ? "bg-amber-50 border border-amber-200 hover:bg-amber-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className={`text-sm ${newUnderReview > 0 ? "text-amber-900 font-medium" : "text-gray-700"}`}>
                        Campaigns under review
                        {newUnderReview > 0 && <span className="ml-1.5 text-amber-600 text-xs">(new)</span>}
                      </span>
                      {newUnderReview > 0 && (
                        <span className="rounded-full bg-red-500 text-white text-xs font-medium min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">{newUnderReview}</span>
                      )}
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={() => setShowNotificationDropdown(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        newPhonePending > 0 ? "bg-amber-50 border border-amber-200 hover:bg-amber-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className={`text-sm ${newPhonePending > 0 ? "text-amber-900 font-medium" : "text-gray-700"}`}>
                        Phone numbers to review
                        {newPhonePending > 0 && <span className="ml-1.5 text-amber-600 text-xs">(new)</span>}
                      </span>
                      {newPhonePending > 0 && (
                        <span className="rounded-full bg-red-500 text-white text-xs font-medium min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">{newPhonePending}</span>
                      )}
                    </Link>
                    <Link
                      href="/admin/donations"
                      onClick={() => setShowNotificationDropdown(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        newPendingDonations > 0 ? "bg-amber-50 border border-amber-200 hover:bg-amber-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className={`text-sm ${newPendingDonations > 0 ? "text-amber-900 font-medium" : "text-gray-700"}`}>
                        Pending donations to approve
                        {newPendingDonations > 0 && <span className="ml-1.5 text-amber-600 text-xs">(new)</span>}
                      </span>
                      {newPendingDonations > 0 && (
                        <span className="rounded-full bg-red-500 text-white text-xs font-medium min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">{newPendingDonations}</span>
                      )}
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={() => setShowNotificationDropdown(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        newAddressPending > 0 ? "bg-amber-50 border border-amber-200 hover:bg-amber-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className={`text-sm ${newAddressPending > 0 ? "text-amber-900 font-medium" : "text-gray-700"}`}>
                        Address documents to review
                        {newAddressPending > 0 && <span className="ml-1.5 text-amber-600 text-xs">(new)</span>}
                      </span>
                      {newAddressPending > 0 && (
                        <span className="rounded-full bg-red-500 text-white text-xs font-medium min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">{newAddressPending}</span>
                      )}
                    </Link>
                    <div className="border-t border-gray-100 pt-2 mt-1">
                      <p className="px-3 py-1 text-xs text-gray-500">Quick links</p>
                      <Link href="/admin/campaigns" onClick={() => setShowNotificationDropdown(false)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                        Campaigns
                      </Link>
                      <Link href="/admin/users" onClick={() => setShowNotificationDropdown(false)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                        Users
                      </Link>
                      <Link href="/admin/donations" onClick={() => setShowNotificationDropdown(false)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                        Donations
                      </Link>
                    </div>
                  </div>
                  {notifications.length > 0 && (
                    <div className="border-t border-gray-100 pt-2">
                      <p className="px-4 text-xs text-gray-500 mb-2">Campaigns awaiting review</p>
                      <ul className="max-h-40 overflow-y-auto">
                        {notifications.slice(0, 5).map((n) => (
                          <li key={n.id}>
                            <Link href="/admin/under-review" onClick={() => setShowNotificationDropdown(false)} className="block px-4 py-2 hover:bg-gray-50 text-left text-sm text-gray-900 truncate">
                              {n.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/admin"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/campaigns"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/campaigns" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Megaphone className="w-4 h-4" />
              <span className="flex-1">Campaigns</span>
            </Link>
            <Link
              href="/admin/users"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/users"
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : newPhonePending > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="flex-1">Users</span>
              {newPhonePending > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {newPhonePending > 99 ? "99+" : newPhonePending}
                </span>
              )}
            </Link>
            <Link
              href="/admin/donations"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/donations"
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : newPendingDonations > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Heart className="w-4 h-4" />
              <span className="flex-1">Donations</span>
              {newPendingDonations > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {newPendingDonations > 99 ? "99+" : newPendingDonations}
                </span>
              )}
            </Link>
            <Link
              href="/admin/under-review"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/under-review"
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : newUnderReview > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="flex-1">Under review</span>
              {newUnderReview > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {newUnderReview > 99 ? "99+" : newUnderReview}
                </span>
              )}
            </Link>
            <Link
              href="/admin/completed-campaigns"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/completed-campaigns" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Trophy className="w-4 h-4" />
              <span className="flex-1">Completed campaigns</span>
            </Link>
            <Link
              href="/admin/site-info"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/site-info" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <FileText className="w-4 h-4" />
              <span className="flex-1">Edit site info</span>
            </Link>
          </div>
          
          {/* Profile Section at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            {user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-medium flex-shrink-0">
                    {user.profilePhoto ? (
                      <Image 
                        src={user.profilePhoto} 
                        alt={user.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-sm">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    router.push("/");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      <main className="pl-56 pt-6 min-h-screen">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
