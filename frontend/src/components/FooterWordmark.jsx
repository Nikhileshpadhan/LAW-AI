import React from "react";

export default function FooterWordmark() {
  return (
    <footer className="border-t border-border-subtle bg-bg-primary pt-12 pb-8 overflow-hidden select-none">
      <div className="w-full text-center px-4">
        <div className="text-[clamp(4.5rem,15vw,13rem)] font-bold tracking-tighter leading-none text-text-primary opacity-90 transition-opacity hover:opacity-100">
          PRECEDENT
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 mt-6 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between text-xs text-text-muted gap-4">
        <div>
          Supreme Court of India (2018 to 2024 Archive)
        </div>
        <div className="flex items-center gap-3">
          <span>Legal-BERT Dense Embeddings</span>
          <span className="w-1 h-1 rounded-full bg-border-subtle" />
          <span>ChromaDB Vector Store</span>
          <span className="w-1 h-1 rounded-full bg-border-subtle" />
          <span>Groq openai/gpt-oss-120b</span>
        </div>
        <div>
          LAW AI Design Specification
        </div>
      </div>
    </footer>
  );
}
