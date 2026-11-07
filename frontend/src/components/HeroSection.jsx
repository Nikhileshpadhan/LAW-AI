import React from "react";
import { ArrowUpRight, Cpu } from "lucide-react";

export default function HeroSection({ onStartIngestion, onStartChat, onOpenReport }) {
  return (
    <section className="bg-bg-hero border-b border-border-subtle px-8 py-10 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        {/* Left Column: Massive Headline & Editorial Lead */}
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs text-text-muted bg-bg-primary/40 border border-border-subtle rounded-full px-3 py-1">
            <span>Supreme Court of India</span>
            <span className="text-text-primary">·</span>
            <span>Five-Year Precedent Archive (2018 to 2024)</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-text-primary leading-[1.05]">
            Supreme Court
            <br />
            Precedent Engine
          </h1>

          <p className="text-sm md:text-base text-text-body max-w-2xl leading-relaxed">
            Indexed across 76,802 landmark Supreme Court judgments for rapid legal argument synthesis.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button onClick={onStartChat} className="btn-modo whitespace-nowrap">
              <span className="btn-modo__dot" />
              <span className="roll-link whitespace-nowrap">
                <span className="roll-link__inner whitespace-nowrap">
                  <span className="roll-link__text whitespace-nowrap">Consult chamber</span>
                  <span className="roll-link__text whitespace-nowrap">Consult</span>
                </span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button onClick={onStartIngestion} className="btn-modo-subtle whitespace-nowrap">
              <span className="whitespace-nowrap">01 / Ingest facts</span>
            </button>

            <button onClick={onOpenReport} className="btn-modo-subtle whitespace-nowrap">
              <span className="whitespace-nowrap">02 / Generate brief</span>
            </button>
          </div>
        </div>

        {/* Right Column: Curatorial Metrics & Stack Placard */}
        <div className="w-full md:w-80 flex flex-col gap-2.5">
          <div className="p-4 bg-bg-primary/80 border border-border-subtle rounded-lg space-y-3">
            <div className="text-xs text-text-muted flex items-center justify-between">
              <span>Repository telemetry</span>
              <span className="w-2 h-2 rounded-full bg-color-emerald" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="text-2xl font-bold text-text-primary">76,802</div>
                <div className="text-[11px] text-text-muted">ChromaDB vectors</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">768-D</div>
                <div className="text-[11px] text-text-muted">Legal-BERT dense</div>
              </div>
            </div>

            <div className="border-t border-border-subtle pt-2.5 flex items-center justify-between text-[11px] text-text-muted">
              <span>Engine model</span>
              <span className="text-text-primary font-medium">openai/gpt-oss-120b</span>
            </div>
          </div>

          <div className="p-3 bg-bg-surface/90 border border-border-subtle rounded-lg flex items-center gap-3 text-xs text-text-muted">
            <Cpu className="w-4 h-4 text-text-primary flex-shrink-0" />
            <span>Sub-second cosine search across 5-year apex judgments</span>
          </div>
        </div>
      </div>
    </section>
  );
}
