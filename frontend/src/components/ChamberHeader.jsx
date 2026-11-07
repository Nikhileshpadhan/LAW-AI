import React from "react";
import { PanelLeft, FileText, ChevronDown, User, LogOut } from "lucide-react";

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
}) {
  const stances = [
    "Petitioner / Appellant",
    "Respondent / Defense",
    "Neutral Evaluation",
  ];

  return (
    <header className="h-16 w-full border-b border-white/5 bg-black px-4 sm:px-6 md:px-8 flex items-center justify-between flex-shrink-0 z-40 select-none">
      {/* Left: Sidebar Toggle & Clean Serif Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onReturnToLanding}
          className="flex items-center gap-2.5 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />
          <span className="font-serif text-base sm:text-lg font-normal tracking-wide text-white">
            LAW AI
          </span>
        </button>
      </div>

      {/* Center: Stance Selector Dropdown */}
      <div className="hidden sm:flex items-center gap-2">
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
      <div className="flex items-center gap-3">
        {currentUser ? (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs text-white font-medium truncate max-w-[120px]">
                {currentUser.full_name || currentUser.email}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Counsel</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Sign out of chamber"
              className="h-9 px-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="h-9 px-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs text-white font-medium transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <User className="w-3.5 h-3.5 text-zinc-300" />
            <span>Sign In</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenReportModal}
          className="h-9 sm:h-10 px-3.5 sm:px-5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm rounded-lg flex items-center gap-2 transition-colors duration-150 cursor-pointer shadow-md focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <FileText className="w-4 h-4 text-black" />
          <span>Generate Report</span>
        </button>
      </div>
    </header>
  );
}
