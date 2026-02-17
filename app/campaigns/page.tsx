"use client";

import CampaignCard from "@/components/CampaignCard";
import { campaigns } from "@/lib/data";
import { getTrendingCampaigns } from "@/lib/campaignUtils";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TrendingUp } from "lucide-react";

function CampaignsContent() {
  const categories = ["All", "Medical", "Education", "Disaster Relief", "Community", "Emergency", "Other"];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showTrending, setShowTrending] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter === "trending") {
      setShowTrending(true);
      setSelectedCategory("All");
    }
  }, [searchParams]);

  let filteredCampaigns =
    selectedCategory === "All"
      ? campaigns
      : campaigns.filter((c) => c.category === selectedCategory);

  if (showTrending) {
    filteredCampaigns = getTrendingCampaigns(filteredCampaigns, filteredCampaigns.length);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-medium">
          {showTrending ? (
            <span className="flex items-center gap-3">
              <TrendingUp className="w-10 h-10 text-primary-600" />
              Trending Campaigns
            </span>
          ) : (
            "All Campaigns"
          )}
        </h1>
        {showTrending && (
          <button
            onClick={() => setShowTrending(false)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All Campaigns
          </button>
        )}
      </div>

      {/* Category Filter */}
      {!showTrending && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category
                  ? "bg-success-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {showTrending && (
        <p className="text-gray-600 mb-6">
          Campaigns gaining momentum and support from the community, sorted by trending score.
        </p>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => (
          <div key={campaign.id} className="relative">
            {showTrending && (
              <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                <TrendingUp className="w-3 h-3" />
                TRENDING
              </div>
            )}
            <CampaignCard campaign={campaign} />
          </div>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No campaigns found in this category.</p>
        </div>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    }>
      <CampaignsContent />
    </Suspense>
  );
}
