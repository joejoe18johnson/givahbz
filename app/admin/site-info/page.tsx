"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase/config";
import { mergeWithDefaults, type SiteContent } from "@/lib/siteContent";
import { useThemedModal } from "@/components/ThemedModal";
import { FileText, Save } from "lucide-react";

const FIELDS: { key: keyof SiteContent; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "siteName", label: "Site name", placeholder: "GivahBz" },
  { key: "heroTitle", label: "Home hero title", placeholder: "Supporting Belizean Communities" },
  { key: "heroSubtitle", label: "Home hero subtitle", placeholder: "Life is either a daring adventure..." },
  { key: "communityHeadingPart1", label: "Community heading (part 1)", placeholder: "Community Shares " },
  { key: "communityHeadingPart2", label: "Community heading (part 2)", placeholder: "Burdens" },
  { key: "footerTagline", label: "Footer tagline", placeholder: "Supporting organizations, charities..." },
  { key: "footerCopyright", label: "Footer copyright line", placeholder: "© 2026 GivahBz. All rights reserved." },
  { key: "aboutTitle", label: "About page title", placeholder: "About GivahBz" },
  { key: "aboutSubtitle", label: "About page subtitle", placeholder: "Empowering Belizean communities..." },
  { key: "aboutMission", label: "About mission paragraph", placeholder: "GivahBz was created to provide...", multiline: true },
];

export default function AdminSiteInfoPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<SiteContent>(() => mergeWithDefaults(null));
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { alert } = useThemedModal();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/site-content", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setForm(mergeWithDefaults(data));
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load");
          setForm(mergeWithDefaults(null));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (key: keyof SiteContent, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      alert("Session expired. Please sign in again.", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/admin/site-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "Failed to save.";
        const hint = data?.hint;
        alert(hint ? `${msg}\n\n${hint}` : msg, { variant: "error" });
        return;
      }
      alert("Site content saved. Changes will appear on the site shortly.", { variant: "success" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-8 h-8 text-primary-600" />
          Edit site info
        </h1>
        <p className="text-gray-600 mt-1">
          Update text that appears on the homepage, footer, and about page. Changes are saved to the database and shown across the site.
        </p>
      </div>

      {loadError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          {loadError} Using default content. You can still edit and save.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {FIELDS.map(({ key, label, placeholder, multiline }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              {multiline ? (
                <textarea
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              )}
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
