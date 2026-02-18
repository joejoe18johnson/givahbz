"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Mail, User, CheckCircle2, ArrowRight } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your profile.</p>
          <Link
            href="/auth/login?callbackUrl=/profile"
            className="inline-block bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-medium text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-medium text-gray-900">{user.name}</h2>
              <p className="text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </div>
          </div>

          <dl className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <dt className="text-gray-500">Account type</dt>
                <dd className="font-medium text-gray-900 capitalize">{user.role ?? "User"}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success-500" />
              <div>
                <dt className="text-gray-500">Identity verified</dt>
                <dd className="font-medium text-gray-900">{user.idVerified ? "Yes" : "Pending"}</dd>
              </div>
            </div>
          </dl>

          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
            <Link
              href="/my-campaigns"
              className="inline-flex items-center gap-2 text-success-600 hover:text-success-700 font-medium"
            >
              My Campaigns
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/campaigns/create"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Start a campaign
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
