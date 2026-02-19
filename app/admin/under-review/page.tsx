"use client";

import { useState, useEffect } from "react";
import {
  getCampaignsUnderReviewFromFirestore,
  updateCampaignUnderReviewStatus,
  type CampaignUnderReviewDoc,
} from "@/lib/firebase/firestore";
import { formatCurrency } from "@/lib/utils";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

export default function AdminUnderReviewPage() {
  const [list, setList] = useState<CampaignUnderReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCampaignsUnderReviewFromFirestore();
      setList(data);
    } catch (error) {
      console.error("Error loading campaigns under review:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this campaign? It will be removed from under review. (You can later publish it to the live campaigns list.)")) return;
    try {
      await updateCampaignUnderReviewStatus(id, "approved");
      setList((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error approving:", error);
      alert("Failed to approve. Please try again.");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject and remove this campaign from review? The creator would need to resubmit.")) return;
    try {
      await updateCampaignUnderReviewStatus(id, "rejected");
      setList((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error rejecting:", error);
      alert("Failed to reject. Please try again.");
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading campaigns under review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Campaigns under review</h1>
        <p className="text-gray-600 mt-1">
          New campaigns submitted by creators appear here. Approve or reject each submission.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No campaigns under review</p>
          <p className="text-gray-500 text-sm mt-1">New submissions will appear here when creators submit from the campaign creation form.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Creator</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Goal</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDate(c.submittedAt)}</td>
                    <td className="px-5 py-3 text-gray-900 font-medium max-w-[200px] truncate" title={c.title}>{c.title}</td>
                    <td className="px-5 py-3 text-gray-900">{c.creatorName}</td>
                    <td className="px-5 py-3 text-gray-600">{c.category}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(c.goal)}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-[220px] truncate" title={c.description}>{c.description}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success-100 text-success-700 hover:bg-success-200 text-xs font-medium"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
