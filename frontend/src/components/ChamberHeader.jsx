import React from "react";
import { PanelLeft, FileText, ChevronDown, User, LogOut } from "lucide-react";
import CounselAvatar from "./CounselAvatar";

export default function ChamberHeader({
  onToggleSidebar,
  isSidebarOpen,
  onOpenReportModal,
  onReturnToLanding,
  representingSide = "Petitioner / Appellant",
  setRepresentingSide,
  currentUser,
  onOpenAuthModal,
  onLogout,
  canGenerateReport = false,
}) {
  const stances = [
    "Petitioner / Appellant",
    "Respondent / Defense",
    "Neutral Evaluation",
  ];

  const rawName = currentUser?.name || currentUser?.full_name || currentUser?.email?.split("@")[0] || "Counsel";
  const displayName = rawName.replace(/^Counsel\s*:\s*/i, "").replace(/^Counsel\s+/i, "").trim();

  return (
    <header className="h-14 sm:h-16 w-full border-b border-white/5 bg-black px-3 sm:px-6 md:px-8 flex items-center justify-between flex-shrink-0 z-40 select-none">
      {/* Left: Sidebar Toggle & Clean Serif Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onReturnToLanding}
          className="flex items-center gap-2 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white rounded-[2px]" />
          <span className="font-serif text-sm sm:text-base md:text-lg font-normal tracking-wide text-white">
            LAW AI
          </span>
        </button>

        <button
          type="button"
          onClick={onReturnToLanding}
          className="hidden sm:inline-flex items-center text-xs text-zinc-400 hover:text-white transition-colors border-l border-white/10 pl-3 cursor-pointer"
        >
          Overview
        </button>
      </div>

      {/* Center: Stance Selector Dropdown */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-[11px] text-zinc-500 font-medium">Stance:</span>
        <div className="relative">
          <select
            value={representingSide}
            onChange={(e) => setRepresentingSide?.(e.target.value)}
            className="appearance-none bg-zinc-900 border border-white/10 hover:border-white/20 text-xs text-white rounded-lg pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white transition-colors"
          >
            {stances.map((s) => (
              <option key={s} value={s} className="bg-zinc-950 text-white">
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Right: Auth Profile & 'Generate Report' CTA */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {currentUser && (
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Counsel Profile Pill: Clean avatar with fallback & no literal brackets */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-200">
              <CounselAvatar user={currentUser} size="sm" />
              <span className="font-medium text-white truncate max-w-[65px] sm:max-w-[120px] md:max-w-[160px]">
                <span className="hidden sm:inline">Counsel: </span>{displayName}
              </span>
            </div>

            {/* Logout CTA */}
            <button
              type="button"
              onClick={onLogout}
              title="Sign out of chamber"
              className="h-8 w-8 sm:w-auto px-0 sm:px-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5 border border-white/10 hover:border-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}

        {/* Generate Report Button - Conditionally disabled when no active legal discussion */}
        <button
          type="button"
          onClick={canGenerateReport ? onOpenReportModal : undefined}
          disabled={!canGenerateReport}
          title={
            canGenerateReport
              ? "Generate Formal Strategy Report"
              : "Consult precedents or submit case facts first to generate a strategy report."
          }
          className={`h-8 sm:h-10 px-2.5 sm:px-4 md:px-5 font-semibold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all duration-150 shadow-md ${
            canGenerateReport
              ? "bg-white hover:bg-neutral-200 text-black cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              : "bg-white/5 text-zinc-500 border border-white/5 opacity-40 cursor-not-allowed select-none"
          }`}
        >
          <FileText className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${canGenerateReport ? "text-black" : "text-zinc-500"}`} />
          <span className="hidden sm:inline">Generate Report</span>
          <span className="sm:hidden text-[11px] font-medium">Report</span>
        </button>
      </div>
    </header>
  );
}
