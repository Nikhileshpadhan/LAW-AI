import React, { useState } from "react";
import { X, FileDown, Printer, Copy, Check, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ReportModal({
  isOpen,
  onClose,
  report,
  onDownloadPdf,
  isDownloadingPdf,
}) {
  const [activeTab, setActiveTab] = useState("document");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  if (!report) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 text-white shadow-2xl">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-sm font-serif">Synthesizing Supreme Court Strategy Report…</p>
        </div>
      </div>
    );
  }

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(report.markdown_content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(report.html_content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="font-serif text-sm font-normal text-white">
                {report.title}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">
                Reference ID: {report.report_id} · Generated: {report.generated_at}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <div className="flex border border-white/10 rounded-lg overflow-hidden mr-2 p-0.5 bg-zinc-900">
              <button
                type="button"
                onClick={() => setActiveTab("document")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                  activeTab === "document"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Brief View
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("markdown")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                  activeTab === "markdown"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Raw Markdown
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("authorities")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                  activeTab === "authorities"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Authorities Table ({report.table_of_authorities?.length || 0})
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              title="Copy Markdown"
              className="p-2 border border-white/10 hover:border-white/20 bg-zinc-900 text-zinc-300 hover:text-white rounded-lg transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Print Brief"
              className="p-2 border border-white/10 hover:border-white/20 bg-zinc-900 text-zinc-300 hover:text-white rounded-lg transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="h-9 px-4 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors duration-150 cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <FileDown className="w-4 h-4 text-black" />
              <span>{isDownloadingPdf ? "Generating PDF…" : "Export PDF"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ml-2"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-black">
          {activeTab === "document" && (
            <div className="max-w-4xl mx-auto bg-zinc-900 border border-white/10 rounded-2xl p-10 text-zinc-300 shadow-xl">
              <div className="border-b border-white/10 pb-6 mb-8 text-center space-y-2">
                <div className="text-xs text-zinc-400 font-mono">
                  IN THE SUPREME COURT OF INDIA
                </div>
                <h1 className="font-serif text-2xl font-normal text-white">
                  {report.title}
                </h1>
                <div className="text-xs text-zinc-400">
                  Representing: {report.representing_side} · Generated on {report.generated_at}
                </div>
              </div>

              {/* Formatted Markdown Body */}
              <div className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-white prose-p:leading-relaxed prose-li:leading-relaxed prose-blockquote:border-white/40 prose-blockquote:text-zinc-300 font-light">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {report.markdown_content}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {activeTab === "markdown" && (
            <div className="max-w-4xl mx-auto">
              <pre className="bg-zinc-900 border border-white/10 p-6 rounded-2xl text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                {report.markdown_content}
              </pre>
            </div>
          )}

          {activeTab === "authorities" && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="font-serif text-base font-normal text-white pb-3 border-b border-white/10">
                Table of authentic Supreme Court authorities grounded
              </div>

              {report.table_of_authorities && report.table_of_authorities.length > 0 ? (
                <div className="space-y-3">
                  {report.table_of_authorities.map((auth, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-zinc-900 border border-white/10 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-normal text-white text-sm">
                          {auth.case_name} ({auth.year})
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        Bench: {auth.bench}
                      </div>
                      <blockquote className="border-l-2 border-white/30 pl-3 italic font-serif text-zinc-300 text-xs bg-white/5 p-2.5 rounded-r leading-relaxed">
                        "{auth.verbatim_quote}"
                      </blockquote>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-zinc-500 text-xs italic py-8 text-center">
                  No authorities grounded in this session yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
