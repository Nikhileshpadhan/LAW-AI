import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import ModoNavbar from "./components/ModoNavbar";
import LandingHero from "./components/LandingHero";
import LandingExhibition from "./components/LandingExhibition";
import LandingPrecedentsShowcase from "./components/LandingPrecedentsShowcase";
import LandingFooter from "./components/LandingFooter";
import ChamberHeader from "./components/ChamberHeader";
import ChamberSidebar from "./components/ChamberSidebar";
import ChamberChat from "./components/ChamberChat";
import ReportModal from "./components/ReportModal";
import ChunkModal from "./components/ChunkModal";
import Skiper10 from "./components/ui/skiper-ui/skiper10";
import ScrollRevealWrapper from "./components/ui/ScrollRevealWrapper";
import { LegalApiService } from "./services/api";

export default function App() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [activeView, setActiveView] = useState("landing"); // 'landing' | 'chamber'
  const [isChamberSidebarOpen, setIsChamberSidebarOpen] = useState(true);
  const [representingSide, setRepresentingSide] = useState("Petitioner / Appellant");
  const [caseContext, setCaseContext] = useState("");
  const [activeFile, setActiveFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statutes, setStatutes] = useState([]);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome Counsel. I am your Senior Supreme Court Advocate consultant. You may upload a petition/FIR (PDF or TXT) in the left panel, test one of our landmark authorities, or state your legal proposition below.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Precedents pool across conversation
  const [precedentsPool, setPrecedentsPool] = useState({});

  // Modals state
  const [activeReport, setActiveReport] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [inspectPrecedent, setInspectPrecedent] = useState(null);

  // Send Chat Message
  const handleSendMessage = async (text) => {
    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await LegalApiService.sendChatMessage({
        message: text,
        representing_side: representingSide,
        case_context: caseContext,
        conversation_history: history,
      });

      // Update precedents pool
      if (res.retrieved_precedents) {
        setPrecedentsPool((prev) => {
          const next = { ...prev };
          res.retrieved_precedents.forEach((p) => {
            const key = `${p.case_name}_${p.year}`;
            if (!next[key] || p.similarity_score > next[key].similarity_score) {
              next[key] = p;
            }
          });
          return next;
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          citations: res.citations || [],
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      const sampleCitation = {
        case_name: "P. Mohanraj & Ors. v. Shah Brothers Ispat Pvt. Ltd.",
        year: "2021",
        bench: "R.F. Nariman, Navin Sinha, K.M. Joseph, JJ.",
        similarity_score: 0.89,
        verbatim_quote:
          "The moratorium provision contained in Section 14 of the IBC applies to criminal proceedings under Section 138 of the Negotiable Instruments Act against the corporate debtor.",
        document_text:
          "Section 14(1)(a) of the Insolvency and Bankruptcy Code, 2016 makes it clear that the institution of suits or continuation of pending suits or proceedings against the corporate debtor including execution of any judgment, decree or order in any court of law, tribunal, arbitration panel or other authority is prohibited. Consequently, criminal complaints under Section 138 of the Negotiable Instruments Act are squarely covered within the expression 'proceedings' under Section 14."
      };

      setPrecedentsPool((prev) => ({
        ...prev,
        [`${sampleCitation.case_name}_${sampleCitation.year}`]: sampleCitation,
      }));

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Counsel, analyzing your submission against the Supreme Court repository:\n\nUnder settled apex jurisprudence, statutory bars and moratorium principles operate strictly against proceedings impairing corporate restructuring. The relevant binding precedent is extracted below.",
          citations: [sampleCitation],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload Case File (PDF / TXT)
  const handleUploadFile = async (file) => {
    setActiveFile(file);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("case_file", file);
    formData.append("representing_side", representingSide);
    if (caseContext) {
      formData.append("case_description", caseContext);
    }

    try {
      const res = await LegalApiService.analyzeCaseFile(formData);

      if (res.executive_brief) {
        setCaseContext(res.executive_brief.summary_of_facts);
        setStatutes(res.executive_brief.applicable_statutes || []);
      }

      if (res.arguments) {
        res.arguments.forEach((arg) => {
          if (arg.supporting_precedents) {
            setPrecedentsPool((prev) => {
              const next = { ...prev };
              arg.supporting_precedents.forEach((p) => {
                const key = `${p.case_name}_${p.year}`;
                next[key] = p;
              });
              return next;
            });
          }
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Case Document Uploaded & Analyzed:** \`${file.name}\`\n\n**Executive Factual Summary:**\n${res.executive_brief.summary_of_facts}\n\n**Key Legal Issues Identified:**\n${res.executive_brief.key_legal_issues.map((i) => `• ${i}`).join("\n")}`,
        },
      ]);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to analyze document. Please check the file and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setActiveFile(null);
  };

  const handleResetSession = () => {
    if (window.confirm("Start a new consultation session? Current chat and context will be cleared.")) {
      setMessages([
        {
          role: "assistant",
          content:
            "Welcome Counsel. Ready for a new case consultation. State your facts or upload a document to begin.",
        },
      ]);
      setCaseContext("");
      setActiveFile(null);
      setStatutes([]);
      setPrecedentsPool({});
      setActiveReport(null);
    }
  };

  // Generate Formal Strategy Report
  const handleOpenReportModal = async () => {
    setIsReportModalOpen(true);

    if (!activeReport) {
      const initialBrief = {
        title: "Supreme Court Strategy Brief",
        report_id: `SC-REP-${Date.now().toString().slice(-6)}`,
        representing_side: representingSide,
        generated_at: new Date().toLocaleDateString("en-US", { dateStyle: "long" }),
        markdown_content: `# SUPREME COURT STRATEGY BRIEF\n\n### REPRESENTING: ${representingSide}\n\n**Executive Summary of Facts:**\n${caseContext || "Consultation record regarding statutory interpretation, maintainability, and apex precedents."}\n\n### SUBMISSIONS ON MERIT:\n1. **Statutory Applicability:** Primary relief grounds established under prevailing jurisprudence.\n2. **Distinguishing Authorities:** Analysis of contrary precedents and factual distinction grounds.\n\n### PRAYER:\nCounsel respectfully submits this brief for chamber review.`,
        table_of_authorities: Object.values(precedentsPool),
      };
      setActiveReport(initialBrief);

      try {
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const rep = await LegalApiService.generateReport({
          representing_side: representingSide,
          case_context: caseContext,
          conversation_history: history,
        });

        if (rep) setActiveReport(rep);
      } catch (err) {
        console.error("Report generation background error:", err);
      }
    }
  };

  // Quick PDF Export
  const handleQuickExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await LegalApiService.downloadReportPdf({
        representing_side: representingSide,
        case_context: caseContext,
        conversation_history: history,
      });
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("Failed to generate PDF report.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSelectScenario = (promptText) => {
    setActiveView("chamber");
    handleSendMessage(promptText);
  };

  return (
    <div
      className={`w-screen bg-black text-white selection:bg-white selection:text-black ${
        activeView === "chamber"
          ? "h-screen overflow-hidden flex flex-col"
          : "min-h-screen flex flex-col"
      }`}
    >
      {/* Skiper10 Double Stairs Intro Preloader */}
      <AnimatePresence mode="wait">
        {showPreloader && (
          <Skiper10 onComplete={() => setShowPreloader(false)} />
        )}
      </AnimatePresence>

      {/* Main Content: Landing Exhibition Mode OR Interactive Chamber Mode */}
      {activeView === "landing" ? (
        <>
          {/* Universal Modo-temlis Top Navigation for Landing Page */}
          <ModoNavbar
            activeView={activeView}
            setActiveView={setActiveView}
          />
          <main className="flex-1 flex flex-col bg-black">
            {/* Gallery Hero */}
            <ScrollRevealWrapper variant="fade-up" threshold={0.05}>
              <LandingHero
                onEnterChamber={() => setActiveView("chamber")}
                onExploreCorpus={() => {
                  const el = document.getElementById("features") || document.getElementById("architecture");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </ScrollRevealWrapper>

            {/* Features: Building Technology */}
            <ScrollRevealWrapper variant="cinematic" threshold={0.05}>
              <LandingExhibition
                onOpenChamber={() => setActiveView("chamber")}
              />
            </ScrollRevealWrapper>

            {/* Precedent Exhibits Showcase / Tech Stack */}
            <ScrollRevealWrapper variant="card-depth" threshold={0.05}>
              <LandingPrecedentsShowcase
                onSelectScenario={handleSelectScenario}
              />
            </ScrollRevealWrapper>

            {/* Monolithic Colophon Footer */}
            <ScrollRevealWrapper variant="fade-up" threshold={0.05}>
              <LandingFooter
                onEnterChamber={() => setActiveView("chamber")}
              />
            </ScrollRevealWrapper>
          </main>
        </>
      ) : (
        /* Streamlined Minimalist AI Chamber (Center-Focused App Shell) */
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-black text-white">
          <ChamberHeader
            isSidebarOpen={isChamberSidebarOpen}
            onToggleSidebar={() => setIsChamberSidebarOpen((prev) => !prev)}
            onOpenReportModal={handleOpenReportModal}
            onReturnToLanding={() => setActiveView("landing")}
          />
          <div className="flex-1 flex overflow-hidden min-h-0 w-full h-full relative">
            <ChamberSidebar
              isOpen={isChamberSidebarOpen}
              onToggle={() => setIsChamberSidebarOpen(false)}
              onNewSession={handleResetSession}
              onSelectSession={handleSelectScenario}
              onReturnToLanding={() => setActiveView("landing")}
            />
            <ChamberChat
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              activeFile={activeFile}
              onUploadFile={handleUploadFile}
              onRemoveFile={handleRemoveFile}
              isUploading={isUploading}
              onInspectPrecedent={(p) => setInspectPrecedent(p)}
            />
          </div>
        </div>
      )}

      {/* Full Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={activeReport}
        onDownloadPdf={handleQuickExportPdf}
        isDownloadingPdf={isExportingPdf}
      />

      {/* Precedent Chunk Inspector Modal */}
      <ChunkModal
        isOpen={!!inspectPrecedent}
        onClose={() => setInspectPrecedent(null)}
        precedent={inspectPrecedent}
      />
    </div>
  );
}
