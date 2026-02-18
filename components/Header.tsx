"use client";

import Link from "next/link";
import { Search, Heart, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import HeartedCampaigns from "./HeartedCampaigns";
import { getHeartedCampaignIds } from "./HeartedCampaigns";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHeartedCampaigns, setShowHeartedCampaigns] = useState(false);
  const [heartedCount, setHeartedCount] = useState(0);
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  
  // Update heart count
  const updateHeartCount = () => {
    if (typeof window !== "undefined") {
      setHeartedCount(getHeartedCampaignIds().length);
    }
  };

  // Initialize and listen for storage changes
  useEffect(() => {
    updateHeartCount();
    if (typeof window !== "undefined") {
      window.addEventListener("storage", updateHeartCount);
      // Custom event for same-tab updates
      window.addEventListener("heartedCampaignsChanged", updateHeartCount);
      return () => {
        window.removeEventListener("storage", updateHeartCount);
        window.removeEventListener("heartedCampaignsChanged", updateHeartCount);
      };
    }
  }, []);

  // Update count when modal opens/closes
  useEffect(() => {
    if (showHeartedCampaigns) {
      updateHeartCount();
    }
  }, [showHeartedCampaigns]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/campaigns?q=${encodeURIComponent(query)}`);
      setMobileMenuOpen(false);
    } else {
      router.push("/campaigns");
    }
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center">
            <img
              src="/givah-logo.png"
              alt="GivahBz"
              className="h-8 w-auto sm:h-10"
              width={140}
              height={40}
            />
          </Link>

          {/* Search Bar - desktop only */}
          <form onSubmit={handleSearch} className="hidden lg:block flex-1 max-w-md mx-4 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Search campaigns"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 shrink-0">
            <Link
              href="/"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/campaigns"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Campaigns
            </Link>
            <Link
              href="/how-it-works"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              How It Works
            </Link>
            {isAdmin && (
                <Link
                  href="/admin"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Admin
                </Link>
              )}
            {user ? (
              <>
                <Link
                  href="/campaigns/create"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Start Fundraising
                </Link>
                <button className="text-gray-700 hover:text-primary-600 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                      {user.profilePhoto ? (
                        <img 
                          src={user.profilePhoto} 
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="hidden md:inline">{user.name}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-medium flex-shrink-0">
                          {user.profilePhoto ? (
                            <img 
                              src={user.profilePhoto} 
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm">{user.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/my-campaigns"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Campaigns
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-success-500 text-white px-4 py-2 rounded-full font-medium hover:bg-success-600 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Search campaigns"
              />
            </form>
            <nav className="flex flex-col gap-1">
              <Link href="/" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>Home</Link>
              <Link href="/campaigns" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>Campaigns</Link>
              <Link href="/how-it-works" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>How It Works</Link>
              {isAdmin && (
                <Link href="/admin" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>Admin</Link>
              )}
              {user ? (
                <>
                  <Link href="/campaigns/create" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>Start Fundraising</Link>
                  <Link href="/profile" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>My Profile</Link>
                  <Link href="/my-campaigns" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>My Campaigns</Link>
                  <button onClick={handleLogout} className="px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>Sign In</Link>
                  <Link href="/auth/signup" className="mx-4 mt-2 block text-center bg-success-500 text-white py-3 rounded-full font-medium" onClick={closeMobileMenu}>Sign Up</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Hearted Campaigns Modal */}
      <HeartedCampaigns
        isOpen={showHeartedCampaigns}
        onClose={() => setShowHeartedCampaigns(false)}
      />
    </header>
  );
}
