"use client";

import { useState, useEffect } from "react";
import { Campaign } from "@/lib/data";
import { getCampaignsForAdmin, deleteCampaign, setCampaignOnHold } from "@/lib/firebase/firestore";
import { formatCurrency } from "@/lib/utils";
import { useThemedModal } from "@/components/ThemedModal";
import Link from "next/link";
import { CheckCircle2, XCircle, Trash2, PauseCircle, PlayCircle } from "lucide-react";

type CampaignWithStatus = Campaign & { status?: string };

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [onHoldId, setOnHoldId] = useState<string | null>(null);
  const { confirm, alert } = useThemedModal();

  async function loadCampaigns() {
    setLoadError(null);
    setIsLoading(true);
    try {
      const fetchedCampaigns = await getCampaignsForAdmin();
      setCampaigns(fetchedCampaigns);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleDelete = async (campaignId: string, title: string) => {
    const ok = await confirm(
      `Delete "${title}"? This will remove the campaign from the main site and cannot be undone.`,
      { title: "Delete campaign", confirmLabel: "Delete", cancelLabel: "Cancel", variant: "danger" }
    );
    if (!ok) return;
    setDeletingId(campaignId);
    try {
      await deleteCampaign(campaignId);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    } catch (err) {
      console.error("Error deleting campaign:", err);
      alert("Could not delete the campaign. Please try again.", { variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetOnHold = async (campaignId: string, onHold: boolean) => {
    setOnHoldId(campaignId);
    try {
      await setCampaignOnHold(campaignId, onHold);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, status: onHold ? "on_hold" : "live" } : c))
      );
    } catch (err) {
      console.error("Error updating campaign status:", err);
      alert("Could not update campaign status. Please try again.", { variant: "error" });
    } finally {
      setOnHoldId(null);
    }
  };

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">All Campaigns</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium mb-2">Could not load campaigns</p>
          <p className="text-red-700 text-sm mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => loadCampaigns()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">All Campaigns</h1>
        <p className="text-gray-600 mt-1">{campaigns.length} campaigns total</p>
        <p className="text-gray-500 text-sm mt-1">
          Put a campaign on hold to hide it from the public site, or delete it. Use <strong>Release</strong> to make an on-hold campaign live again.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Goal</th>
                <th className="px-5 py-3 font-medium">Raised</th>
                <th className="px-5 py-3 font-medium">Backers</th>
                <th className="px-5 py-3 font-medium">Days left</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Verified</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-500 font-mono">{c.id}</td>
                  <td className="px-5 py-3">
                    <Link href={`/campaigns/${c.id}`} className="text-primary-600 hover:underline max-w-[200px] truncate block" title={c.title}>
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-900">{c.creator}</td>
                  <td className="px-5 py-3 text-gray-600 capitalize">{c.creatorType}</td>
                  <td className="px-5 py-3 text-gray-600">{c.category}</td>
                  <td className="px-5 py-3 font-medium">{formatCurrency(c.goal)}</td>
                  <td className="px-5 py-3 font-medium text-success-600">{formatCurrency(c.raised)}</td>
                  <td className="px-5 py-3">{c.backers}</td>
                  <td className="px-5 py-3">{c.daysLeft}</td>
                  <td className="px-5 py-3 text-gray-600">{c.createdAt}</td>
                  <td className="px-5 py-3">
                    {c.status === "on_hold" ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">On hold</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-verified-600">Live</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {c.verified ? (
                      <span className="inline-flex items-center gap-1 text-verified-600"><CheckCircle2 className="w-4 h-4" /> Yes</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600"><XCircle className="w-4 h-4" /> No</span>
                    )}
                  </td>
                  <td className="px-5 py-3 flex flex-wrap items-center gap-2">
                    {c.status === "on_hold" ? (
                      <button
                        type="button"
                        onClick={() => handleSetOnHold(c.id, false)}
                        disabled={onHoldId === c.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-xs font-medium disabled:opacity-50"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        {onHoldId === c.id ? "Updating…" : "Release"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetOnHold(c.id, true)}
                        disabled={onHoldId === c.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-medium disabled:opacity-50"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        {onHoldId === c.id ? "Updating…" : "Put on hold"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id, c.title)}
                      disabled={deletingId === c.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deletingId === c.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {campaigns.some((c) => c.proofDocuments && c.proofDocuments.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <h2 className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-900">Proof documents (by campaign)</h2>
          <div className="divide-y divide-gray-100">
            {campaigns.map((c) => (
              <div key={c.id} className="px-5 py-4">
                <p className="font-medium text-gray-900 mb-2">
                  {c.title} <span className="text-gray-500 font-normal">(ID: {c.id})</span>
                </p>
                {c.proofDocuments && c.proofDocuments.length > 0 ? (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {c.proofDocuments.map((doc) => (
                      <li key={doc.id}>
                        <span className="font-medium">{doc.name}</span> — {doc.type} — {doc.description}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No proof documents</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
