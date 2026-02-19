"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Campaign } from "@/lib/data";
import { fetchCampaign } from "@/lib/services/campaignService";
import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { Calendar, MapPin, Users, Heart, CheckCircle2 } from "lucide-react";
import CampaignDonateSection from "@/components/CampaignDonateSection";
import CampaignUpdates from "@/components/CampaignUpdates";
import RewardsSection from "@/components/RewardsSection";
import ProofDocuments from "@/components/ProofDocuments";
import ShareCampaign from "@/components/ShareCampaign";
import DonorsList from "@/components/DonorsList";
import { formatCurrency } from "@/lib/utils";
import { toggleHeartCampaign, isCampaignHearted } from "@/components/HeartedCampaigns";
import { useAuth } from "@/contexts/AuthContext";

interface PageProps {
  params: {
    id: string;
  };
}

export default function CampaignPage({ params }: PageProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHearted, setIsHearted] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadCampaign() {
      try {
        const fetchedCampaign = await fetchCampaign(params.id);
        if (fetchedCampaign) {
          setCampaign(fetchedCampaign);
        }
      } catch (error) {
        console.error("Error loading campaign:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaign();
  }, [params.id]);

  useEffect(() => {
    if (campaign && user) {
      setIsHearted(isCampaignHearted(campaign.id));
    }
  }, [campaign, user]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    notFound();
  }

  const progress = (campaign.raised / campaign.goal) * 100;
  const progressPercentage = Math.min(progress, 100);

  const handleToggleHeart = async () => {
    if (!user) {
      router.push("/auth/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (campaign) {
      const newState = await toggleHeartCampaign(campaign.id);
      setIsHearted(newState);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Single grid: on mobile = image, then content, then sidebar. On desktop = image+content left, sidebar right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-4 lg:gap-6">
        {/* Hero Image */}
        <div className="relative h-72 lg:h-96 w-full min-w-0 bg-gray-200 rounded-2xl overflow-hidden">
          {campaign.image ? (
            <div className="absolute inset-0">
              <SafeImage
                src={campaign.image}
                alt={campaign.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, (min-width: 1025px) 60vw, 576px"
                priority
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                    <div className="text-primary-600 text-8xl font-medium opacity-20">
                      {campaign.title.charAt(0)}
                    </div>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
              <div className="text-primary-600 text-8xl font-medium opacity-20">
                {campaign.title.charAt(0)}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            <ShareCampaign
              campaignId={campaign.id}
              campaignTitle={campaign.title}
              variant="compact"
            />
            <button
              onClick={handleToggleHeart}
              className={`bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-colors shadow-lg ${
                !user
                  ? "bg-white/60 hover:bg-white/80 text-gray-400 cursor-not-allowed"
                  : isHearted
                  ? "text-red-500"
                  : "text-gray-700"
              }`}
              aria-label={!user ? "Log in to like campaigns" : isHearted ? "Remove from hearted" : "Add to hearted"}
              title={!user ? "Log in to like campaigns" : undefined}
            >
              <Heart className={`w-5 h-5 ${isHearted ? "fill-red-500" : !user ? "opacity-50" : ""}`} />
            </button>
          </div>
        </div>

        {/* Stats, Share, Donate - right column on desktop; below content on mobile */}
        <div className="order-3 lg:order-2 w-full lg:row-span-2 lg:self-start">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-24">
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-primary-600">
                  {formatCurrency(campaign.raised)}
                </span>
                <span className="text-gray-500">
                  of {formatCurrency(campaign.goal)} goal
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                {progressPercentage.toFixed(1)}% funded
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5 pb-5 border-b border-gray-200">
              <div>
                <div className="text-lg font-medium text-gray-900">{campaign.backers}</div>
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  backers
                </div>
              </div>
              <div>
                <div className="text-lg font-medium text-gray-900">{campaign.daysLeft}</div>
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  days left
                </div>
              </div>
            </div>
            <ShareCampaign
              campaignId={campaign.id}
              campaignTitle={campaign.title}
              variant="full"
              className="mb-5 pb-5 border-b border-gray-200"
            />
            <CampaignDonateSection campaignId={campaign.id} campaignTitle={campaign.title} />
            {campaign.rewards && campaign.rewards.length > 0 && (
              <RewardsSection rewards={campaign.rewards} />
            )}
          </div>
        </div>

        {/* Main content: directly under image (order-2 on mobile so it appears before sidebar) */}
        <div className="order-2 lg:order-3 min-w-0">
          {/* Category Badge and Verification */}
          <div className="mb-3 flex items-center gap-3 flex-wrap">
            <span className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
              {campaign.category}
            </span>
            {campaign.verified && (
              <div className="bg-verified-100 text-verified-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Verified Campaign
              </div>
            )}
            {campaign.creatorType && (
              <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm">
                {campaign.creatorType === "individual" ? "Individual" : 
                 campaign.creatorType === "organization" ? "Organization" : 
                 "Charity"}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-medium text-gray-900 mb-3">{campaign.title}</h1>

          {/* Creator Info */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center text-primary-700 font-medium">
              {campaign.creator.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{campaign.creator}</p>
              {campaign.location && (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {campaign.location}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="prose max-w-none mb-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              {campaign.fullDescription || campaign.description}
            </p>
          </div>

          {/* Proof Documents */}
          {campaign.proofDocuments && campaign.proofDocuments.length > 0 && (
            <ProofDocuments documents={campaign.proofDocuments} />
          )}

          {/* Updates */}
          {campaign.updates && campaign.updates.length > 0 && (
            <CampaignUpdates updates={campaign.updates} />
          )}
        </div>
      </div>

      {/* Donors List */}
      <div className="mt-8">
        <DonorsList campaignId={campaign.id} />
      </div>
    </div>
  );
}
