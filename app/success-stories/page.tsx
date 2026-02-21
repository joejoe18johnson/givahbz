"use client";

import CampaignCard from "@/components/CampaignCard";
import { Campaign } from "@/lib/data";
import { fetchCampaignsFromAPI } from "@/lib/services/campaignService";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";

export default function SuccessStoriesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const all = await fetchCampaignsFromAPI();
        const goal = (c: Campaign) => Number(c.goal) || 1;
        const raised = (c: Campaign) => Number(c.raised) || 0;
        const fullyFunded = all.filter((c) => goal(c) > 0 && raised(c) >= goal(c));
        setCampaigns(fullyFunded);
      } catch (err) {
        console.error("Error loading success stories:", err);
        setError("Unable to load campaigns. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-medium flex items-center gap-3 text-gray-900">
          <Trophy className="w-10 h-10 text-verified-600" />
          Success Stories
        </h1>
        <p className="text-gray-600 mt-2 max-w-2xl">
          Campaigns that reached their full funding goal thanks to our community. Celebrate their success and get inspired.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-800">{error}</p>
          <Link href="/campaigns" className="inline-block mt-4 text-primary-600 font-medium hover:underline">
            Browse all campaigns
          </Link>
        </div>
      )}

      {!isLoading && !error && campaigns.length === 0 && (
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">No success stories yet</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            When campaigns reach their full funding goal, they’ll appear here. Be the first to help a campaign get fully funded.
          </p>
          <Link
            href="/campaigns"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors"
          >
            Browse campaigns
          </Link>
        </div>
      )}

      {!isLoading && !error && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id}>
              <CampaignCard campaign={campaign} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
