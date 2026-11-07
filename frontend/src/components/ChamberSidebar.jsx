import React from "react";
import { Plus, MessageSquare, ChevronLeft, ArrowLeft } from "lucide-react";

export default function ChamberSidebar({
  isOpen,
  onToggle,
  onNewSession,
  onSelectSession,
  activeSessionId,
  onReturnToLanding,
}) {
  const sessions = [
    {
      id: "current",
      title: "Current case consultation",
      date: "Just now",
      active: true,
    },
    {
      id: "ibc-14",
      title: "S. 138 NI Act & IBC Moratorium",
      date: "Yesterday",
      prompt: "Analyze the scope of moratorium under Section 14 of the IBC concerning cheque bounce complaints under Section 138 of the NI Act against corporate directors.",
    },
    {
      id: "arbitration",
      title: "Arbitrability of Commercial Leases",
      date: "3 days ago",
      prompt: "Are tenancy and lease disputes arbitrable under Indian law following the landmark judgment in Vidya Drolia?",
    },
    {
      id: "puttaswamy",
      title: "Article 21 Digital Privacy Test",
      date: "Oct 28",
      prompt: "Evaluate the four-fold test of proportionality established in the Aadhaar decision for statutory infringement of digital privacy.",
    },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-64 sm:w-72 h-full bg-zinc-950 border-r border-white/5 flex flex-col justify-between p-4 flex-shrink-0 select-none z-30 motion-safe:transition-transform duration-200">
      <div className="space-y-4">
        {/* Top Header: New Session & Collapse Button */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onNewSession}
            className="flex-1 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-medium flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-300" />
            <span>New session</span>
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History Section */}
        <div className="pt-2">
          <div className="text-[11px] font-medium text-zinc-500 px-2 mb-2">
            Chat history
          </div>

          <div className="space-y-1">
            {sessions.map((s) => {
              const isSelected = activeSessionId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.prompt) onSelectSession?.(s.prompt);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-colors duration-150 cursor-pointer group focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                    isSelected
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-zinc-500 group-hover:text-zinc-300 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <div className="text-xs truncate font-normal">
                      {s.title}
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-0.5 font-mono">
                      {s.date}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Option: Back to Landing Page */}
      <div className="pt-3 border-t border-white/5">
        <button
          type="button"
          onClick={onReturnToLanding}
          className="w-full p-2.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to overview</span>
        </button>
      </div>
    </aside>
  );
}
