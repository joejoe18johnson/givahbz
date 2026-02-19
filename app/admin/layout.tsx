"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { LayoutDashboard, Megaphone, Users, Heart, ArrowLeft, Clock, Bell } from "lucide-react";
import { getCampaignsUnderReviewCount, getCampaignsUnderReviewFromFirestore, type CampaignUnderReviewDoc } from "@/lib/firebase/firestore";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<CampaignUnderReviewDoc[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      try {
        const [count, list] = await Promise.all([
          getCampaignsUnderReviewCount(),
          getCampaignsUnderReviewFromFirestore(),
        ]);
        setNotificationCount(count);
        setNotifications(list.slice(0, 10));
      } catch {
        setNotificationCount(0);
        setNotifications([]);
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
              Campaigns
            </Link>
            <Link
              href="/admin/users"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/users" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Users className="w-4 h-4" />
              Users
            </Link>
            <Link
              href="/admin/donations"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/donations" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Heart className="w-4 h-4" />
              Donations
            </Link>
            <Link
              href="/admin/under-review"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/under-review" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Clock className="w-4 h-4" />
              Under review
            </Link>
          </div>
        </nav>
      </aside>

      {/* Admin top bar with notification bell */}
      <header className="fixed left-56 right-0 top-16 h-14 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <span className="text-sm font-medium text-gray-700">Admin</span>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowNotificationDropdown((v) => !v)}
            className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-primary-600 text-white text-xs font-medium">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>
          {showNotificationDropdown && (
            <div className="absolute right-0 top-full mt-1 w-80 max-h-[24rem] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-lg py-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">Campaigns awaiting review</p>
              </div>
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">No new notifications</p>
              ) : (
                <ul className="py-2">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <Link
                        href="/admin/under-review"
                        onClick={() => setShowNotificationDropdown(false)}
                        className="block px-4 py-3 hover:bg-gray-50 text-left"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                        <p className="text-xs text-gray-500">by {n.creatorName} · {n.category}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {notificationCount > 0 && (
                <Link
                  href="/admin/under-review"
                  onClick={() => setShowNotificationDropdown(false)}
                  className="block px-4 py-2 text-center text-sm text-primary-600 font-medium hover:bg-gray-50"
                >
                  View all ({notificationCount})
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="pl-56 pt-[7.5rem] min-h-screen">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
