import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Plus, ArrowUp, Sparkles, FileText, X, Quote, BookOpen } from "lucide-react";

export default function ChamberChat({
  messages,
  onSendMessage,
  isLoading,
  activeFile,
  onUploadFile,
  onRemoveFile,
  isUploading,
  onInspectPrecedent,
}) {
  const [inputValue, setInputValue] = useState("");
  const fileInputRef = useRef(null);
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  const handleQuickPrecedence = () => {
    const prompt =
      "Analyze apex court precedents and formulate strategic arguments for this matter.";
    onSendMessage(prompt);
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-black relative overflow-hidden select-none">
      {/* Messages Stream: Focused within max-w-4xl with Airy Padding */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-8 min-h-0">
        <div className="max-w-4xl mx-auto space-y-8 w-full">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              {/* Sender Role Wayfinding */}
              <div className="text-[11px] text-zinc-500 mb-2 px-1 font-medium">
                {msg.role === "user" ? "Instructing counsel" : "Senior Supreme Court advocate"}
              </div>

              {/* Modern AI Chat Bubble */}
              <div
                className={`max-w-3xl rounded-2xl px-6 sm:px-7 py-5 sm:py-6 text-sm leading-relaxed shadow-lg ${
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

                {/* Grounded Citations inside Assistant Bubble */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-white/10 space-y-3.5">
                    <div className="text-xs font-medium text-white flex items-center gap-2">
                      <Quote className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Authentic Supreme Court citations referenced:</span>
                    </div>

                    <div className="space-y-3">
                      {msg.citations.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="bg-black/60 border border-white/10 rounded-xl p-4 text-xs space-y-2 hover:border-white/20 transition-colors duration-150"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-normal text-white text-sm">
                              {c.case_name} ({c.year})
                            </span>
                            <span className="text-[11px] bg-white/10 text-white px-2.5 py-0.5 rounded-full font-mono font-medium">
                              {(c.similarity_score * 100).toFixed(1)}% match
                            </span>
                          </div>

                          <div className="text-[11px] text-zinc-400">
                            Bench: {c.bench || "Supreme Court of India"}
                          </div>

                          <blockquote className="border-l-2 border-white/30 pl-3 my-2 text-zinc-300 italic font-serif text-[12px] bg-white/5 py-2 px-3 rounded-r leading-relaxed">
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
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-zinc-900 rounded-2xl rounded-tl-sm px-6 py-4 text-xs text-zinc-300 flex items-center gap-3 shadow-lg border-0">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>Consulting 76,802 Supreme Court judgments and synthesizing arguments…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area Redesign (+ Icon & Analyze Button) */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-black via-black/95 to-transparent flex-shrink-0 z-20">
        <div className="max-w-4xl mx-auto w-full space-y-2.5">
          {/* Quick-Action Bar: 'Analyze Precedence' Pill & Attached PDF Pill */}
          <div className="flex flex-wrap items-center gap-2 px-2">
            <button
              type="button"
              onClick={handleQuickPrecedence}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <Sparkles className="w-3 h-3 text-white" />
              <span>Analyze Precedence</span>
            </button>

            {activeFile && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white">
                <FileText className="w-3 h-3 text-zinc-300" />
                <span className="truncate max-w-xs">{activeFile.name}</span>
                <button
                  type="button"
                  onClick={onRemoveFile}
                  className="text-zinc-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  title="Remove document"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {isUploading && (
              <span className="text-[11px] text-zinc-400 italic">
                Parsing document…
              </span>
            )}
          </div>

          {/* Sleek ChatGPT-Style Input Bar with Circular '+' Button */}
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center bg-zinc-900 rounded-full px-3 py-2 border border-white/10 focus-within:border-white/25 transition-colors duration-150 shadow-lg"
          >
            {/* Sleek Circular '+' Icon Button for Attaching PDFs */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach petition or order (PDF/TXT)"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white flex items-center justify-center transition-colors duration-150 cursor-pointer flex-shrink-0 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none mr-1.5"
            >
              <Plus className="w-4 h-4" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a legal strategy question or attach a petition…"
              disabled={isLoading}
              className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0 px-2 py-1.5"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="w-9 h-9 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 ml-2 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none shadow-sm"
              title="Send message"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
