import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Plus, ArrowUp, FileText, X, Quote, BookOpen, AlertCircle, RotateCcw, UploadCloud, ArrowRight } from "lucide-react";

export default function ChamberChat({
  messages,
  onSendMessage,
  isLoading,
  activeFile,
  onUploadFile,
  onRemoveFile,
  isUploading,
  onInspectPrecedent,
  onRetry,
  currentUser = null,
  onRequireAuth = null,
}) {
  const [inputValue, setInputValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea as content expands
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue.trim());
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (name.endsWith(".pdf") || name.endsWith(".txt")) {
        onUploadFile(file);
      } else {
        alert("Please upload an authentic petition or order in PDF or TXT format.");
      }
    }
  };

  return (
    <main
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 flex flex-col h-full bg-black relative overflow-hidden select-none"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm border-2 border-dashed border-white/40 flex flex-col items-center justify-center gap-3 text-white pointer-events-none">
          <UploadCloud className="w-12 h-12 text-white animate-bounce" />
          <p className="font-serif text-lg">Drop petition or order (PDF/TXT) to analyze</p>
          <p className="text-xs text-zinc-400">Strictly grounded extraction over authentic Supreme Court corpus</p>
        </div>
      )}

      {/* Messages Stream */}
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

              {/* Chat Bubble / Error Card */}
              {msg.isError ? (
                <div className="max-w-3xl rounded-2xl px-6 py-5 text-sm leading-relaxed shadow-lg bg-red-950/30 border border-red-800/40 text-red-200 space-y-3">
                  <div className="flex items-center gap-2 text-red-300 font-medium text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>Consultation Error</span>
                  </div>
                  <p className="text-xs text-red-200">{msg.content}</p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={() => onRetry(msg.retryPrompt)}
                      className="px-3 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-800/60 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry consultation</span>
                    </button>
                  )}
                </div>
              ) : (
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
              )}
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

      {/* Floating Bottom Input Bar */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-black via-black/90 to-transparent flex-shrink-0 z-20">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Unauthenticated Counsel Requirement Notice */}
          {!currentUser && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-300 shadow-md">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Counsel sign-in required to consult precedents and frame submissions.</span>
              </div>
              <button
                type="button"
                onClick={onRequireAuth}
                className="px-3 py-1 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition-colors cursor-pointer text-xs flex items-center gap-1"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Active File Pill */}
          {activeFile && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-200">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{activeFile.name}</span>
              <button
                type="button"
                onClick={onRemoveFile}
                className="hover:text-white cursor-pointer ml-1 p-0.5"
                title="Remove attached document"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Auto-expanding Textarea Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="relative flex items-end bg-zinc-900 rounded-2xl px-3 py-2 border border-white/10 focus-within:border-white/25 transition-colors duration-150 shadow-lg"
          >
            {/* Circular '+' Button for Attaching PDFs */}
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  onRequireAuth?.();
                  return;
                }
                fileInputRef.current?.click();
              }}
              title="Attach petition or order (PDF/TXT)"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white flex items-center justify-center transition-colors duration-150 cursor-pointer flex-shrink-0 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none mb-0.5 mr-1.5"
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

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={() => {
                if (!currentUser) {
                  onRequireAuth?.();
                }
              }}
              onFocus={() => {
                if (!currentUser) {
                  onRequireAuth?.();
                }
              }}
              placeholder={
                currentUser
                  ? "Ask a legal strategy question, paste facts, or drop a petition…"
                  : "Sign in with counsel credentials to consult Supreme Court precedents…"
              }
              disabled={isLoading}
              style={{ outline: "none", boxShadow: "none" }}
              className="flex-1 bg-transparent border-0 border-none outline-none text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0 focus:border-transparent focus:border-none focus-visible:outline-none focus-visible:ring-0 focus-visible:border-none shadow-none focus:shadow-none px-2 py-2 resize-none max-h-44 leading-relaxed"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="w-9 h-9 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 ml-2 mb-0.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none shadow-sm"
              title="Send consultation instruction"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
