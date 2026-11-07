import React from "react";
import { Scale, FileDown, BookOpen, RefreshCw } from "lucide-react";

export default function Navbar({
  representingSide,
  setRepresentingSide,
  onOpenReportModal,
  onQuickExportPdf,
  isExportingPdf,
  onResetSession,
  onToggleHero,
  showHero,
}) {
  return (
    <header className="h-16 border-b border-border-subtle bg-bg-primary/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Plaque */}
      <div className="flex items-center gap-3.5">
        <div className="w-8 h-8 rounded-sm bg-bg-surface-alt border border-border-subtle flex items-center justify-center text-text-primary">
          <Scale className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm tracking-tight text-text-primary font-bold">
              LAW AI
            </span>
            <span className="text-[10px] text-text-muted border border-border-subtle px-1.5 py-0.2 rounded">
              Since 2018
            </span>
          </div>
          <div className="text-[11px] text-text-muted">
            Supreme Court Jurisprudence Engine (76,802 indexed)
          </div>
        </div>
      </div>

      {/* Middle Stance Switcher */}
      <div className="flex items-center gap-3">
        <label htmlFor="stance-select" className="text-xs text-text-muted">
          Representing stance:
        </label>
        <div className="relative">
          <select
            id="stance-select"
            value={representingSide}
            onChange={(e) => setRepresentingSide(e.target.value)}
            className="bg-bg-surface border border-border-subtle text-xs text-text-primary rounded-full px-3.5 py-1.5 focus:border-border-strong focus:outline-none transition-colors cursor-pointer"
          >
            <option value="Petitioner / Appellant">Petitioner / Appellant</option>
            <option value="Respondent / Defense">Respondent / Defense</option>
            <option value="Neutral Evaluation">Neutral Evaluation</option>
          </select>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleHero}
          className="btn-modo-subtle text-xs"
          title="Toggle Exhibition Hero"
        >
          {showHero ? "Minimize overview" : "Exhibition overview"}
        </button>

        <button
          onClick={onResetSession}
          title="Reset Consultation"
          className="btn-modo-subtle p-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
        </button>

        <button
          onClick={onOpenReportModal}
          className="btn-modo-subtle text-xs"
        >
          <BookOpen className="w-3.5 h-3.5 text-color-gold" />
          <span>Strategy brief</span>
        </button>

        <button
          onClick={onQuickExportPdf}
          disabled={isExportingPdf}
          className="btn-modo text-xs"
        >
          <span className="btn-modo__dot" />
          <span className="roll-link">
            <span className="roll-link__inner">
              <span className="roll-link__text">
                {isExportingPdf ? "Generating PDF…" : "Export court PDF"}
              </span>
              <span className="roll-link__text">
                {isExportingPdf ? "Generating PDF…" : "Download brief"}
              </span>
            </span>
          </span>
          <FileDown className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>
    </header>
  );
}
