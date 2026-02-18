"use client";

import { useAuth } from "@/contexts/AuthContext";
import { campaigns } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import {
  Plus,
  Calendar,
  Users,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  MapPin,
  FileText,
} from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyCampaignsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login?callbackUrl=/my-campaigns");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const myCampaigns = campaigns.filter(
    (c) => c.creator.trim().toLowerCase() === user.name.trim().toLowerCase()
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-medium text-gray-900">My Campaigns</h1>
          <p className="text-gray-600 mt-1">
            {myCampaigns.length === 0
              ? "You haven't started any campaigns yet."
              : `You have ${myCampaigns.length} campaign${myCampaigns.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Link
          href="/campaigns/create"
          className="inline-flex items-center justify-center gap-2 bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          Start a campaign
        </Link>
      </div>

      {myCampaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">No campaigns yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first campaign to share your cause and start receiving support from the
              community.
            </p>
            <Link
              href="/campaigns/create"
              className="inline-flex items-center gap-2 bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create your first campaign
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {myCampaigns.map((campaign) => {
            const progress = Math.min((campaign.raised / campaign.goal) * 100, 100);
            return (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="block group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="relative w-full md:w-64 h-48 md:h-auto md:min-h-[200px] bg-gray-200 flex-shrink-0">
                    <SafeImage
                      src={campaign.image}
                      alt={campaign.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 256px"
                      fallback={
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                          <span className="text-primary-600 text-4xl font-medium">
                            {campaign.title.charAt(0)}
                          </span>
                        </div>
                      }
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {campaign.verified && (
                        <span className="bg-success-500 text-white p-1.5 rounded-full" title="Verified">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                      <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-primary-600">
                        {campaign.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-5 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <h2 className="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                        {campaign.title}
                      </h2>
                      <span className="inline-flex items-center text-gray-500 text-sm">
                        <ArrowRight className="w-4 h-4 mr-1 opacity-0 group-hover:opacity-100" />
                        View campaign
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{campaign.description}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <DollarSign className="w-4 h-4 text-success-600" />
                        <span className="font-medium text-success-600">
                          {formatCurrency(campaign.raised)}
                        </span>
                        <span className="text-gray-500">/ {formatCurrency(campaign.goal)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{campaign.backers} backers</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{campaign.daysLeft} days left</span>
                      </div>
                      {campaign.location && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{campaign.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>Created {campaign.createdAt}</span>
                      <span className="capitalize">{campaign.creatorType}</span>
                      {campaign.proofDocuments && campaign.proofDocuments.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {campaign.proofDocuments.length} proof doc
                          {campaign.proofDocuments.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-success-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
