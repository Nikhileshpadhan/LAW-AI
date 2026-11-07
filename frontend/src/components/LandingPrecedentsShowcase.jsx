import React from "react";
import { FileText, Binary, Database, Cpu } from "lucide-react";
import SpotlightCard from "./ui/reactbits/SpotlightCard";

export default function LandingPrecedentsShowcase() {
  const techStackItems = [
    {
      step: "01",
      layer: "Data Ingestion",
      title: "PyMuPDF & LlamaIndex",
      body: "Extracted and parsed 5 years (2020-2024) of Supreme Court PDFs into 512-token chunks via SentenceSplitter.",
      icon: FileText,
      spec: "512-Token Window",
    },
    {
      step: "02",
      layer: "Embedding Engine",
      title: "Custom Legal-BERT",
      body: "Generated 768-dimensional semantic vectors using nlpaueb/legal-bert-base-uncased, processed on GPU and saved to NumPy/Parquet.",
      icon: Binary,
      spec: "768-Dim Vectors",
    },
    {
      step: "03",
      layer: "Vector Store",
      title: "Persistent ChromaDB",
      body: "Local, high-speed vector index utilizing Cosine Similarity for strict, accurate semantic search across 76,800+ chunks.",
      icon: Database,
      spec: "Cosine Similarity",
    },
    {
      step: "04",
      layer: "LLM Synthesis",
      title: "Groq & LLaMA-3.3",
      body: "Accelerated inference using the llama-3.3-70b-versatile model to synthesize retrieved contexts into accurate legal strategy.",
      icon: Cpu,
      spec: "70B Ultra-Low Latency",
    },
  ];

  return (
    <section
      id="tech-stack"
      className="py-24 sm:py-32 px-6 sm:px-10 md:px-16 lg:px-20 bg-black border-b border-zinc-800 text-white relative"
    >
      {/* Anchor fallback for any legacy precedent links */}
      <span id="precedents" className="sr-only" aria-hidden="true" />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 bg-white rounded-[2px]" />
              <span className="text-xs text-zinc-400 font-medium">
                Tech Stack
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white">
              RAG Pipeline Architecture
            </h2>
          </div>
          <p className="font-sans text-sm text-zinc-400 max-w-md leading-relaxed font-light">
            A high-performance Retrieval-Augmented Generation system processing 5 years of Supreme Court judgments.
          </p>
        </div>

        {/* 4-Column ReactBits Spotlight Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {techStackItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <SpotlightCard
                key={idx}
                spotlightColor="rgba(255, 255, 255, 0.09)"
                className="group border border-white/10 hover:border-white/20 bg-zinc-950 p-6 md:p-7 min-h-[320px] flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header: Step & Icon Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-zinc-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                        {item.step}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">
                        {item.layer}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:border-white/20 motion-safe:transition-colors duration-200">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-lg font-normal text-white leading-snug pt-1">
                    {item.title}
                  </h3>

                  {/* Body description */}
                  <p className="font-sans text-xs text-zinc-400 font-light leading-relaxed">
                    {item.body}
                  </p>
                </div>

                {/* Card Spec Footer */}
                <div className="pt-4 mt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-500">
                    Engine Spec
                  </span>
                  <span className="text-[11px] font-mono text-zinc-300 bg-black/60 border border-white/10 px-2 py-0.5 rounded">
                    {item.spec}
                  </span>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
