"use client";

import { useState, useEffect } from "react";
import { getDonations } from "@/lib/firebase/firestore";
import { auth } from "@/lib/firebase/config";
import { type AdminDonation } from "@/lib/adminData";
import { formatCurrency } from "@/lib/utils";
import { useThemedModal } from "@/components/ThemedModal";

export default function AdminDonationsPage() {
  const { alert } = useThemedModal();
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function loadDonations() {
    setIsLoading(true);
    try {
      const fetchedDonations = await getDonations();
      const sorted = [...fetchedDonations].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setDonations(sorted);
    } catch (error) {
      console.error("Error loading donations:", error);
      setDonations([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDonations();
  }, []);

  async function handleApprove(donationId: string) {
    setApprovingId(donationId);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be signed in to approve donations.");
      }
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/approve-donation", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ donationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "Failed to approve donation.";
        const hint = typeof data.hint === "string" ? data.hint : "";
        throw new Error(hint ? `${msg} ${hint}` : msg);
      }
      await loadDonations();
      alert("Donation approved. The campaign totals have been updated.", {
        title: "Approved",
        variant: "success",
      });
    } catch (error) {
      console.error("Error approving donation:", error);
      const message = error instanceof Error ? error.message : "Failed to approve donation.";
      alert(message, {
        title: "Could not approve",
        variant: "error",
      });
    } finally {
      setApprovingId(null);
    }
  }

  const totalCompleted = donations.filter((d) => d.status === "completed").reduce((sum, d) => sum + d.amount, 0);
  const totalPending = donations.filter((d) => d.status === "pending").reduce((sum, d) => sum + d.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">All Donations</h1>
          <p className="text-gray-600 mt-1">{donations.length} donations total</p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-600">Completed: <strong className="text-success-600">{formatCurrency(totalCompleted)}</strong></span>
          <span className="text-gray-600">Pending: <strong className="text-amber-600">{formatCurrency(totalPending)}</strong></span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Donor</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Anonymous</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-gray-500">
                    No donations yet
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500 font-mono">{d.id}</td>
                    <td className="px-5 py-3 text-gray-600">{new Date(d.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-900 max-w-[220px] truncate" title={d.campaignTitle}>{d.campaignTitle}</td>
                    <td className="px-5 py-3 text-gray-900">{d.anonymous ? "Anonymous" : d.donorName}</td>
                    <td className="px-5 py-3 text-gray-600 truncate max-w-[160px]">{d.anonymous ? "—" : d.donorEmail}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(d.amount)}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize">{d.method.replace("-", " ")}</td>
                    <td className="px-5 py-3">{d.anonymous ? "Yes" : "No"}</td>
                    <td className="px-5 py-3">
                      <span className={d.status === "completed" ? "text-success-600" : d.status === "pending" ? "text-amber-600" : "text-red-600"}>{d.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      {d.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => handleApprove(d.id)}
                          disabled={approvingId === d.id}
                          className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approvingId === d.id ? "Approving…" : "Approve"}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
