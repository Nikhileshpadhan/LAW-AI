import React from "react";
import { Database, ShieldCheck, Cpu, FileCheck, ArrowUpRight } from "lucide-react";
import { SkiperCardStack } from "./ui/skiper-ui/skiper16";

export default function LandingExhibition({ onOpenChamber }) {
  const pillars = [
    {
      num: "01",
      icon: Database,
      title: "Five-Year Supreme Court Corpus",
      desc: "Complete repository of 76,802 apex judgment chunks indexed from 2018 to 2024 with rich metadata including case title, citation, bench composition, and judgment year.",
      spec: "ChromaDB Vector Store · 768 Dimensions",
      badge: "Apex Judgments",
    },
    {
      num: "02",
      icon: Cpu,
      title: "Dense Legal-BERT Embedding Layer",
      desc: "Local PyTorch Legal-BERT model encoding legal propositions with specialized attention over judicial terminology, statutory definitions, and precedent citations.",
      spec: "Sentence Transformers · Mean Pooling",
      badge: "Transformer Core",
    },
    {
      num: "03",
      icon: ShieldCheck,
      title: "Groq openai/gpt-oss-120b Synthesis",
      desc: "Advanced multi-stage reasoning pipeline executing factual matrix extraction, statutory mapping, query formulation, and counter-argument analysis.",
      spec: "Senior Advocate System Persona",
      badge: "Deep Reasoning",
    },
    {
      num: "04",
      icon: FileCheck,
      title: "Verbatim Quotation Grounding",
      desc: "Guaranteed authenticity through verbatim citation excerpts extracted directly from authentic apex judgments with exact cosine similarity match metrics.",
      spec: "Zero-Hallucination Guardrail",
      badge: "Strict Attribution",
    },
  ];

  return (
    <section
      id="features"
      className="py-24 sm:py-32 px-6 sm:px-10 md:px-16 lg:px-20 bg-black border-b border-zinc-800 text-white"
    >
      {/* Asymmetric Split Layout with Sticky Pinned Left Column & Skiper16 Card Stack on the Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start max-w-7xl mx-auto">
        {/* Left Column: Strictly Sticky Pinned Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-32 h-fit space-y-6 text-left">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 bg-white rounded-[2px]" />
              <span className="text-xs text-zinc-400 font-medium">
                Building Technology
              </span>
            </div>

          {/* Heading in High-Contrast Classic Serif Font */}
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white leading-[1.08]">
            Building
            <br />
            Technology
          </h2>

          {/* Subheading in Clean Soft Silver Sans-Serif Font */}
          <p className="font-sans text-sm sm:text-base text-zinc-400 font-light leading-relaxed max-w-sm">
            Four structural pillars designed for senior advocates, corporate counsel, and litigators
            requiring instant precedent verification.
          </p>

          {/* CTA Action Button with Pure White Monochromatic Arrow */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenChamber}
              className="btn-modo-outline h-11 px-5 text-sm font-medium rounded cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none flex items-center gap-2"
            >
              <span>Test live in chamber</span>
              <ArrowUpRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Right Column: Skiper16 Vertical Card Stack Scroll Animation */}
        <div className="lg:col-span-7 w-full">
          <SkiperCardStack items={pillars} />
        </div>
      </div>
    </section>
  );
}
