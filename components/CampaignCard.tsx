"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SafeImage from "./SafeImage";
import ShareCampaign from "./ShareCampaign";
import { Calendar, Users, CheckCircle2, Heart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toggleHeartCampaign, isCampaignHearted } from "./HeartedCampaigns";
import { useAuth } from "@/contexts/AuthContext";
import { useThemedModal } from "./ThemedModal";

interface Campaign {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatorType?: "individual" | "organization" | "charity";
  goal: number;
  raised: number;
  backers: number;
  daysLeft: number;
  category: string;
  image: string;
  location?: string;
  verified?: boolean;
}

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const [isHearted, setIsHearted] = useState(false);
  const { user } = useAuth();
  const { alert } = useThemedModal();
  const progress = (campaign.raised / campaign.goal) * 100;
  const progressPercentage = Math.min(progress, 100);

  useEffect(() => {
    if (user) {
      setIsHearted(isCampaignHearted(campaign.id));
    }
  }, [campaign.id, user]);

  const handleToggleHeart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("You need to be logged in to save campaigns.", {
        title: "Log in to save campaigns",
        variant: "info",
      });
      return;
    }
    const newState = await toggleHeartCampaign(campaign.id);
    setIsHearted(newState);
  };

  return (
    <Link href={`/campaigns/${campaign.id}`} className="group h-full flex transition-transform duration-300 hover:scale-[1.02]">
      <div className="bg-white rounded-lg border border-gray-200 group-hover:border-success-500 overflow-hidden transition-all duration-300 cursor-pointer flex flex-col w-full h-full min-w-0">
        {/* Image - fixed aspect ratio so all cards show the same size image area */}
        <div className="relative w-full aspect-[16/10] bg-gray-200 overflow-hidden shrink-0">
          {campaign.image ? (
            <div className="absolute inset-0">
              <SafeImage
                src={campaign.image}
                alt={campaign.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                    <div className="text-primary-600 text-4xl font-bold">
                      {campaign.title.charAt(0)}
                    </div>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
              <div className="text-primary-600 text-4xl font-bold">
                {campaign.title.charAt(0)}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-2 left-2 z-10 flex items-center gap-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <ShareCampaign
              campaignId={campaign.id}
              campaignTitle={campaign.title}
              variant="compact"
              className="[&_button]:!bg-white/90"
            />
            <button
              onClick={handleToggleHeart}
              className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg transition-colors flex-shrink-0 ${
                !user
                  ? "bg-white/60 hover:bg-white/80 text-gray-400 cursor-not-allowed"
                  : isHearted
                  ? "bg-red-500/90 hover:bg-red-500 text-white"
                  : "bg-white/90 hover:bg-white text-gray-700"
              }`}
              aria-label={!user ? "Log in to like campaigns" : isHearted ? "Remove from hearted" : "Add to hearted"}
              title={!user ? "Log in to like campaigns" : undefined}
            >
              <Heart className={`w-4 h-4 ${isHearted ? "fill-white" : !user ? "opacity-50" : ""}`} />
            </button>
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            {campaign.verified && (
              <div className="bg-verified-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </div>
            )}
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-primary-600 shadow-lg">
              {campaign.category}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-medium text-gray-900 mb-2 line-clamp-2">{campaign.title}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-primary-600">{formatCurrency(campaign.raised)}</span>
              <span className="text-gray-500">of {formatCurrency(campaign.goal)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{campaign.backers} backers</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{campaign.daysLeft} days left</span>
            </div>
          </div>

          {/* Creator */}
          <div className="pt-4 border-t border-gray-200 mt-auto">
            <p className="text-sm text-gray-600">
              by <span className="font-medium text-gray-900">{campaign.creator}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
