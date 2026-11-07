import React, { useState } from "react";
import {
  Plus,
  MessageSquare,
  ChevronLeft,
  ArrowLeft,
  FileSpreadsheet,
  Scale,
  BookOpen,
  ChevronDown,
  Trash2,
} from "lucide-react";

export default function ChamberSidebar({
  isOpen,
  onToggle,
  onNewSession,
  onSelectSession,
  activeSessionId,
  onReturnToLanding,
  caseContext = "",
  setCaseContext,
  statutes = [],
  precedentsPool = {},
  onInspectPrecedent,
  consultations = [],
  onDeleteConsultation,
}) {
  const [isDossierOpen, setIsDossierOpen] = useState(true);
  const [isPrecedentsOpen, setIsPrecedentsOpen] = useState(true);
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [contextInput, setContextInput] = useState(caseContext);

  const precedentItems = Object.values(precedentsPool || {});

  const handleSaveContext = () => {
    setCaseContext?.(contextInput);
    setIsEditingContext(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay (< 768px) */}
      <div
        onClick={onToggle}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 md:hidden"
        aria-hidden="true"
      />

      <aside className="fixed md:static inset-y-0 left-0 w-72 sm:w-80 h-full bg-zinc-950 border-r border-white/5 flex flex-col justify-between p-4 flex-shrink-0 select-none z-40 shadow-2xl md:shadow-none motion-safe:transition-transform duration-200 overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-1 space-y-5 min-h-0">
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

          {/* Section 1: Collapsible Case Dossier & Factual Matrix */}
          <div className="border border-white/5 bg-zinc-900/40 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsDossierOpen(!isDossierOpen)}
              className="w-full px-3 py-2.5 flex items-center justify-between text-left text-xs font-medium text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
                <span>Case Dossier & Facts</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                  isDossierOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDossierOpen && (
              <div className="p-3 border-t border-white/5 space-y-3">
                {isEditingContext ? (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={contextInput}
                      onChange={(e) => setContextInput(e.target.value)}
                      placeholder="Enter factual matrix or client background…"
                      className="w-full bg-black/60 border border-white/15 rounded-lg p-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsEditingContext(false)}
                        className="px-2.5 py-1 text-[11px] text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveContext}
                        className="px-2.5 py-1 text-[11px] bg-white text-black font-medium rounded"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setContextInput(caseContext);
                      setIsEditingContext(true);
                    }}
                    className="p-2 rounded bg-black/40 border border-white/5 text-[11px] text-zinc-300 font-light leading-relaxed cursor-pointer hover:border-white/20 transition-colors"
                    title="Click to edit case facts"
                  >
                    {caseContext ? (
                      <p className="line-clamp-4">{caseContext}</p>
                    ) : (
                      <span className="text-zinc-500 italic">
                        No case facts loaded. Click to add factual summary…
                      </span>
                    )}
                  </div>
                )}

                {/* Extracted Statutes Badges */}
                {statutes.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-zinc-500 font-medium">
                      Governing Statutes
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {statutes.map((st, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-300 font-mono"
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Grounded Precedents Dock */}
          <div className="border border-white/5 bg-zinc-900/40 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsPrecedentsOpen(!isPrecedentsOpen)}
              className="w-full px-3 py-2.5 flex items-center justify-between text-left text-xs font-medium text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-zinc-400" />
                <span>Precedents Dock</span>
                {precedentItems.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-white">
                    {precedentItems.length}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                  isPrecedentsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isPrecedentsOpen && (
              <div className="p-3 border-t border-white/5 space-y-2">
                {precedentItems.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic">
                    Authorities cited during consultation will automatically populate here.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {precedentItems.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onInspectPrecedent?.(p)}
                        className="w-full text-left p-2 rounded-lg bg-black/40 hover:bg-black border border-white/5 hover:border-white/20 transition-colors text-xs space-y-1 group cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-serif text-[11px] text-white truncate font-normal">
                            {p.case_name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {p.year}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span className="font-mono">
                            {p.similarity_score
                              ? `${(p.similarity_score * 100).toFixed(0)}% match`
                              : "Cited"}
                          </span>
                          <span className="text-zinc-400 group-hover:text-white flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>Inspect</span>
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Consultation Sessions History */}
          <div className="pt-2">
            <div className="text-[11px] font-medium text-zinc-500 px-2 mb-2 flex items-center justify-between">
              <span>Saved Consultations</span>
            </div>

            <div className="space-y-1">
              {consultations && consultations.length > 0 ? (
                consultations.map((s) => {
                  const isSelected = activeSessionId === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`group flex items-center justify-between p-2 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectSession?.(s)}
                        className="flex-1 text-left flex items-start gap-2.5 overflow-hidden cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-zinc-500 group-hover:text-zinc-300 flex-shrink-0" />
                        <div className="overflow-hidden">
                          <div className="text-xs truncate font-normal">
                            {s.title}
                          </div>
                          <div className="text-[10px] text-zinc-600 mt-0.5 font-mono truncate">
                            {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : "Saved"}
                          </div>
                        </div>
                      </button>

                      {onDeleteConsultation && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConsultation(s.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity cursor-pointer"
                          title="Delete consultation"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-2 text-[11px] text-zinc-500 italic">
                  Active session is maintained live in chamber.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Option: Back to Landing Page */}
        <div className="pt-3 border-t border-white/5 flex-shrink-0">
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
    </>
  );
}
