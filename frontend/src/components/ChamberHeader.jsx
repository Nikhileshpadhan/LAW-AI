import React from "react";
import { PanelLeft, FileText } from "lucide-react";

export default function ChamberHeader({
  onToggleSidebar,
  isSidebarOpen,
  onOpenReportModal,
  onReturnToLanding,
}) {
  return (
    <header className="h-16 w-full border-b border-white/5 bg-black px-6 sm:px-8 flex items-center justify-between flex-shrink-0 z-40 select-none">
      {/* Left: Sidebar Toggle & Clean Serif Logo */}
      <div className="flex items-center gap-3.5">
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

      {/* Right: Single, Prominent, High-Contrast 'Generate Report' Button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onOpenReportModal}
          className="h-10 px-5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm rounded-lg flex items-center gap-2 transition-colors duration-150 cursor-pointer shadow-md focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <FileText className="w-4 h-4 text-black" />
          <span>Generate Report</span>
        </button>
      </div>
    </header>
  );
}
