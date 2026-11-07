import React from "react";

export default function LandingFooter({ onEnterChamber }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-black border-t border-zinc-900 py-12 px-6 sm:px-10 md:px-16 lg:px-20 text-white select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Tier: Brand, Navigation & CTA */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-zinc-900">
          {/* Brand Identity */}
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-white rounded-[2px]" />
              <span className="font-serif text-xl font-normal tracking-wide text-white">
                LAW AI
              </span>
            </div>
            <p className="font-sans text-xs text-zinc-500 font-light">
              Supreme Court Precedent Analyzer & Legal Intelligence
            </p>
          </div>

          {/* Minimalist Navigation Links */}
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-6 sm:gap-8 font-sans text-xs text-zinc-400">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("features");
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
              onClick={onEnterChamber}
              className="hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              Chamber
            </button>
          </nav>

          {/* Action CTA */}
          <div>
            <button
              type="button"
              onClick={onEnterChamber}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded transition-colors duration-150 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              Enter Chamber
            </button>
          </div>
        </div>

        {/* Bottom Tier: Standard Copyright & Legal Notice */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-sans font-light">
          <div>
            © {currentYear} LAW AI. All rights reserved.
          </div>
          <div className="text-[11px] text-zinc-600">
            Designed for senior advocates, corporate counsel, and judicial researchers.
          </div>
        </div>
      </div>
    </footer>
  );
}
