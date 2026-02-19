"use client";

import { useState, useEffect } from "react";
import { getUsersFromFirestore, setUserPhoneVerified, setUserStatus, type AdminUserDoc, type UserStatus } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useThemedModal } from "@/components/ThemedModal";
import { CheckCircle2, XCircle, Phone, PauseCircle, PlayCircle, Trash2 } from "lucide-react";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { confirm, alert } = useThemedModal();
  const [users, setUsers] = useState<AdminUserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getUsersFromFirestore();
      const sorted = [...list].sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      setUsers(sorted);
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
      alert("Failed to approve phone.", { variant: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetStatus = async (userId: string, status: UserStatus) => {
    if (userId === currentUser?.id) {
      alert("You cannot change your own status.", { variant: "error" });
      return;
    }
    setUpdatingId(userId);
    try {
      await setUserStatus(userId, status);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status.", { variant: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePutOnHold = async (userId: string, name: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot put yourself on hold.", { variant: "error" });
      return;
    }
    const ok = await confirm(
      `Put "${name}" on hold? They will not be able to create or edit campaigns until you remove hold.`,
      { title: "Put user on hold", confirmLabel: "Put on hold", variant: "warning" }
    );
    if (ok) await handleSetStatus(userId, "on_hold");
  };

  const handleRemoveHold = async (userId: string) => {
    await handleSetStatus(userId, "active");
  };

  const handleDeleteUser = async (userId: string, name: string, email: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account.", { variant: "error" });
      return;
    }
    const ok = await confirm(
      `Disable account for "${name}" (${email})? They will no longer be able to create or edit campaigns. You can put them on hold instead if you want to allow access later.`,
      { title: "Disable user", confirmLabel: "Disable", variant: "danger" }
    );
    if (ok) await handleSetStatus(userId, "deleted");
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
          Review and approve phone numbers. Once a number is approved, that user can post and edit campaigns. Users cannot create or edit campaigns until their phone is approved.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Phone approved</th>
                <th className="px-5 py-3 font-medium">ID verified</th>
                <th className="px-5 py-3 font-medium bg-gray-50 sticky right-0 shadow-[-4px_0_8px_rgba(0,0,0,0.06)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const status = u.status ?? "active";
                const statusLabel = status === "active" ? "Active" : status === "on_hold" ? "On hold" : "Disabled";
                return (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900">{u.name}</td>
                    <td className="px-5 py-3 text-gray-600 truncate max-w-[200px]" title={u.email}>{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={u.role === "admin" ? "text-primary-600 font-medium" : "text-gray-600"}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={
                        status === "active" ? "text-verified-600" :
                        status === "on_hold" ? "text-amber-600" : "text-red-600"
                      }>
                        {statusLabel}
                      </span>
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
                    <td className="px-5 py-3 align-top bg-white sticky right-0 shadow-[-4px_0_8px_rgba(0,0,0,0.06)]">
                      <div className="flex flex-wrap items-center gap-2 min-w-[200px]">
                        {u.phoneNumber && !u.phoneVerified && (
                          <button
                            type="button"
                            onClick={() => handleApprovePhone(u.id)}
                            disabled={updatingId === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-verified-100 text-verified-700 hover:bg-verified-200 text-xs font-medium disabled:opacity-50"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {updatingId === u.id ? "…" : "Approve phone"}
                          </button>
                        )}
                        {status === "active" && !isSelf && (
                          <button
                            type="button"
                            onClick={() => handlePutOnHold(u.id, u.name)}
                            disabled={updatingId === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-medium disabled:opacity-50"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                            Put on hold
                          </button>
                        )}
                        {status === "on_hold" && !isSelf && (
                          <button
                            type="button"
                            onClick={() => handleRemoveHold(u.id)}
                            disabled={updatingId === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-verified-100 text-verified-700 hover:bg-verified-200 text-xs font-medium disabled:opacity-50"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Remove hold
                          </button>
                        )}
                        {status !== "deleted" && !isSelf && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name, u.email)}
                            disabled={updatingId === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Disable
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
