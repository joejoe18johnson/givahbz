"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Heart } from "lucide-react";
import { campaigns, type Campaign } from "@/lib/data";
import SafeImage from "./SafeImage";
import { formatCurrency } from "@/lib/utils";
import { Users, Calendar, CheckCircle2 } from "lucide-react";

interface HeartedCampaignsProps {
  isOpen: boolean;
  onClose: () => void;
}

import { getHeartedCampaignIds as getHeartedIdsFromFirestore, toggleHeartCampaign as toggleHeartInFirestore } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

// Legacy localStorage functions for backward compatibility (will be removed)
export function getHeartedCampaignIds(): string[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("hearted_campaigns");
  return stored ? JSON.parse(stored) : [];
}

export async function toggleHeartCampaign(campaignId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  // Try to use Firestore if user is logged in
  const storedUser = localStorage.getItem("belizeFund_user");
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      if (userData.id) {
        return await toggleHeartInFirestore(userData.id, campaignId);
      }
    } catch (e) {
      // Fall back to localStorage
    }
  }
  
  // Fallback to localStorage for non-authenticated users
  const hearted = getHeartedCampaignIds();
  const index = hearted.indexOf(campaignId);
  
  if (index > -1) {
    hearted.splice(index, 1);
  } else {
    hearted.push(campaignId);
  }
  
  localStorage.setItem("hearted_campaigns", JSON.stringify(hearted));
  // Dispatch custom event to notify other components
  window.dispatchEvent(new Event("heartedCampaignsChanged"));
  return index === -1; // Returns true if added, false if removed
}

export function isCampaignHearted(campaignId: string): boolean {
  return getHeartedCampaignIds().includes(campaignId);
}

export default function HeartedCampaigns({ isOpen, onClose }: HeartedCampaignsProps) {
  const [heartedIds, setHeartedIds] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const updateHeartedIds = () => {
    setHeartedIds(getHeartedCampaignIds());
  };

  useEffect(() => {
    if (isOpen) {
      async function loadCampaigns() {
        setIsLoading(true);
        try {
          const fetchedCampaigns = await fetchCampaigns();
          setCampaigns(fetchedCampaigns);
        } catch (error) {
          console.error("Error loading campaigns:", error);
        } finally {
          setIsLoading(false);
        }
      }
      loadCampaigns();
      updateHeartedIds();
      // Listen for changes when modal is open
      window.addEventListener("heartedCampaignsChanged", updateHeartedIds);
      return () => {
        window.removeEventListener("heartedCampaignsChanged", updateHeartedIds);
      };
    }
  }, [isOpen]);

  const heartedCampaigns = campaigns.filter((campaign) => heartedIds.includes(campaign.id));

  const handleRemoveHeart = (campaignId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleHeartCampaign(campaignId);
    setHeartedIds(getHeartedCampaignIds());
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              <h2 className="text-2xl font-medium text-gray-900">Hearted Campaigns</h2>
              {heartedCampaigns.length > 0 && (
                <span className="text-sm text-gray-500">({heartedCampaigns.length})</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {heartedCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No hearted campaigns yet</p>
                <p className="text-gray-500 text-sm">Start exploring campaigns and heart the ones you love!</p>
                <Link
                  href="/campaigns"
                  onClick={onClose}
                  className="inline-block mt-4 bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
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
                      onClick={onClose}
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
                            className="absolute top-2 left-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                            aria-label="Remove from hearted"
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
        </div>
      </div>
    </>
  );
}
