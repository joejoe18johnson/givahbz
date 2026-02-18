"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";
import { campaigns, type Campaign } from "@/lib/data";
import SafeImage from "@/components/SafeImage";
import { formatCurrency } from "@/lib/utils";
import { Users, Calendar, CheckCircle2 } from "lucide-react";
import { getHeartedCampaignIds, toggleHeartCampaign } from "@/components/HeartedCampaigns";

export default function LikedCampaignsPage() {
  const [heartedIds, setHeartedIds] = useState<string[]>([]);

  useEffect(() => {
    setHeartedIds(getHeartedCampaignIds());
    // Listen for changes
    const handleChange = () => {
      setHeartedIds(getHeartedCampaignIds());
    };
    window.addEventListener("heartedCampaignsChanged", handleChange);
    return () => {
      window.removeEventListener("heartedCampaignsChanged", handleChange);
    };
  }, []);

  const heartedCampaigns = campaigns.filter((campaign) => heartedIds.includes(campaign.id));

  const handleRemoveHeart = (campaignId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleHeartCampaign(campaignId);
    setHeartedIds(getHeartedCampaignIds());
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          <div>
            <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Liked Campaigns</h1>
            {heartedCampaigns.length > 0 && (
              <p className="text-gray-600 mt-1">{heartedCampaigns.length} {heartedCampaigns.length === 1 ? "campaign" : "campaigns"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {heartedCampaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No liked campaigns yet</p>
          <p className="text-gray-500 text-sm mb-6">Start exploring campaigns and heart the ones you love!</p>
          <Link
            href="/campaigns"
            className="inline-block bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
          >
            Browse Campaigns
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {heartedCampaigns.map((campaign) => {
            const progress = (campaign.raised / campaign.goal) * 100;
            const progressPercentage = Math.min(progress, 100);

            return (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="block"
              >
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-success-500 hover:shadow-md transition-all flex flex-row h-40">
                  {/* Image */}
                  <div className="relative w-64 h-full bg-gray-200 flex-shrink-0">
                    {campaign.image ? (
                      <SafeImage
                        src={campaign.image}
                        alt={campaign.title}
                        fill
                        className="object-cover"
                        sizes="256px"
                        fallback={
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                            <div className="text-primary-600 text-3xl font-bold">
                              {campaign.title.charAt(0)}
                            </div>
                          </div>
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                        <div className="text-primary-600 text-3xl font-bold">
                          {campaign.title.charAt(0)}
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {campaign.verified && (
                        <div className="bg-verified-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleRemoveHeart(campaign.id, e)}
                      className="absolute top-2 left-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors z-10"
                      aria-label="Remove from liked"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2 line-clamp-1">
                        {campaign.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                    </div>

                    <div>
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-primary-600">
                            {formatCurrency(campaign.raised)}
                          </span>
                          <span className="text-gray-500">
                            of {formatCurrency(campaign.goal)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{campaign.backers} backers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{campaign.daysLeft} days left</span>
                        </div>
                        <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                          {campaign.category}
                        </div>
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
