"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { LayoutDashboard, Megaphone, Users, Heart, ArrowLeft, Clock } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
            Your account does not have admin access. Only emails listed in <code className="text-sm bg-gray-100 px-1 rounded">ADMIN_EMAILS</code> (in your .env) can view the admin dashboard.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Signed in as <strong>{user.email}</strong>. Add this email to ADMIN_EMAILS and restart the server, or sign in with admin@givahbz.com / Admin123!
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
      <main className="pl-56 pt-16 min-h-screen">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
