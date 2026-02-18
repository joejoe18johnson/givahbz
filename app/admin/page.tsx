"use client";

import { useState, useEffect } from "react";
import { Campaign } from "@/lib/data";
import { AdminDonation } from "@/lib/adminData";
import { fetchCampaignsFromAPI } from "@/lib/services/campaignService";
import { getDonations } from "@/lib/firebase/firestore";
import { adminUsers } from "@/lib/adminData";
import { getCampaignsUnderReview } from "@/lib/campaignsUnderReview";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Megaphone, Users, Heart, DollarSign, ArrowRight, Clock } from "lucide-react";

export default function AdminDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [underReviewCount, setUnderReviewCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedCampaigns, fetchedDonations] = await Promise.all([
          fetchCampaignsFromAPI(),
          getDonations(),
        ]);
        setCampaigns(fetchedCampaigns);
        setDonations(fetchedDonations);
      } catch (error) {
        console.error("Error loading admin data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
    setUnderReviewCount(getCampaignsUnderReview().length);
  }, []);

  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const totalDonations = donations.filter((d) => d.status === "completed").reduce((sum, d) => sum + d.amount, 0);
  const recentCampaigns = campaigns.slice(0, 5);
  const recentUsers = adminUsers.slice(0, 5);
  const recentDonations = donations.slice(0, 8);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of all platform data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Campaigns</p>
              <p className="text-xl font-semibold text-gray-900">{campaigns.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Raised</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalRaised)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Users</p>
              <p className="text-xl font-semibold text-gray-900">{adminUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Donations</p>
              <p className="text-xl font-semibold text-gray-900">{donations.length}</p>
            </div>
          </div>
        </div>
        <Link
          href="/admin/under-review"
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm block hover:border-primary-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Under review</p>
              <p className="text-xl font-semibold text-gray-900">{underReviewCount}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent data sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Campaigns</h2>
            <Link href="/admin/campaigns" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Creator</th>
                  <th className="px-5 py-3 font-medium">Raised</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900 max-w-[180px] truncate">{c.title}</td>
                    <td className="px-5 py-3 text-gray-600">{c.creator}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(c.raised)}</td>
                    <td className="px-5 py-3">
                      <span className={c.verified ? "text-verified-600" : "text-amber-600"}>{c.verified ? "Verified" : "Pending"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Users</h2>
            <Link href="/admin/users" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900">{u.name}</td>
                    <td className="px-5 py-3 text-gray-600 truncate max-w-[160px]">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={u.role === "admin" ? "text-primary-600 font-medium" : "text-gray-600"}>{u.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Donations</h2>
          <Link href="/admin/donations" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Donor</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDonations.map((d) => (
                <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-gray-900 max-w-[200px] truncate">{d.campaignTitle}</td>
                  <td className="px-5 py-3 text-gray-600">{d.anonymous ? "Anonymous" : d.donorName}</td>
                  <td className="px-5 py-3 font-medium">{formatCurrency(d.amount)}</td>
                  <td className="px-5 py-3 text-gray-600 capitalize">{d.method.replace("-", " ")}</td>
                  <td className="px-5 py-3">
                    <span className={d.status === "completed" ? "text-success-600" : d.status === "pending" ? "text-amber-600" : "text-red-600"}>{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
