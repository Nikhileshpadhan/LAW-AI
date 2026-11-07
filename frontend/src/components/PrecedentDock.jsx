import React from "react";
import { BookOpen, ExternalLink } from "lucide-react";

export default function PrecedentDock({ precedents, onInspectPrecedent }) {
  const precedentList = Object.values(precedents).sort(
    (a, b) => b.similarity_score - a.similarity_score
  );

  return (
    <aside className="w-80 xl:w-92 h-full flex flex-col overflow-y-auto bg-zinc-950 border-l border-white/5 relative p-6 md:p-7 select-none">
      {/* Sticky Pinned Header with solid matching background to prevent bleed-through */}
      <div className="sticky top-0 z-10 bg-zinc-950 pb-4 border-b border-white/5 -mt-2 pt-2 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Section 03</span>
              <span className="text-zinc-400 text-[11px] font-medium">Archive</span>
            </div>
            <div className="font-serif text-base font-normal text-white tracking-tight">
              Precedent exhibits
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 font-mono">
              {precedentList.length} authorities grounded
            </div>
          </div>
          <span className="text-[11px] bg-white/5 text-zinc-300 border border-white/5 px-2.5 py-1 rounded-md font-mono font-medium">
            Legal-BERT
          </span>
        </div>
      </div>

      {/* Precedent Cards List */}
      <div className="space-y-4 flex-1">
        {precedentList.length === 0 ? (
          /* Soft, Borderless Empty State with Centered Gray Text */
          <div className="text-center py-24 px-6 text-xs text-zinc-500 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 mb-1">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-zinc-300 font-medium text-sm">No precedents retrieved yet</div>
            <p className="text-zinc-500 max-w-xs leading-relaxed font-light">
              Authorities retrieved during consultation will appear here ranked by semantic relevance.
            </p>
          </div>
        ) : (
          precedentList.map((p, idx) => (
            <div
              key={idx}
              className="p-4 bg-zinc-900 border border-white/5 hover:border-white/20 rounded-xl space-y-2.5 transition-colors duration-150 group shadow-md"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] bg-white/5 text-zinc-300 px-2.5 py-0.5 rounded-full font-mono font-medium">
                  Exhibit #{idx + 1} · {(p.similarity_score * 100).toFixed(1)}% match
                </span>
                <button
                  type="button"
                  onClick={() => onInspectPrecedent(p)}
                  className="text-zinc-400 hover:text-white p-1 rounded transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  title="Inspect raw judgment excerpt"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="font-serif text-sm font-normal text-white leading-snug">
                {p.case_name} ({p.year})
              </div>

              <div className="text-[11px] text-zinc-400">
                Bench: {p.bench || "Supreme Court of India"}
              </div>

              <div className="text-[11px] text-zinc-300 line-clamp-3 bg-black/40 p-3 rounded-lg italic font-serif leading-relaxed border-0">
                "{p.document_text ? p.document_text.slice(0, 200) : p.verbatim_quote}…"
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
