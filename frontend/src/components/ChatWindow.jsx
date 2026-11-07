import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, BookOpen, Quote, RefreshCw, FileDown } from "lucide-react";

export default function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  onInspectPrecedent,
  representingSide,
  setRepresentingSide,
  onOpenReportModal,
  onQuickExportPdf,
  isExportingPdf,
  onResetSession,
}) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue.trim());
    setInputValue("");
  };

  const suggestions = [
    "Can Section 420 IPC proceedings be quashed if an arbitration clause exists?",
    "Formulate pre-arrest bail arguments under Section 438 CrPC on parity.",
    "What counter-arguments will opposing counsel raise against this precedent?",
  ];

  return (
    <section className="flex-1 flex flex-col h-full relative overflow-hidden bg-black select-none">
      {/* Pinned Consultation Room Header & Floating Action Tools (Right Menu Pinned to Center Column) */}
      <div className="h-14 px-6 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-500">Section 02</div>
          <div className="font-serif text-sm font-normal text-white">
            Chamber consultation room
          </div>
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-zinc-400 font-mono">
              openai/gpt-oss-120b active
            </span>
          </div>
        </div>

        {/* Pinned Action Tools (Right Menu Group) */}
        <div className="flex items-center gap-2">
          {/* Stance Selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="stance-select" className="text-xs text-zinc-400 hidden xl:inline">
              Stance:
            </label>
            <select
              id="stance-select"
              value={representingSide}
              onChange={(e) => setRepresentingSide(e.target.value)}
              className="h-8 bg-zinc-900 border border-white/10 text-xs text-white rounded-lg px-2.5 py-1 focus:border-white focus:outline-none transition-colors duration-150 cursor-pointer"
            >
              <option value="Petitioner / Appellant">Petitioner / Appellant</option>
              <option value="Respondent / Defense">Respondent / Defense</option>
              <option value="Neutral Evaluation">Neutral Evaluation</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onResetSession}
            title="Reset Consultation"
            className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 bg-zinc-900 rounded-lg cursor-pointer transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenReportModal}
            className="h-8 px-3 border border-white/10 hover:border-white/20 bg-zinc-900 text-zinc-300 hover:text-white text-xs rounded-lg cursor-pointer transition-colors duration-150 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-300" />
            <span className="hidden sm:inline">Strategy report</span>
          </button>

          <button
            type="button"
            onClick={onQuickExportPdf}
            disabled={isExportingPdf}
            className="h-8 px-3.5 border border-white/20 hover:border-white bg-transparent hover:bg-white hover:text-black text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? "Generating…" : "Export PDF"}</span>
          </button>
        </div>
      </div>

      {/* Messages Stream: The Only Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* Sender Label */}
            <div className="text-[11px] text-zinc-500 mb-1.5 px-1 font-medium">
              {msg.role === "user" ? "Instructing counsel" : "Senior Supreme Court advocate"}
            </div>

            {/* Modern AI Chat Bubble */}
            <div
              className={`max-w-3xl rounded-2xl px-6 py-5 text-sm leading-relaxed shadow-lg ${
                msg.role === "user"
                  ? "bg-zinc-800 text-white rounded-tr-sm border-0"
                  : "bg-zinc-900 text-zinc-100 rounded-tl-sm border-0"
              }`}
            >
              <div className="prose prose-invert max-w-none text-zinc-200 prose-headings:font-serif prose-headings:text-white prose-strong:text-white prose-code:bg-black/60 prose-code:border prose-code:border-white/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 font-light">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>

              {/* Citations Attached to Message */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Quote className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Authentic Supreme Court citations referenced:</span>
                  </div>

                  {msg.citations.map((c, cIdx) => (
                    <div
                      key={cIdx}
                      className="bg-zinc-950 border border-white/5 rounded-xl p-4 text-xs hover:border-white/20 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-serif font-normal text-white text-sm">
                          {c.case_name} ({c.year})
                        </span>
                        <span className="text-[11px] bg-white/10 text-white px-2.5 py-0.5 rounded-full font-mono font-medium">
                          {(c.similarity_score * 100).toFixed(1)}% match
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-400 mb-2">
                        Bench: {c.bench || "Supreme Court of India"}
                      </div>

                      <blockquote className="border-l-2 border-white/30 pl-3 my-2.5 text-zinc-300 italic font-serif text-[12px] bg-white/5 py-2 px-3 rounded-r leading-relaxed">
                        "{c.verbatim_quote}"
                      </blockquote>

                      <button
                        type="button"
                        onClick={() => onInspectPrecedent(c)}
                        className="h-8 px-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center gap-1.5 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-zinc-300" />
                        <span>Inspect judgment chunk</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start">
            <div className="bg-zinc-900 rounded-2xl rounded-tl-sm px-5 py-4 text-xs text-zinc-300 flex items-center gap-3 shadow-lg border-0">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>Consulting 76,802 Supreme Court judgments and synthesizing arguments…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pinned Bottom Input Area */}
      <div className="p-5 md:p-6 border-t border-white/5 bg-zinc-950/90 backdrop-blur-md space-y-3 flex-shrink-0 z-20">
        {/* Suggestion Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(s)}
              disabled={isLoading}
              className="border-0 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs px-3.5 py-1.5 rounded-full transition-colors duration-150 whitespace-nowrap flex-shrink-0 cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <span>{s}</span>
            </button>
          ))}
        </div>

        {/* ChatGPT-Style Single Sleek Rounded Bar Input */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-zinc-900 rounded-full px-4 py-2 border border-white/5 focus-within:border-white/20 transition-colors duration-150 shadow-inner"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your question or procedural scenario to formulate strategy…"
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0 px-2 py-1.5"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-white text-zinc-400 hover:text-black flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-400 disabled:cursor-not-allowed flex-shrink-0 ml-2 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none shadow-sm"
            title="Send message"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </section>
  );
}
