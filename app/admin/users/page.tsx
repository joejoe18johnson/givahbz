"use client";

import { adminUsers } from "@/lib/adminData";
import { CheckCircle2, XCircle } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">All Users</h1>
        <p className="text-gray-600 mt-1">{adminUsers.length} users total</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Verified</th>
                <th className="px-5 py-3 font-medium">ID verified</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Last login</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-500 font-mono">{u.id}</td>
                  <td className="px-5 py-3 text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={u.role === "admin" ? "text-primary-600 font-medium" : "text-gray-600"}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3">
                    {u.verified ? <span className="text-success-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Yes</span> : <span className="text-amber-600 inline-flex items-center gap-1"><XCircle className="w-4 h-4" /> No</span>}
                  </td>
                  <td className="px-5 py-3">
                    {u.idVerified ? <span className="text-verified-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Yes</span> : <span className="text-amber-600 inline-flex items-center gap-1"><XCircle className="w-4 h-4" /> No</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{u.createdAt}</td>
                  <td className="px-5 py-3 text-gray-600">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
