import React, { useRef } from "react";
import { UploadCloud, FileText, X, AlertCircle, ArrowUpRight } from "lucide-react";

export default function CaseSidebar({
  caseContext,
  setCaseContext,
  activeFile,
  onUploadFile,
  onRemoveFile,
  isUploading,
  statutes,
  onOpenReportModal,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  return (
    <aside className="w-80 xl:w-92 h-full flex flex-col overflow-y-auto bg-zinc-950 border-r border-white/5 relative p-6 md:p-7 select-none">
      {/* Sticky Pinned Header with solid matching background to prevent bleed-through */}
      <div className="sticky top-0 z-10 bg-zinc-950 pb-4 border-b border-white/5 -mt-2 pt-2">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
          <span>Section 01</span>
          <span className="text-zinc-400 text-[11px] font-medium">Dossier</span>
        </div>
        <div className="font-serif text-base font-normal text-white tracking-tight">
          Case brief & proceedings
        </div>
      </div>

      <div className="space-y-7 pt-5 flex-1">
        {/* Document Ingestion Zone - Soft rounded rectangle with bg-white/5, no border, subtle hover */}
        <div>
          <div className="text-xs font-medium text-zinc-400 mb-2.5">
            Case document
          </div>

          {activeFile ? (
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-4 h-4 text-white flex-shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-xs font-medium text-white truncate">
                    {activeFile.name}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {(activeFile.size / 1024).toFixed(1)} KB · Analyzed
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemoveFile}
                className="text-zinc-400 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 bg-white/5 hover:bg-white/10 rounded-xl text-center cursor-pointer transition-colors duration-150 border-0 outline-none group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-6 h-6 text-zinc-400 group-hover:text-white mx-auto mb-2.5 transition-colors duration-150" />
              <div className="text-xs font-medium text-white">
                {isUploading ? "Parsing document…" : "Upload petition or order (PDF)"}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 font-light">
                Drag and drop file or click to browse
              </div>
            </div>
          )}
        </div>

        {/* Factual Matrix Area - Borderless, lighter gray background */}
        <div>
          <div className="text-xs font-medium text-zinc-400 mb-2.5 flex items-center justify-between">
            <span>Factual matrix</span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {caseContext.length} chars
            </span>
          </div>
          <textarea
            value={caseContext}
            onChange={(e) => setCaseContext(e.target.value)}
            placeholder="Type or paste the client situation, timeline of events, or disputed transaction…"
            rows={6}
            className="w-full bg-zinc-900 border-0 text-xs text-white placeholder:text-zinc-500 rounded-xl p-4 focus:ring-1 focus:ring-white/20 focus:outline-none resize-none transition-colors duration-150 leading-relaxed"
          />
        </div>

        {/* Detected Statutory Framework - Borderless, lighter gray tags */}
        <div>
          <div className="text-xs font-medium text-zinc-400 mb-2.5">
            Statutory provisions
          </div>
          {statutes && statutes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {statutes.map((s, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-zinc-900 text-zinc-300 px-3 py-1 rounded-lg border-0 font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic bg-zinc-900/60 p-3.5 rounded-xl border-0 font-light leading-relaxed">
              Provisions are automatically extracted upon document or facts entry
            </div>
          )}
        </div>
      </div>

      {/* Convert to Report Box with Solid Crisp White CTA Button */}
      <div className="pt-5 border-t border-white/5 mt-5 space-y-3 flex-shrink-0">
        <div className="p-4 bg-zinc-900/80 border border-white/5 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-medium text-white mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-300" />
            <span>Formal strategy brief</span>
          </div>
          <div className="text-[11px] text-zinc-400 leading-relaxed mb-3.5 font-light">
            Synthesize proceedings and grounded citations into an apex brief.
          </div>
          <button
            type="button"
            onClick={onOpenReportModal}
            className="w-full h-10 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <span>Generate court report</span>
            <ArrowUpRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </aside>
  );
}
