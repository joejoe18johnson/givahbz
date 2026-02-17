"use client";

import { adminDonations } from "@/lib/adminData";
import { formatCurrency } from "@/lib/utils";

export default function AdminDonationsPage() {
  const totalCompleted = adminDonations.filter((d) => d.status === "completed").reduce((sum, d) => sum + d.amount, 0);
  const totalPending = adminDonations.filter((d) => d.status === "pending").reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">All Donations</h1>
          <p className="text-gray-600 mt-1">{adminDonations.length} donations total</p>
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
              </tr>
            </thead>
            <tbody>
              {adminDonations.map((d) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
