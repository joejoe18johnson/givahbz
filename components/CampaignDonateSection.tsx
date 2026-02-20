"use client";

import { useState, useEffect } from "react";
import { isCampaignStopped } from "@/lib/campaignState";
import DonateButton from "./DonateButton";
import { StopCircle } from "lucide-react";

interface CampaignDonateSectionProps {
  campaignId: string;
  campaignTitle: string;
  onDonationModalChange?: (open: boolean) => void;
}

export default function CampaignDonateSection({
  campaignId,
  campaignTitle,
  onDonationModalChange,
}: CampaignDonateSectionProps) {
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    setStopped(isCampaignStopped(campaignId));
  }, [campaignId]);

  if (stopped) {
    return (
      <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-amber-800 font-medium flex items-center gap-2">
          <StopCircle className="w-5 h-5 flex-shrink-0" />
          This campaign has been stopped by the organizer. Donations are no longer accepted.
        </p>
      </div>
    );
  }

  return (
    <DonateButton
      campaignId={campaignId}
      campaignTitle={campaignTitle}
      onDonationModalChange={onDonationModalChange}
    />
  );
}
