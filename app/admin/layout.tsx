"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { LayoutDashboard, Megaphone, Users, Heart, ArrowLeft, Clock, Bell } from "lucide-react";
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
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const NOTIFICATIONS_SEEN_KEY = "crowdfund_admin_notifications_seen";

  const [notifications, setNotifications] = useState<CampaignUnderReviewDoc[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [sectionCounts, setSectionCounts] = useState({ campaigns: 0, users: 0, donations: 0, underReview: 0, phonePending: 0 });
  const [lastSeen, setLastSeen] = useState({ underReview: 0, phonePending: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load last-seen from localStorage on mount so "new" = only items since last open
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem(NOTIFICATIONS_SEEN_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { underReview?: number; phonePending?: number };
        setLastSeen({
          underReview: typeof parsed.underReview === "number" ? parsed.underReview : 0,
          phonePending: typeof parsed.phonePending === "number" ? parsed.phonePending : 0,
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
    };
    setLastSeen(seen);
    try {
      localStorage.setItem(NOTIFICATIONS_SEEN_KEY, JSON.stringify(seen));
    } catch {
      // ignore
    }
  }, [showNotificationDropdown, sectionCounts.underReview, sectionCounts.phonePending]);

  const newUnderReview = Math.max(0, sectionCounts.underReview - lastSeen.underReview);
  const newPhonePending = Math.max(0, sectionCounts.phonePending - lastSeen.phonePending);
  const newNotificationTotal = newUnderReview + newPhonePending;

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
        setNotifications(list.slice(0, 10));
        const since = sevenDaysAgo();
        const phonePending = users.filter((u) => u.phoneNumber && !u.phoneVerified).length;
        setSectionCounts({
          underReview: underReviewCount,
          campaigns: campaigns.filter((c) => new Date(c.createdAt).getTime() >= since).length,
          users: users.filter((u) => u.createdAt && new Date(u.createdAt).getTime() >= since).length,
          donations: donations.filter((d) => new Date(d.createdAt).getTime() >= since).length,
          phonePending,
        });
      } catch {
        setNotifications([]);
        setSectionCounts({ campaigns: 0, users: 0, donations: 0, underReview: 0, phonePending: 0 });
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
      <aside className="fixed left-0 top-16 bottom-0 w-56 bg-white border-r border-gray-200 shadow-sm z-40 overflow-y-auto">
        <nav className="p-4 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to site
          </Link>
          <div className="pt-4 border-t border-gray-200">
            {/* Notification bell - next to sidebar sections */}
            <div className="relative mb-2" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowNotificationDropdown((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left text-gray-600 hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span className="flex-1">Notifications</span>
                {newNotificationTotal > 0 && (
                  <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
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
                    <Link href="/admin/under-review" onClick={() => setShowNotificationDropdown(false)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                      <span className="text-sm text-gray-700">Campaigns under review</span>
                      {newUnderReview > 0 && (
                        <span className="rounded-full bg-red-500 text-white text-xs font-medium min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">{newUnderReview}</span>
                      )}
                    </Link>
                    <Link href="/admin/users" onClick={() => setShowNotificationDropdown(false)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                      <span className="text-sm text-gray-700">Phone numbers to review</span>
                      {newPhonePending > 0 && (
                        <span className="rounded-full bg-red-500 text-white text-xs font-medium min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">{newPhonePending}</span>
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
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/users" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
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
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/donations" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Heart className="w-4 h-4" />
              <span className="flex-1">Donations</span>
            </Link>
            <Link
              href="/admin/under-review"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/under-review" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Clock className="w-4 h-4" />
              <span className="flex-1">Under review</span>
              {newUnderReview > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {newUnderReview > 99 ? "99+" : newUnderReview}
                </span>
              )}
            </Link>
          </div>
        </nav>
      </aside>

      {/* Admin top bar */}
      <header className="fixed left-56 right-0 top-16 h-14 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <span className="text-sm font-medium text-gray-700">Admin</span>
      </header>

      <main className="pl-56 pt-[7.5rem] min-h-screen">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
