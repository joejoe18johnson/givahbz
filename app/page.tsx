"use client";

import CampaignCard from "@/components/CampaignCard";
import { campaigns } from "@/lib/data";
import { getTrendingCampaigns } from "@/lib/campaignUtils";
import SafeImage from "@/components/SafeImage";
import { TrendingUp, FileText, Share2, ArrowUpRight, Shield, DollarSign, Calendar, Users, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

export default function Home() {
  const allTrendingCampaigns = getTrendingCampaigns(campaigns, campaigns.length);
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 4;
  const totalPages = Math.ceil(allTrendingCampaigns.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const trendingCampaigns = allTrendingCampaigns.slice(startIndex, endIndex);

  return (
    <>
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero Section - Two column layout */}
        <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[70vh]">
          {/* Decorative shapes */}
          <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-success-200/60 -z-10" aria-hidden />
          <div className="absolute bottom-32 right-20 w-32 h-32 rounded-full bg-primary-100/50 -z-10" aria-hidden />
          <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-accent-100/40 -z-10" aria-hidden />

          {/* Left: Content */}
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 mb-4">
              Supporting{" "}
              <span className="relative inline-block">
                Belizean
                <span className="absolute bottom-1 left-0 w-full h-1.5 bg-success-500 rounded-full" />
              </span>{" "}
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

      {/* Community Wins Section */}
      <section id="community-wins" className="pt-0 pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-center break-words max-w-full px-2">
            <span className="text-primary-600">Community Wins.</span>{" "}
            <span className="text-success-600">Always.</span>
          </h2>
        </div>
      </section>

      {/* Trending Campaigns */}
      <section className="mb-12 relative py-8 md:py-12 overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-medium text-white">Trending Campaigns</h2>
              <div className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg animate-pulse shrink-0">
                <TrendingUp className="w-3 h-3" />
                TRENDING
              </div>
            </div>
            <div className="hidden md:block flex-1 min-w-[60px] h-px bg-gradient-to-r from-white/30 to-transparent" />
          </div>
          <a
            href="/campaigns?filter=trending"
            className="text-white hover:text-white/90 font-medium text-sm whitespace-nowrap underline self-start sm:self-auto"
          >
            View All →
          </a>
        </div>
        <p className="text-white/90 mb-6">
          Campaigns gaining momentum and support from the community
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {trendingCampaigns.map((campaign) => (
            <div key={campaign.id} className="relative flex flex-col min-w-0">
              <div className="flex-1 min-w-0">
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
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      ? "bg-white text-success-600"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div className="text-center mt-6">
          <Link
            href="/campaigns?filter=trending"
            className="inline-block bg-white text-success-600 px-8 py-3 rounded-full font-medium hover:bg-white/90 transition-colors shadow-lg"
          >
            View All Trending Campaigns →
          </Link>
        </div>
        </div>
      </section>

      {/* CTA Banner */}
      <div className="container mx-auto px-4 mb-12">
        <section className="bg-gradient-to-r from-success-500 to-success-600 rounded-2xl py-12 md:py-16 shadow-lg">
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
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
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
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
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
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
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
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
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
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
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
        <div className="bg-gradient-to-br from-success-500 to-success-600 rounded-2xl p-6 md:p-8 shadow-lg flex flex-col">
          <h2 className="text-3xl md:text-4xl font-medium mb-6 text-white">Campaigns Needing Support</h2>
          <div className="flex flex-col flex-1 gap-4">
            {campaigns.slice(0, 4).map((campaign) => {
              const progress = (campaign.raised / campaign.goal) * 100;
              const progressPercentage = Math.min(progress, 100);
              return (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="flex-1">
                  <div className="bg-white/90 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-white/30 h-full">
                    <div className="flex h-full">
                      {/* Compact Image */}
                      <div className="relative w-24 flex-shrink-0 bg-gray-200 overflow-hidden h-full">
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

        {/* Stats Section */}
        <section className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-8 mb-12">
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
