"use client";

import { Permanent_Marker } from "next/font/google";
import CampaignCard from "@/components/CampaignCard";
import { Campaign } from "@/lib/data";
import { getTopCampaignsByFunding } from "@/lib/campaignUtils";
import { fetchCampaignsFromAPI } from "@/lib/services/campaignService";
import SafeImage from "@/components/SafeImage";
import { TrendingUp, FileText, Share2, ArrowUpRight, Shield, DollarSign, Calendar, Users, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";

const permanentMarker = Permanent_Marker({ weight: "400", subsets: ["latin"] });

const HERO_SLIDES = [
  { src: "/hero-right.png", alt: "Community connections" },
  { src: "/hero-right-2.png", alt: "Community connections" },
];

const HOME_FAQS = [
  {
    q: "Whyxxxxxxxxxxxxxxxxx was this crowdfunding platform created?",
    a: "This platform was created because there is a real and growing need for trustworthy financial support within our community. Many individuals and families face urgent situations — medical needs, emergencies, educational expenses, or unexpected hardships — but often struggle to access reliable help.\n\nWe wanted to create a safe, structured, and transparent place where people can give and receive support with confidence.",
  },
  {
    q: "How is this different from asking for help on social media like Facebook?",
    a: "While platforms like Facebook allow people to share needs quickly, it can be difficult to verify whether a situation is authentic. Donors are often left wondering: Is this story true? Are the documents real? Will the money actually go where it's needed?\n\nOur platform provides verification and accountability. Every campaign is reviewed and vetted before being approved, so donors can give with greater trust and peace of mind.",
  },
  {
    q: "How do you ensure campaigns are legitimate?",
    a: "All campaigns go through a vetting process that may include:\n• Verification of identity\n• Review of supporting documents\n• Direct communication with the applicant\n• Confirmation of medical, educational, or emergency documentation (when applicable)\n\nWe aim to ensure that every campaign is authentic and truthful before it is published.",
  },
  {
    q: "Why is trust so important?",
    a: "Trust is the foundation of generosity. When donors feel confident that their contributions are going to a real and verified need, they are more willing to give.\n\nThis platform exists to build that trust — protecting both donors and recipients.",
  },
  {
    q: "Who can start a campaign?",
    a: "Individuals, families, or representatives seeking assistance for legitimate and verifiable needs may apply. Each request is reviewed before approval.",
  },
  {
    q: "How do donors know their money is used properly?",
    a: "We encourage:\n• Clear goal amounts\n• Updates from campaign organizers\n• Documentation of how funds are used\n• Ongoing communication\n\nTransparency is a core value of this platform.",
  },
  {
    q: "What kinds of needs can be supported?",
    a: "Examples include:\n• Medical expenses\n• Emergency housing needs\n• Funeral costs\n• Educational support\n• Disaster recovery\n• Community projects\n\nEach campaign is evaluated individually to ensure it aligns with our guidelines.",
  },
  {
    q: "What is the mission of this platform?",
    a: "Our mission is simple: To connect real needs with real generosity — through a trusted, verified, and transparent system that strengthens our community.",
  },
];

export default function Home() {
  const { content: siteContent } = useSiteContent();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const trendingScrollRef = useRef<HTMLDivElement>(null);
  const [trendingCanScrollLeft, setTrendingCanScrollLeft] = useState(false);
  const [trendingCanScrollRight, setTrendingCanScrollRight] = useState(false);

  const updateTrendingScrollState = () => {
    const el = trendingScrollRef.current;
    if (!el) return;
    setTrendingCanScrollLeft(el.scrollLeft > 0);
    setTrendingCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    const page = Math.min(totalPages, Math.round(el.scrollLeft / TRENDING_PAGE_WIDTH) + 1);
    setCurrentPage((p) => (page >= 1 && page <= totalPages ? page : p));
  };

  useEffect(() => {
    const t = setInterval(() => {
      setHeroSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function loadCampaigns() {
      setCampaignsError(null);
      try {
        const fetchedCampaigns = await fetchCampaignsFromAPI({ trending: true });
        setCampaigns(fetchedCampaigns);
      } catch (error) {
        console.error("Error loading campaigns:", error);
        const message = error instanceof Error ? error.message : "Campaigns could not be loaded. Check Firebase is connected.";
        setCampaignsError(message);
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  const allTrendingCampaigns = getTopCampaignsByFunding(campaigns, 12);
  const cardsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(allTrendingCampaigns.length / cardsPerPage));
  const TRENDING_PAGE_WIDTH = 280 * cardsPerPage + 24 * (cardsPerPage - 1); // card w + gap

  const [currentPage, setCurrentPage] = useState(1);

  const scrollTrendingToPage = (page: number) => {
    const el = trendingScrollRef.current;
    if (!el) return;
    const left = (page - 1) * TRENDING_PAGE_WIDTH;
    el.scrollTo({ left, behavior: "smooth" });
    setCurrentPage(page);
  };

  useEffect(() => {
    const el = trendingScrollRef.current;
    const onScroll = () => updateTrendingScrollState();
    const runAfterLayout = () => updateTrendingScrollState();
    runAfterLayout();
    const t = setTimeout(runAfterLayout, 100);
    if (el) {
      el.addEventListener("scroll", onScroll);
    }
    window.addEventListener("resize", onScroll);
    return () => {
      clearTimeout(t);
      if (el) el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when list length changes
  }, [allTrendingCampaigns.length]);

  const scrollTrending = (direction: "left" | "right") => {
    const el = trendingScrollRef.current;
    if (!el) return;
    const step = el.clientWidth;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <>
      {/* First viewport: hero + Community Shares Burdens heading visible */}
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 container mx-auto px-4 py-8 md:py-12 flex flex-col justify-center">
          {/* Hero Section - Two column layout */}
          <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Decorative shapes */}
          <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-success-200/60 -z-10" aria-hidden />
          <div className="absolute bottom-32 right-20 w-32 h-32 rounded-full bg-primary-100/50 -z-10" aria-hidden />
          <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-accent-100/40 -z-10" aria-hidden />

          {/* Left: Content */}
          <div className="order-2 lg:order-1 mt-14 sm:mt-16 lg:mt-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 mb-4">
              {siteContent.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl">
              {siteContent.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href="/campaigns/create"
                className="inline-flex justify-center bg-primary-600 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors shadow-lg"
              >
                Start a Campaign
              </Link>
              <Link
                href="/campaigns"
                className="inline-flex justify-center border-2 border-gray-800 text-gray-800 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Browse Campaigns
              </Link>
            </div>
            <div className="mt-6">
              <Link
                href="/how-it-works"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium underline"
              >
                Learn how it works →
              </Link>
            </div>
            <div className="mt-16 pt-8 border-t border-gray-200">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Trusted by Belizeans</p>
              <div className="flex items-center gap-6 text-gray-400 text-sm">
                <span className="font-medium text-gray-600">Communities</span>
                <span className="text-gray-300">|</span>
                <span className="font-medium text-gray-600">Charities</span>
                <span className="text-gray-300">|</span>
                <span className="font-medium text-gray-600">Individuals</span>
              </div>
            </div>
            <div className="mt-8 flex justify-start">
              <a href="#community-wins" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Scroll down">
                <ChevronDown className="w-8 h-8" />
              </a>
            </div>
          </div>

          {/* Right: Hero image slider (2s delay, loop) */}
          <div className="order-1 lg:order-2 flex justify-center items-start relative max-w-md w-full aspect-[4/3] min-h-[240px]">
            {HERO_SLIDES.map((slide, i) => (
              <div
                key={slide.src}
                className="absolute inset-0 transition-opacity duration-500 ease-in-out"
                style={{ opacity: heroSlideIndex === i ? 1 : 0 }}
                aria-hidden={heroSlideIndex !== i}
              >
                <SafeImage
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full h-full object-contain block"
                />
              </div>
            ))}
          </div>
        </section>
        </div>

        {/* Community Shares Burdens - visible at bottom of first viewport */}
        <section id="community-shares-burdens" className="flex-shrink-0 -mt-[40px] pt-4 pb-8 md:pb-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-center break-words max-w-full px-2">
              <span className="text-primary-600">{siteContent.communityHeadingPart1}</span>
              <span className={`text-success-600 ${permanentMarker.className}`}>{siteContent.communityHeadingPart2}</span>
            </h2>
          </div>
        </section>
      </div>

      {/* Trending Campaigns */}
      <section className="mb-12 relative py-8 md:py-12 overflow-hidden bg-white">
        <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-medium text-gray-900">Trending Campaigns</h2>
              <div className="bg-success-100 text-success-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shrink-0">
                <TrendingUp className="w-3 h-3" />
                TRENDING
              </div>
            </div>
            <div className="hidden md:block flex-1 min-w-[60px] h-px bg-gray-200" />
          </div>
          <span className="text-gray-600 font-medium text-sm whitespace-nowrap self-start sm:self-auto">
            {allTrendingCampaigns.length} {allTrendingCampaigns.length === 1 ? "campaign" : "campaigns"}
          </span>
        </div>
        <p className="text-gray-600 mb-6">
          Campaigns gaining momentum and support from the community
        </p>

        {campaignsError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <p className="font-medium">{campaignsError}</p>
            <p className="text-sm mt-1">
              <a href="/api/firebase-check" className="underline" target="_blank" rel="noopener noreferrer">Check Firebase connection</a>
              {" · "}
              <a href="/campaigns" className="underline">Try campaigns page</a>
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex gap-4 md:gap-6 py-2 justify-center md:justify-start min-h-[340px] items-center">
            <div className="animate-pulse flex-shrink-0 w-[85vw] max-w-[340px] md:w-[280px] h-[500px] rounded-lg bg-gray-100" />
            <div className="animate-pulse flex-shrink-0 w-[85vw] max-w-[340px] md:w-[280px] h-[500px] rounded-lg bg-gray-100 hidden sm:block" />
            <div className="animate-pulse flex-shrink-0 w-[280px] h-[500px] rounded-lg bg-gray-100 hidden md:block" />
            <div className="animate-pulse flex-shrink-0 w-[280px] h-[500px] rounded-lg bg-gray-100 hidden lg:block" />
          </div>
        )}

        {!isLoading && allTrendingCampaigns.length === 0 && !campaignsError && (
          <div className="py-12 text-center text-gray-500">
            <p className="font-medium text-gray-700">No trending campaigns yet</p>
            <p className="text-sm mt-1">Check back soon or browse all campaigns.</p>
            <Link href="/campaigns" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium underline">
              Browse all campaigns →
            </Link>
          </div>
        )}

        {/* Mobile: horizontal carousel, equal-height cards */}
        {!isLoading && allTrendingCampaigns.length > 0 && (
        <div className="md:hidden -mx-4 px-4 mb-6">
          <div className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory scrollbar-hide">
            <div className="flex gap-4 pb-2">
              {allTrendingCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex-shrink-0 w-[85vw] max-w-[340px] h-[500px] snap-center snap-always"
                >
                  <div className="h-full rounded-lg border border-gray-200 hover:border-verified-500 active:scale-[0.98] transition-all duration-200 overflow-hidden bg-white">
                    <CampaignCard campaign={campaign} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Desktop: swipeable carousel with side arrows, equal-height cards */}
        {!isLoading && allTrendingCampaigns.length > 0 && (
        <div className="hidden md:block relative">
          {/* Left arrow */}
          <button
            type="button"
            onClick={() => scrollTrending("left")}
            disabled={!trendingCanScrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-12 h-12 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-success-500 hover:text-success-600 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Previous campaigns"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          {/* Right arrow */}
          <button
            type="button"
            onClick={() => scrollTrending("right")}
            disabled={!trendingCanScrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-12 h-12 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-success-500 hover:text-success-600 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Next campaigns"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div
            ref={trendingScrollRef}
            className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-2 px-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex gap-6 py-2">
              {allTrendingCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex-shrink-0 w-[280px] h-[500px] snap-start rounded-lg border border-gray-200 hover:border-verified-500 hover:shadow-[rgba(17,12,46,0.15)_0px_48px_100px_0px] hover:scale-[1.02] transition-all duration-300 overflow-hidden bg-white"
                >
                  <CampaignCard campaign={campaign} />
                </div>
              ))}
            </div>
          </div>

          {/* Pagination numbers (desktop only) */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => scrollTrendingToPage(page)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-medium transition-colors ${
                    currentPage === page
                      ? "bg-success-500 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? "true" : undefined}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
        )}

        <div className="text-center mt-6">
          <Link
            href="/campaigns?filter=trending"
            className="inline-block bg-success-500 text-white px-8 py-3 rounded-full font-medium hover:bg-success-600 transition-colors shadow-md"
          >
            View All Trending Campaigns →
          </Link>
        </div>
        </div>
      </section>

      {/* CTA Banner */}
      <div className="container mx-auto px-4 mb-12">
        <section className="bg-gradient-to-r from-success-500 to-success-600 rounded-2xl border border-gray-200 py-12 md:py-16 shadow-lg">
          <div className="text-center px-6">
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-6">Ready to Start A Campaign?</h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of Belizeans making a difference. Create your campaign today and start receiving support from your community.
            </p>
            <Link
              href="/campaigns/create"
              className="inline-block bg-white text-success-600 px-8 py-4 rounded-full font-medium hover:bg-white/90 transition-colors shadow-lg text-lg"
            >
              Start Campaign
            </Link>
          </div>
        </section>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium mb-4 break-words px-2">
            <span className="text-success-600">Accessible.</span>{" "}
            <span className="text-success-600">Accountable.</span>{" "}
            <span className="text-success-600">Transformative.</span>{" "}
            <span className="text-gray-900">For Belizeans</span>
          </h2>
        </div>

        {/* How Fundraising Works & Campaigns Needing Support */}
        <section className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* How Fundraising Works */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 md:p-8 shadow-lg">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-medium mb-4 text-white">How Fundraising Works</h2>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white font-medium">
                  Create your campaign with your story, goal, and images.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center">
                  <Share2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white font-medium">
                  Share it with your community and beyond.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center">
                  <ArrowUpRight className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white font-medium">
                  Grow impact as donations come in and hope multiplies.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white font-medium">
                  Verify. Every campaign checked, every donation secure.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white font-medium">
                  Receive payouts securely, with full transparency.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <Link
              href="/campaigns/create"
              className="inline-block bg-white text-primary-600 px-6 py-3 rounded-full font-medium hover:bg-white/90 transition-colors shadow-lg"
            >
              Start Your Campaign Today
            </Link>
          </div>
        </div>

        {/* Campaigns Needing Support */}
        <div className="bg-gradient-to-br from-success-500 to-success-600 rounded-2xl border border-gray-200 p-6 md:p-8 shadow-lg flex flex-col">
          <h2 className="text-3xl md:text-4xl font-medium mb-6 text-white">Campaigns Needing Support</h2>
          <div className="flex flex-col flex-1 gap-4">
            {campaigns.slice(0, 4).map((campaign) => {
              const progress = (campaign.raised / campaign.goal) * 100;
              const progressPercentage = Math.min(progress, 100);
              return (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="flex-1 block overflow-visible">
                  <div className="bg-white/90 rounded-lg overflow-visible hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-white/30 h-full">
                    <div className="flex h-full overflow-hidden rounded-lg">
                      {/* Compact Image */}
                      <div className="relative w-24 flex-shrink-0 bg-gray-200 overflow-hidden h-full rounded-l-lg">
                        {campaign.image ? (
                          <div className="absolute inset-0">
                            <SafeImage
                              src={campaign.image}
                              alt={campaign.title}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                            <div className="text-primary-600 text-xl font-medium">
                              {campaign.title.charAt(0)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Compact Content */}
                      <div className="flex-1 p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-1 flex-1">{campaign.title}</h3>
                          {campaign.verified && (
                            <div className="bg-success-500 text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1 mb-2">{campaign.description}</p>
                        
                        {/* Compact Progress */}
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-primary-600">{formatCurrency(campaign.raised)}</span>
                            <span className="text-gray-500">{formatCurrency(campaign.goal)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-primary-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Compact Stats */}
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{campaign.backers}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{campaign.daysLeft}d</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/campaigns"
              className="inline-block text-white hover:text-white/90 font-medium text-sm underline"
            >
              View All Campaigns →
            </Link>
          </div>
        </div>
      </section>

        {/* Frequently Asked Questions */}
        <section className="mb-12 bg-success-50 rounded-2xl p-6 md:p-8" aria-label="Frequently asked questions">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-8 text-center" style={{ color: "#111827" }}>
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {HOME_FAQS.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-primary-200 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpenIndex(faqOpenIndex === index ? null : index)}
                  aria-expanded={faqOpenIndex === index}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ color: "#111827" }}
                >
                  <span className="pr-2">{faq.q}</span>
                  {faqOpenIndex === index ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0 text-primary-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0 text-gray-400" />
                  )}
                </button>
                {faqOpenIndex === index && (
                  <div id={`faq-answer-${index}`} className="px-5 pb-5 pt-0" role="region" aria-labelledby={`faq-question-${index}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#4b5563" }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/faq"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm underline"
            >
              View all FAQs →
            </Link>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl border border-gray-200 p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-medium text-primary-600 mb-2">BZ$2.5M+</div>
              <div className="text-gray-600">Raised</div>
            </div>
            <div>
              <div className="text-4xl font-medium text-primary-600 mb-2">1,200+</div>
              <div className="text-gray-600">Campaigns</div>
            </div>
            <div>
              <div className="text-4xl font-medium text-primary-600 mb-2">15K+</div>
              <div className="text-gray-600">Supporters</div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
