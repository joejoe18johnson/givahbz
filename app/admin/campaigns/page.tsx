"use client";

import { campaigns } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

export default function AdminCampaignsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">All Campaigns</h1>
        <p className="text-gray-600 mt-1">{campaigns.length} campaigns total</p>
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
                <th className="px-5 py-3 font-medium">Verified</th>
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
                    {c.verified ? (
                      <span className="inline-flex items-center gap-1 text-verified-600"><CheckCircle2 className="w-4 h-4" /> Yes</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600"><XCircle className="w-4 h-4" /> No</span>
                    )}
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
