"use client";

import { useState, useCallback, useMemo } from "react";
import { Share2, Link2, MessageCircle, Facebook, Send } from "lucide-react";

interface ShareCampaignProps {
  campaignTitle: string;
  /** Either full URL or campaign id (URL is built from origin + /campaigns/id). */
  campaignUrl?: string;
  campaignId?: string;
  /** Compact: dropdown from a single share icon. Default: full button group. */
  variant?: "compact" | "full";
  className?: string;
}

export default function ShareCampaign({
  campaignTitle,
  campaignUrl: urlProp,
  campaignId,
  variant = "full",
  className = "",
}: ShareCampaignProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const campaignUrl = useMemo(() => {
    if (urlProp) return urlProp;
    if (typeof window !== "undefined" && campaignId)
      return `${window.location.origin}/campaigns/${campaignId}`;
    return campaignId ? `/campaigns/${campaignId}` : "";
  }, [urlProp, campaignId]);

  const absoluteUrl =
    typeof window !== "undefined" && campaignUrl && !campaignUrl.startsWith("http")
      ? `${window.location.origin}${campaignUrl}`
      : campaignUrl;

  const shareText = `${campaignTitle} – support this campaign on GivahBz: ${absoluteUrl || campaignUrl}`;

  const copyLink = useCallback(async () => {
    const urlToCopy = absoluteUrl || campaignUrl;
    if (!urlToCopy) return;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = urlToCopy;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [absoluteUrl, campaignUrl]);

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setOpen(false);
  };

  const shareFacebook = () => {
    const u = absoluteUrl || campaignUrl;
    if (!u) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
    setOpen(false);
  };

  const shareMessenger = () => {
    const u = absoluteUrl || campaignUrl;
    if (!u) return;
    window.open(
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(u)}&redirect_uri=${encodeURIComponent(u)}&display=page`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
    setOpen(false);
  };

  const nativeShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      const u = absoluteUrl || campaignUrl;
      if (!u) return;
      try {
        await navigator.share({
          title: campaignTitle,
          text: "Support this campaign on GivahBz",
          url: u,
        });
        setOpen(false);
      } catch {
        // User cancelled or error
      }
    }
  }, [campaignTitle, absoluteUrl, campaignUrl]);

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const buttons = (
    <>
      <button
        type="button"
        onClick={copyLink}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 text-sm transition-colors w-full text-left"
      >
        <Link2 className="w-4 h-4 flex-shrink-0" />
        {copied ? "Copied!" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={shareWhatsApp}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 text-sm transition-colors w-full text-left"
      >
        <MessageCircle className="w-4 h-4 flex-shrink-0" />
        WhatsApp
      </button>
      <button
        type="button"
        onClick={shareFacebook}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 text-sm transition-colors w-full text-left"
      >
        <Facebook className="w-4 h-4 flex-shrink-0" />
        Facebook
      </button>
      <button
        type="button"
        onClick={shareMessenger}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 text-sm transition-colors w-full text-left"
      >
        <Send className="w-4 h-4 flex-shrink-0" />
        Messenger
      </button>
      {hasNativeShare && (
        <button
          type="button"
          onClick={nativeShare}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 text-sm transition-colors w-full text-left border-t border-gray-100 mt-1 pt-2"
        >
          <Share2 className="w-4 h-4 flex-shrink-0" />
          More options…
        </button>
      )}
    </>
  );

  if (variant === "compact") {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-colors shadow-lg"
          aria-label="Share campaign"
        >
          <Share2 className="w-5 h-5 text-gray-700" />
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            {/* Full-screen centered modal on mobile; dropdown on desktop */}
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:contents"
              onClick={() => setOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Share campaign"
            >
              <div
                className="w-full max-w-md max-h-[100vh] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-xl py-4 md:absolute md:right-0 md:top-full md:mt-2 md:w-56 md:max-w-none md:max-h-none md:py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Share campaign
                </p>
                {buttons}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <p className="text-sm font-medium text-gray-700">Share this campaign</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm transition-colors"
        >
          <Link2 className="w-4 h-4" />
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={shareWhatsApp}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={shareFacebook}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm transition-colors"
        >
          <Facebook className="w-4 h-4" />
          Facebook
        </button>
        <button
          type="button"
          onClick={shareMessenger}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm transition-colors"
        >
          <Send className="w-4 h-4" />
          Messenger
        </button>
        {hasNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm transition-colors"
          >
            <Share2 className="w-4 h-4" />
            More
          </button>
        )}
      </div>
    </div>
  );
}
