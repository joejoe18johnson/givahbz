"use client";

import { Permanent_Marker } from "next/font/google";
import CampaignCard from "@/components/CampaignCard";
import { Campaign } from "@/lib/data";
import { getTrendingCampaigns } from "@/lib/campaignUtils";
import { fetchCampaigns } from "@/lib/services/campaignService";
import SafeImage from "@/components/SafeImage";
import { TrendingUp, FileText, Share2, ArrowUpRight, Shield, DollarSign, Calendar, Users, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";

const permanentMarker = Permanent_Marker({ weight: "400", subsets: ["latin"] });

const HOME_FAQS = [
  {
    q: "Why was this crowdfunding platform created?",
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const fetchedCampaigns = await fetchCampaigns({ trending: true });
        setCampaigns(fetchedCampaigns);
      } catch (error) {
        console.error("Error loading campaigns:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  const allTrendingCampaigns = getTrendingCampaigns(campaigns, campaigns.length);
  const cardsPerPage = 4;
  const totalPages = Math.ceil(allTrendingCampaigns.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const trendingCampaigns = allTrendingCampaigns.slice(startIndex, endIndex);

  return (
    <>
      {/* First viewport: hero + Community Wins heading visible */}
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 container mx-auto px-4 py-8 md:py-12 flex flex-col justify-center">
          {/* Hero Section - Two column layout */}
          <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Decorative shapes */}
          <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-success-200/60 -z-10" aria-hidden />
          <div className="absolute bottom-32 right-20 w-32 h-32 rounded-full bg-primary-100/50 -z-10" aria-hidden />
          <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-accent-100/40 -z-10" aria-hidden />

          {/* Left: Content */}
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 mb-4">
              Supporting{" "}
              <span className={`text-success-600 ${permanentMarker.className}`}>Belizean</span>{" "}
              Communities
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl">
              Life is either a daring adventure or nothing. Help real people and causes across Belize—verified, transparent, and community-driven.
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

          {/* Right: Image at natural size, top-aligned and centered */}
          <div className="order-1 lg:order-2 flex justify-center items-start">
            <SafeImage
              src="/hero-right.png"
              alt="Community connections"
              className="max-w-md w-full h-auto block"
            />
          </div>
        </section>
        </div>

        {/* Community Wins - visible at bottom of first viewport */}
        <section id="community-wins" className="flex-shrink-0 -mt-[40px] pt-4 pb-8 md:pb-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-center break-words max-w-full px-2">
              <span className="text-primary-600">Community Wins.</span>{" "}
              <span className={`text-success-600 ${permanentMarker.className}`}>Always.</span>
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
          <a
            href="/campaigns?filter=trending"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm whitespace-nowrap underline self-start sm:self-auto"
          >
            View All →
          </a>
        </div>
        <p className="text-gray-600 mb-6">
          Campaigns gaining momentum and support from the community
        </p>

        {/* Mobile: horizontal carousel — allows both horizontal and vertical scrolling */}
        <div className="md:hidden -mx-4 px-4 mb-6">
          <div className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory scrollbar-hide">
          <div className="flex gap-4 pb-2">
            {allTrendingCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex-shrink-0 w-[85vw] max-w-[340px] snap-center snap-always"
              >
                <div className="relative flex flex-col min-w-0 h-full rounded-lg border border-gray-200 hover:border-success-500 active:scale-[0.98] transition-all duration-200 overflow-hidden bg-white">
                  <div className="flex-1 min-w-0 rounded-lg overflow-hidden">
                    <CampaignCard campaign={campaign} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* Desktop: grid + pagination */}
        <div className="hidden md:block">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {trendingCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="relative flex flex-col min-w-0 rounded-lg border border-gray-200 hover:border-success-500 hover:shadow-[rgba(17,12,46,0.15)_0px_48px_100px_0px] hover:scale-[1.02] transition-all duration-300 overflow-visible"
            >
              <div className="flex-1 min-w-0 rounded-lg overflow-hidden">
                <CampaignCard campaign={campaign} />
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    currentPage === page
                      ? "bg-success-500 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        </div>
        
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
        <section className="mb-12 bg-success-50 rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-900 mb-8 text-center">
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
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span className="pr-2">{faq.q}</span>
                  {faqOpenIndex === index ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0 text-primary-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0 text-gray-400" />
                  )}
                </button>
                {faqOpenIndex === index && (
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
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
