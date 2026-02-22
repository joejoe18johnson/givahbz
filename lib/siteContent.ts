/**
 * Editable site content (admin "Edit site info").
 * Stored in Firestore siteConfig/content; fallback to these defaults when empty.
 */
export interface SiteContent {
  siteName: string;
  heroTitle: string;
  heroSubtitle: string;
  communityHeadingPart1: string;
  communityHeadingPart2: string;
  footerTagline: string;
  footerCopyright: string;
  aboutTitle: string;
  aboutSubtitle: string;
  aboutMission: string;
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  siteName: "GivahBz",
  heroTitle: "Supporting Belizean Communities",
  heroSubtitle: "Life is either a daring adventure or nothing. Help real people and causes across Belize—verified, transparent, and community-driven.",
  communityHeadingPart1: "Community Shares ",
  communityHeadingPart2: "Burdens",
  footerTagline: "Supporting organizations, charities, and individuals in need across Belize. All campaigns are verified with proof of need.",
  footerCopyright: "© 2026 GivahBz. All rights reserved. | Serving Belize",
  aboutTitle: "About GivahBz",
  aboutSubtitle: "Empowering Belizean communities through transparent, verified crowdfunding",
  aboutMission: "GivahBz was created to provide a trusted, transparent platform for Belizean communities to support each other. We believe that when people come together, incredible things happen.",
}

export function mergeWithDefaults(partial: Partial<SiteContent> | null | undefined): SiteContent {
  if (!partial || typeof partial !== "object") return DEFAULT_SITE_CONTENT;
  return {
    siteName: typeof partial.siteName === "string" && partial.siteName.trim() ? partial.siteName.trim() : DEFAULT_SITE_CONTENT.siteName,
    heroTitle: typeof partial.heroTitle === "string" && partial.heroTitle.trim() ? partial.heroTitle.trim() : DEFAULT_SITE_CONTENT.heroTitle,
    heroSubtitle: typeof partial.heroSubtitle === "string" ? partial.heroSubtitle.trim() : DEFAULT_SITE_CONTENT.heroSubtitle,
    communityHeadingPart1: typeof partial.communityHeadingPart1 === "string" ? partial.communityHeadingPart1 : DEFAULT_SITE_CONTENT.communityHeadingPart1,
    communityHeadingPart2: typeof partial.communityHeadingPart2 === "string" ? partial.communityHeadingPart2 : DEFAULT_SITE_CONTENT.communityHeadingPart2,
    footerTagline: typeof partial.footerTagline === "string" ? partial.footerTagline.trim() : DEFAULT_SITE_CONTENT.footerTagline,
    footerCopyright: typeof partial.footerCopyright === "string" ? partial.footerCopyright.trim() : DEFAULT_SITE_CONTENT.footerCopyright,
    aboutTitle: typeof partial.aboutTitle === "string" && partial.aboutTitle.trim() ? partial.aboutTitle.trim() : DEFAULT_SITE_CONTENT.aboutTitle,
    aboutSubtitle: typeof partial.aboutSubtitle === "string" ? partial.aboutSubtitle.trim() : DEFAULT_SITE_CONTENT.aboutSubtitle,
    aboutMission: typeof partial.aboutMission === "string" ? partial.aboutMission.trim() : DEFAULT_SITE_CONTENT.aboutMission,
  };
}
