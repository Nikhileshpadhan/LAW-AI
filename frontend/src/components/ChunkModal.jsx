import React from "react";
import { X, BookOpen, Quote } from "lucide-react";

export default function ChunkModal({ isOpen, onClose, precedent }) {
  if (!isOpen || !precedent) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="font-serif text-sm font-normal text-white">
              {precedent.case_name} ({precedent.year})
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors duration-150 p-1.5 rounded-md hover:bg-white/5 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-zinc-900 border border-white/10 rounded-xl">
            <div>
              <span className="text-zinc-400">Bench: </span>
              <span className="text-white font-medium">
                {precedent.bench || "Supreme Court of India"}
              </span>
            </div>
            <span className="bg-white/10 text-white px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium">
              {(precedent.similarity_score * 100).toFixed(1)}% match
            </span>
          </div>

          <div>
            <div className="text-xs font-medium text-zinc-400 mb-2.5 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-zinc-400" />
              <span>Raw judgment excerpt from Supreme Court records:</span>
            </div>
            <div className="bg-zinc-900 border border-white/10 p-5 rounded-xl text-zinc-300 leading-relaxed font-serif text-[13px] whitespace-pre-wrap select-text">
              {precedent.document_text || precedent.verbatim_quote}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
