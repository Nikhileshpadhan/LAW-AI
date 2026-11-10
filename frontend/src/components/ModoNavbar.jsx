import React, { useState } from "react";
import { LogOut, User as UserIcon, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CounselAvatar from "./CounselAvatar";

export default function ModoNavbar({
  activeView,
  setActiveView,
  currentUser: propUser,
  onOpenAuthModal: propOpenAuth,
  onLogout: propLogout,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const auth = useAuth();
  const user = propUser !== undefined ? propUser : auth.user;
  const isAuthenticated = Boolean(user);
  const handleOpenAuth = propOpenAuth || auth.openAuthModal;
  const handleLogout = propLogout || auth.logout;

  const isLanding = activeView === "landing";

  const renderProfilePill = () => {
    const rawName = user?.name || user?.full_name || user?.email?.split("@")[0] || "Counsel";
    const displayName = rawName.replace(/^Counsel\s*:\s*/i, "").replace(/^Counsel\s+/i, "").trim();

    return (
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-200">
        <CounselAvatar user={user} size="sm" />
        <span className="font-medium text-white truncate max-w-[70px] sm:max-w-[140px] md:max-w-[180px]">
          <span className="hidden sm:inline">Counsel: </span>{displayName}
        </span>
      </div>
    );
  };

  if (isLanding) {
    return (
      <header className="absolute top-0 left-0 right-0 z-50 h-16 sm:h-20 md:h-24 w-full px-4 sm:px-8 md:px-16 lg:px-20 flex items-center justify-between bg-transparent text-white select-none">
        {/* Left: Mobile Menu Toggle & Logo in clean Serif font */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView("landing");
              setIsMobileMenuOpen(false);
            }}
            className="font-serif text-lg sm:text-2xl font-normal tracking-wide text-white hover:opacity-85 transition-opacity duration-150 cursor-pointer select-none bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none shadow-none p-0 m-0"
          >
            LAW AI
          </button>
        </div>

        {/* Center: Navigation links evenly spaced in simple white sans-serif font (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 font-sans text-sm text-white/80">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("features") || document.getElementById("architecture");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            Features
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("tech-stack") || document.getElementById("precedents");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            Tech Stack
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                handleOpenAuth?.("login");
              } else {
                setActiveView("chamber");
              }
            }}
            className="hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            Workbench
          </button>
        </nav>

        {/* Right: Dynamic Header Navigation (Logged In vs Logged Out) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {isAuthenticated ? (
            <>
              {/* Sequence 1: "Enter Chamber" button (direct navigation without modal) */}
              <button
                type="button"
                onClick={() => setActiveView("chamber")}
                className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none shadow-sm whitespace-nowrap"
              >
                <span className="hidden xs:inline">Enter </span>Chamber
              </button>

              {/* Sequence 2: The logged-in user's name badge */}
              {renderProfilePill()}

              {/* Sequence 3: "Logout" button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out of chamber"
                className="text-xs sm:text-sm font-medium text-zinc-400 hover:text-white p-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              {/* Unauthenticated State: Displays both "Sign In / Register" and "Enter Chamber" */}
              <button
                type="button"
                onClick={() => handleOpenAuth?.("login")}
                className="text-xs sm:text-sm font-medium text-white/90 hover:text-white px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg hover:bg-white/10 border border-white/15 hover:border-white/30 transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none whitespace-nowrap"
              >
                <span className="hidden sm:inline">Sign In / Register</span>
                <span className="sm:hidden">Sign In</span>
              </button>

              {/* Clicking "Enter Chamber" while unauthenticated intercepts and prompts authentication modal */}
              <button
                type="button"
                onClick={() => handleOpenAuth?.("login")}
                className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none shadow-sm whitespace-nowrap"
              >
                <span className="hidden xs:inline">Enter </span>Chamber
              </button>
            </>
          )}
        </div>

        {/* Mobile Navigation Dropdown Sheet */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-zinc-950/95 backdrop-blur-md border-b border-white/10 px-6 py-5 flex flex-col gap-4 text-sm font-sans md:hidden shadow-2xl z-50">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                const el = document.getElementById("features") || document.getElementById("architecture");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-left text-zinc-300 hover:text-white py-1 transition-colors"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                const el = document.getElementById("tech-stack") || document.getElementById("precedents");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-left text-zinc-300 hover:text-white py-1 transition-colors"
            >
              Tech Stack
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (!isAuthenticated) {
                  handleOpenAuth?.("login");
                } else {
                  setActiveView("chamber");
                }
              }}
              className="text-left text-white font-medium py-1 flex items-center justify-between"
            >
              <span>Workbench</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>
          </div>
        )}
      </header>
    );
  }

  // Pinned Top Navigation Bar (Left Menu: Logo & Main Navigation Links)
  return (
    <header className="h-14 w-full border-b border-white/5 bg-zinc-950 px-6 md:px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 text-white select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveView("landing")}
          className="flex items-center gap-2.5 text-left cursor-pointer group focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />
          <span className="font-serif text-sm font-semibold tracking-tight text-white">
            LAW AI
          </span>
        </button>
        <span className="text-xs text-zinc-500 hidden sm:inline border-l border-white/10 pl-3">
          Supreme Court Repository
        </span>
      </div>

      {/* Navigation Links (Red Group: Pinned Top Navigation) */}
      <nav className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm">
        <button
          type="button"
          onClick={() => setActiveView("landing")}
          className="text-zinc-400 hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          Features
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveView("landing");
            setTimeout(() => {
              const el = document.getElementById("tech-stack") || document.getElementById("precedents");
              el?.scrollIntoView({ behavior: "smooth" });
            }, 50);
          }}
          className="text-zinc-400 hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          Tech Stack
        </button>
        <button
          type="button"
          onClick={() => setActiveView("chamber")}
          className="text-white font-semibold transition-colors duration-150 cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <span>Workbench</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </button>
      </nav>

      {/* Mode Exit & Auth Action */}
      <div className="flex items-center gap-3">
        {isAuthenticated && renderProfilePill()}

        <button
          type="button"
          onClick={() => setActiveView("landing")}
          className="h-8 px-3.5 border border-white/10 hover:border-white/20 bg-zinc-900 text-zinc-300 hover:text-white text-xs rounded-lg transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <span>Exit chamber</span>
        </button>
      </div>
    </header>
  );
}
