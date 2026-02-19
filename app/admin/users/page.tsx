"use client";

import { useState, useEffect } from "react";
import { getUsersFromFirestore, setUserPhoneVerified, type AdminUserDoc } from "@/lib/firebase/firestore";
import { CheckCircle2, XCircle, Phone } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getUsersFromFirestore();
      setUsers(list);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprovePhone = async (userId: string) => {
    setUpdatingId(userId);
    try {
      await setUserPhoneVerified(userId, true);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, phoneVerified: true } : u)));
    } catch (error) {
      console.error("Error approving phone:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">All Users</h1>
        <p className="text-gray-600 mt-1">
          Approve phone numbers so users can create campaigns. Users need an approved phone before they can start a campaign.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Phone approved</th>
                <th className="px-5 py-3 font-medium">ID verified</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-600 truncate max-w-[200px]" title={u.email}>{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={u.role === "admin" ? "text-primary-600 font-medium" : "text-gray-600"}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{u.phoneNumber || "—"}</td>
                  <td className="px-5 py-3">
                    {u.phoneVerified ? (
                      <span className="text-verified-600 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Yes
                      </span>
                    ) : (
                      <span className="text-amber-600 inline-flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> No
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {u.idVerified ? (
                      <span className="text-verified-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Yes</span>
                    ) : (
                      <span className="text-amber-600 inline-flex items-center gap-1"><XCircle className="w-4 h-4" /> No</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {u.phoneNumber && !u.phoneVerified && (
                      <button
                        type="button"
                        onClick={() => handleApprovePhone(u.id)}
                        disabled={updatingId === u.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-verified-100 text-verified-700 hover:bg-verified-200 text-xs font-medium disabled:opacity-50"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {updatingId === u.id ? "Updating…" : "Approve phone"}
                      </button>
                    )}
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
