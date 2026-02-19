"use client";

import { useState, useEffect } from "react";
import { Campaign } from "@/lib/data";
import { fetchCampaign } from "@/lib/services/campaignService";
import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { Calendar, Users, Heart, CheckCircle2 } from "lucide-react";
import CampaignDonateSection from "@/components/CampaignDonateSection";
import CampaignUpdates from "@/components/CampaignUpdates";
import RewardsSection from "@/components/RewardsSection";
import ProofDocuments from "@/components/ProofDocuments";
import ShareCampaign from "@/components/ShareCampaign";
import DonorsList from "@/components/DonorsList";
import { formatCurrency } from "@/lib/utils";
import { toggleHeartCampaign, isCampaignHearted } from "@/components/HeartedCampaigns";
import { useAuth } from "@/contexts/AuthContext";
import { useThemedModal } from "@/components/ThemedModal";

interface PageProps {
  params: {
    id: string;
  };
}

export default function CampaignPage({ params }: PageProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHearted, setIsHearted] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);
  const { user } = useAuth();
  const { alert } = useThemedModal();

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
      alert("You need to be logged in to save campaigns.", {
        title: "Log in to save campaigns",
        variant: "info",
      });
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
        {/* Cover section: title, media, creator — image height matches sidebar (~same as right card) */}
        <div className="min-w-0 flex flex-col gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {campaign.title}
          </h1>

          {/* Mobile: carousel with dots */}
          {(() => {
            const image1 = campaign.image;
            const image2 = campaign.image2 ?? campaign.image;
            const slides = [image1, image2];
            const fallbackContent = () => (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                <span className="text-primary-600 text-5xl font-medium opacity-20">
                  {campaign.title.charAt(0)}
                </span>
              </div>
            );
            return (
              <>
                <div className="sm:hidden w-full min-w-0 h-[220px] rounded-xl overflow-hidden relative">
                  <div
                    className="flex h-full transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${coverIndex * 100}%)` }}
                  >
                    {slides.map((src, i) => (
                      <div
                        key={i}
                        className="relative flex-shrink-0 w-full h-full bg-gray-200"
                        style={{ minWidth: "100%" }}
                      >
                        {src ? (
                          <SafeImage
                            src={src}
                            alt={`${campaign.title} (${i + 1})`}
                            fill
                            className="object-cover"
                            sizes="100vw"
                            priority={i === 0}
                            fallback={fallbackContent()}
                          />
                        ) : (
                          fallbackContent()
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
                          <ShareCampaign
                            campaignId={campaign.id}
                            campaignTitle={campaign.title}
                            variant="compact"
                          />
                          <button
                            onClick={handleToggleHeart}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors flex-shrink-0 ${
                              !user
                                ? "bg-white/60 hover:bg-white/80 text-gray-400 cursor-not-allowed"
                                : isHearted
                                ? "bg-white/90 text-red-500"
                                : "bg-white/90 text-gray-700 hover:bg-white"
                            }`}
                            aria-label={!user ? "Log in to like campaigns" : isHearted ? "Remove from hearted" : "Add to hearted"}
                          >
                            <Heart className={`w-5 h-5 ${isHearted ? "fill-red-500" : !user ? "opacity-50" : ""}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCoverIndex(i)}
                        className="pointer-events-auto w-2.5 h-2.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                        style={{
                          backgroundColor: coverIndex === i ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
                        }}
                        aria-label={`Go to image ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Desktop: two-column grid */}
                <div className="hidden sm:grid grid-cols-2 gap-4 sm:gap-6 w-full min-w-0 h-[260px] lg:h-[400px]">
                  <div className="relative w-full h-full min-w-0 bg-gray-200 rounded-xl overflow-hidden">
                    {campaign.image ? (
                      <SafeImage
                        src={campaign.image}
                        alt={campaign.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 50vw, 30vw"
                        priority
                        fallback={
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                            <span className="text-primary-600 text-5xl font-medium opacity-20">
                              {campaign.title.charAt(0)}
                            </span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                        <span className="text-primary-600 text-5xl font-medium opacity-20">
                          {campaign.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="relative w-full h-full min-w-0 bg-gray-200 rounded-xl overflow-hidden">
                    {(campaign.image2 ?? campaign.image) ? (
                      <SafeImage
                        src={campaign.image2 ?? campaign.image}
                        alt={`${campaign.title} (2)`}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 1024px) 50vw, 30vw"
                        fallback={
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-300 to-primary-500">
                            <span className="text-primary-700 text-5xl font-medium opacity-20">
                              {campaign.title.charAt(0)}
                            </span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-300 to-primary-500">
                        <span className="text-primary-700 text-5xl font-medium opacity-20">
                          {campaign.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-2 pointer-events-auto">
                      <ShareCampaign
                        campaignId={campaign.id}
                        campaignTitle={campaign.title}
                        variant="compact"
                      />
                      <button
                        onClick={handleToggleHeart}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg transition-colors flex-shrink-0 ${
                          !user
                            ? "bg-white/60 hover:bg-white/80 text-gray-400 cursor-not-allowed"
                            : isHearted
                            ? "bg-white/90 text-red-500"
                            : "bg-white/90 text-gray-700 hover:bg-white"
                        }`}
                        aria-label={!user ? "Log in to like campaigns" : isHearted ? "Remove from hearted" : "Add to hearted"}
                        title={!user ? "Log in to like campaigns" : undefined}
                      >
                        <Heart className={`w-5 h-5 ${isHearted ? "fill-red-500" : !user ? "opacity-50" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-semibold text-sm">
              {campaign.creator.charAt(0)}
            </div>
            <p className="text-gray-700 font-medium">
              {campaign.creator}
              {campaign.location && (
                <span className="text-gray-500 font-normal text-sm ml-1.5">
                  · {campaign.location}
                </span>
              )}
            </p>
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

        {/* Main content: category, description, etc. (order-2 on mobile so it appears before sidebar) */}
        <div className="order-2 lg:order-3 min-w-0">
          {/* Category Badge and Verification */}
          <div className="mb-4 flex items-center gap-3 flex-wrap">
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
